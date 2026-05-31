from __future__ import annotations

import os
import secrets
import tempfile
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any

import requests
from bson import ObjectId
from bson.errors import InvalidId
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import ReturnDocument

from dbsetup import admins_collection, alerts_collection, reports_collection
from modelsup import DEFAULT_MODEL_PATH, load_trained_model, predict_video
from supasetup import SUPABASE_EVIDENCE_BUCKET, build_evidence_path, supabase


load_dotenv()


GEOAPIFY_PLACES_URL = "https://api.geoapify.com/v2/places"
NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"
REQUEST_TIMEOUT_SECONDS = 10
ALERT_RADIUS_METERS = 5000
ALERT_EXPIRY_MINUTES = 30
SIGNED_URL_EXPIRY_SECONDS = 300
USER_AGENT = "surakshasathi-crime-detector"
VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv"}
API_KEY = os.getenv("SURAKSHASATHI_API_KEY")
MODEL_PATH = Path(os.getenv("VIDEO_MODEL_PATH", DEFAULT_MODEL_PATH))
NON_CRIME_CLASSES = {"Normal"}
POLICE_SUPER_ADMIN_KEY = os.getenv("POLICE_SUPER_ADMIN_KEY")


app = FastAPI(title="Surakshasathi API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Location(BaseModel):
    latitude: float
    longitude: float
    accuracy: float | None = None


class PoliceAdminCreate(BaseModel):
    name: str
    email: str
    badge_number: str
    station: str
    role: str = "police_admin"


class PoliceAdminLogin(BaseModel):
    email: str
    admin_key: str


class PoliceReportCreate(BaseModel):
    title: str
    incident_type: str
    area: str
    description: str
    priority: str = "medium"
    status: str = "open"
    officer_name: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class PoliceReportUpdate(BaseModel):
    title: str | None = None
    incident_type: str | None = None
    area: str | None = None
    description: str | None = None
    priority: str | None = None
    status: str | None = None
    officer_name: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class PublicReportCreate(BaseModel):
    latitude: float
    longitude: float


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def serialize_value(value: Any) -> Any:
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, list):
        return [serialize_value(item) for item in value]
    if isinstance(value, dict):
        return {key: serialize_value(item) for key, item in value.items()}
    return value


def serialize_document(document: dict[str, Any]) -> dict[str, Any]:
    serialized = serialize_value(document)
    if "_id" in serialized:
        serialized["id"] = serialized.pop("_id")
    return serialized


def parse_object_id(raw_id: str) -> ObjectId:
    try:
        return ObjectId(raw_id)
    except InvalidId as exc:
        raise HTTPException(status_code=400, detail=f"Invalid id: {raw_id}") from exc


def validate_video_filename(file_name: str | None) -> str:
    suffix = Path(file_name or "").suffix.lower()
    if suffix not in VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported video format. Use .mp4, .avi, .mov, or .mkv.",
        )
    return suffix


def get_nearby_areas(latitude: float, longitude: float) -> list[str]:
    if not API_KEY:
        raise HTTPException(
            status_code=500,
            detail="Missing Geoapify API key. Set SURAKSHASATHI_API_KEY in .env.",
        )

    params = {
        "categories": (
            "populated_place.city,"
            "populated_place.suburb,"
            "populated_place.neighbourhood"
        ),
        "filter": f"circle:{longitude},{latitude},{ALERT_RADIUS_METERS}",
        "limit": 20,
        "apiKey": API_KEY,
    }

    try:
        response = requests.get(
            GEOAPIFY_PLACES_URL,
            params=params,
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Could not fetch nearby areas from Geoapify: {exc}",
        ) from exc

    data = response.json()
    areas = {
        feature.get("properties", {}).get("name", "").strip()
        for feature in data.get("features", [])
    }
    cleaned_areas = sorted(area for area in areas if area)
    if not cleaned_areas:
        raise HTTPException(
            status_code=404,
            detail="No nearby populated areas were found for this location.",
        )
    return cleaned_areas


def get_area_from_coordinates(latitude: float, longitude: float) -> str | None:
    try:
        response = requests.get(
            NOMINATIM_REVERSE_URL,
            params={"format": "json", "lat": latitude, "lon": longitude},
            headers={"User-Agent": USER_AGENT},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Could not reverse geocode the location: {exc}",
        ) from exc

    address = response.json().get("address", {})
    return (
        address.get("suburb")
        or address.get("neighbourhood")
        or address.get("city")
        or address.get("town")
        or address.get("village")
        or address.get("state_district")
    )


def create_alert_document(latitude: float, longitude: float, event_type: str) -> dict[str, Any]:
    nearby_areas = get_nearby_areas(latitude, longitude)
    now = utcnow()
    return {
        "event_type": event_type,
        "main_area": nearby_areas[0] if nearby_areas else None,
        "nearby_areas": nearby_areas,
        "latitude": latitude,
        "longitude": longitude,
        "detected_at": now,
        "expires_at": now + timedelta(minutes=ALERT_EXPIRY_MINUTES),
    }


def create_and_store_alert(latitude: float, longitude: float, event_type: str) -> dict[str, Any]:
    alert_document = create_alert_document(latitude, longitude, event_type)
    alerts_collection.insert_one(alert_document)
    return {
        "result": "Crime alert stored successfully.",
        "event_type": event_type,
        "main_area": alert_document["main_area"],
        "nearby_areas": alert_document["nearby_areas"],
        "expires_in_minutes": ALERT_EXPIRY_MINUTES,
    }


def require_super_admin(
    x_super_admin_key: str | None = Header(default=None, alias="X-Super-Admin-Key"),
) -> None:
    if not POLICE_SUPER_ADMIN_KEY:
        raise HTTPException(
            status_code=500,
            detail="POLICE_SUPER_ADMIN_KEY is missing. Add it to .env first.",
        )
    if x_super_admin_key != POLICE_SUPER_ADMIN_KEY:
        raise HTTPException(status_code=401, detail="Invalid super admin key.")


def require_police_admin(
    x_admin_email: str | None = Header(default=None, alias="X-Admin-Email"),
    x_admin_key: str | None = Header(default=None, alias="X-Admin-Key"),
) -> dict[str, Any]:
    if not x_admin_email or not x_admin_key:
        raise HTTPException(
            status_code=401,
            detail="X-Admin-Email and X-Admin-Key headers are required.",
        )

    admin = admins_collection.find_one(
        {
            "email": x_admin_email,
            "admin_key": x_admin_key,
            "is_active": True,
        }
    )
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid admin credentials.")
    return serialize_document(admin)


def create_police_admin(payload: PoliceAdminCreate) -> dict[str, Any]:
    existing_admin = admins_collection.find_one({"email": payload.email})
    if existing_admin:
        raise HTTPException(status_code=409, detail="Admin with this email already exists.")

    now = utcnow()
    admin_document = {
        **payload.model_dump(),
        "admin_key": secrets.token_urlsafe(24),
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    result = admins_collection.insert_one(admin_document)
    admin_document["_id"] = result.inserted_id
    return serialize_document(admin_document)


def create_police_report(payload: PoliceReportCreate, admin: dict[str, Any]) -> dict[str, Any]:
    now = utcnow()
    report_document = {
        **payload.model_dump(),
        "report_source": "admin",
        "created_by_admin_id": admin["id"],
        "created_by_email": admin["email"],
        "reporter_name": None,
        "reporter_phone": None,
        "created_at": now,
        "updated_at": now,
        "evidence_file_name": None,
        "evidence_path": None,
        "evidence_uploaded_at": None,
    }
    result = reports_collection.insert_one(report_document)
    report_document["_id"] = result.inserted_id
    return serialize_document(report_document)


def create_public_report(payload: PublicReportCreate) -> dict[str, Any]:
    now = utcnow()
    area_name = get_area_from_coordinates(payload.latitude, payload.longitude) or "Unknown area"
    report_document = {
        "title": f"Emergency report from {area_name}",
        "incident_type": "User submitted evidence",
        "area": area_name,
        "description": "Emergency evidence uploaded by a public user.",
        "reporter_name": None,
        "reporter_phone": None,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "priority": "medium",
        "status": "submitted",
        "officer_name": None,
        "report_source": "public",
        "created_by_admin_id": None,
        "created_by_email": None,
        "created_at": now,
        "updated_at": now,
        "evidence_file_name": None,
        "evidence_path": None,
        "evidence_uploaded_at": None,
    }
    result = reports_collection.insert_one(report_document)
    report_document["_id"] = result.inserted_id
    return serialize_document(report_document)


def update_police_report(report_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    update_payload = {key: value for key, value in payload.items() if value is not None}
    if not update_payload:
        raise HTTPException(status_code=400, detail="No fields were provided for update.")

    update_payload["updated_at"] = utcnow()
    mongo_id = parse_object_id(report_id)
    updated_report = reports_collection.find_one_and_update(
        {"_id": mongo_id},
        {"$set": update_payload},
        return_document=ReturnDocument.AFTER,
    )
    if not updated_report:
        raise HTTPException(status_code=404, detail=f"Police report '{report_id}' was not found.")
    return serialize_document(updated_report)


def list_police_reports(limit: int = 50) -> list[dict[str, Any]]:
    reports = reports_collection.find().sort("created_at", -1).limit(limit)
    return [serialize_document(report) for report in reports]


def normalize_signed_url(url_result: Any) -> str | None:
    if isinstance(url_result, str):
        return url_result
    if isinstance(url_result, dict):
        return (
            url_result.get("signedURL")
            or url_result.get("signedUrl")
            or url_result.get("signed_url")
        )
    return None


async def upload_police_evidence(report_id: str, file: UploadFile) -> dict[str, Any]:
    validate_video_filename(file.filename)
    report = reports_collection.find_one({"_id": parse_object_id(report_id)})
    if not report:
        raise HTTPException(status_code=404, detail=f"Police report '{report_id}' was not found.")

    storage_path = build_evidence_path(file.filename or "evidence.mp4")
    file_bytes = await file.read()
    try:
        supabase.storage.from_(SUPABASE_EVIDENCE_BUCKET).upload(
            path=storage_path,
            file=file_bytes,
            file_options={
                "content-type": file.content_type or "video/mp4",
                "upsert": "true",
            },
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Could not upload evidence video to Supabase Storage: {exc}",
        ) from exc

    return update_police_report(
        report_id,
        {
            "evidence_file_name": file.filename,
            "evidence_path": storage_path,
            "evidence_uploaded_at": utcnow(),
        },
    )


def create_evidence_access_link(report_id: str) -> dict[str, Any]:
    report = reports_collection.find_one({"_id": parse_object_id(report_id)})
    if not report:
        raise HTTPException(status_code=404, detail=f"Police report '{report_id}' was not found.")

    evidence_path = report.get("evidence_path")
    if not evidence_path:
        raise HTTPException(status_code=404, detail="No evidence video has been uploaded for this report.")

    try:
        signed_result = supabase.storage.from_(SUPABASE_EVIDENCE_BUCKET).create_signed_url(
            evidence_path,
            SIGNED_URL_EXPIRY_SECONDS,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Could not create signed evidence link: {exc}",
        ) from exc

    signed_url = normalize_signed_url(signed_result)
    if not signed_url:
        raise HTTPException(status_code=502, detail="Supabase did not return a signed URL.")

    return {
        "report_id": report_id,
        "bucket": SUPABASE_EVIDENCE_BUCKET,
        "evidence_path": evidence_path,
        "signed_url": signed_url,
        "expires_in_seconds": SIGNED_URL_EXPIRY_SECONDS,
    }


@lru_cache(maxsize=1)
def get_prediction_model():
    try:
        return load_trained_model(MODEL_PATH)
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Model file not found at {MODEL_PATH}. "
                "Train the model first using modelsup.py --mode train."
            ),
        ) from exc


@app.get("/")
def health_check() -> dict[str, str]:
    return {"message": "Surakshasathi API is running."}


@app.post("/update-location")
def update_location(location: Location) -> dict[str, Any]:
    area = get_area_from_coordinates(location.latitude, location.longitude)
    return {
        "message": "Location received",
        "latitude": location.latitude,
        "longitude": location.longitude,
        "accuracy": location.accuracy,
        "area": area,
    }


@app.post("/camera-crime")
def create_camera_crime_alert(location: Location) -> dict[str, Any]:
    return create_and_store_alert(location.latitude, location.longitude, "manual_report")


@app.post("/notify")
def notify_users(location: Location) -> dict[str, str]:
    area = get_area_from_coordinates(location.latitude, location.longitude)
    if not area:
        return {"message": "Could not detect your area."}

    active_alert = alerts_collection.find_one(
        {
            "expires_at": {"$gt": utcnow()},
            "$or": [
                {"main_area": area},
                {"nearby_areas": {"$in": [area]}},
            ],
        }
    )
    if active_alert:
        return {"message": f"Crime reported near {area}. Stay alert and take precautions."}
    return {"message": f"No recent crime reports near {area}. Stay safe!"}


@app.post("/reports/public")
async def create_public_report_with_evidence(
    latitude: float = Form(...),
    longitude: float = Form(...),
    file: UploadFile = File(...),
) -> dict[str, Any]:
    payload = PublicReportCreate(latitude=latitude, longitude=longitude)
    report = create_public_report(payload)
    report = await upload_police_evidence(report["id"], file)
    return {
        "message": "Public crime report submitted successfully. Police admins can now review it.",
        "area": report["area"],
        "latitude": report["latitude"],
        "longitude": report["longitude"],
        "report": report,
    }


@app.get("/model-status")
def model_status() -> dict[str, str]:
    return {
        "model_path": str(MODEL_PATH),
        "status": "ready" if MODEL_PATH.exists() else "missing",
    }


@app.post("/predict-video")
async def predict_uploaded_video(
    file: UploadFile = File(...),
    latitude: float | None = Form(None),
    longitude: float | None = Form(None),
    create_alert: bool = Form(False),
) -> dict[str, Any]:
    validate_video_filename(file.filename)
    model = get_prediction_model()

    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename or "").suffix) as temp_file:
        temp_path = Path(temp_file.name)
        temp_file.write(await file.read())

    try:
        prediction = predict_video(temp_path, model)
    finally:
        temp_path.unlink(missing_ok=True)

    if prediction is None:
        raise HTTPException(
            status_code=400,
            detail="The uploaded video could not be processed.",
        )

    response: dict[str, Any] = {
        "video_name": prediction["video_name"],
        "frames_used": prediction["frames_used"],
        "predicted_class": prediction["predicted_class"],
        "probabilities": prediction["probabilities"],
        "alert_created": False,
    }

    if create_alert:
        if prediction["predicted_class"] in NON_CRIME_CLASSES:
            response["alert_message"] = "Prediction is Normal, so no crime alert was created."
            return response
        if latitude is None or longitude is None:
            raise HTTPException(
                status_code=400,
                detail="latitude and longitude are required when create_alert is true.",
            )

        response["alert_created"] = True
        response["alert_details"] = create_and_store_alert(
            latitude,
            longitude,
            prediction["predicted_class"],
        )

    return response


@app.post("/admin/users")
def create_admin_user(
    payload: PoliceAdminCreate,
    _: None = Depends(require_super_admin),
) -> dict[str, Any]:
    admin = create_police_admin(payload)
    return {
        "message": "Police admin created successfully.",
        "admin": admin,
    }


@app.post("/admin/login")
def login_admin(payload: PoliceAdminLogin) -> dict[str, Any]:
    admin = admins_collection.find_one(
        {
            "email": payload.email,
            "admin_key": payload.admin_key,
            "is_active": True,
        }
    )
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid admin credentials.")
    return {
        "message": "Admin login successful.",
        "admin": serialize_document(admin),
    }


@app.get("/admin/reports")
def get_admin_reports(admin: dict[str, Any] = Depends(require_police_admin)) -> dict[str, Any]:
    return {
        "message": f"Reports fetched for admin {admin['email']}.",
        "reports": list_police_reports(),
    }


@app.post("/admin/reports")
def create_admin_report(
    payload: PoliceReportCreate,
    admin: dict[str, Any] = Depends(require_police_admin),
) -> dict[str, Any]:
    report = create_police_report(payload, admin)
    return {
        "message": "Police report created successfully.",
        "report": report,
    }


@app.patch("/admin/reports/{report_id}")
def patch_admin_report(
    report_id: str,
    payload: PoliceReportUpdate,
    _: dict[str, Any] = Depends(require_police_admin),
) -> dict[str, Any]:
    report = update_police_report(report_id, payload.model_dump(exclude_none=True))
    return {
        "message": "Police report updated successfully.",
        "report": report,
    }


@app.post("/admin/reports/{report_id}/evidence")
async def upload_admin_report_evidence(
    report_id: str,
    file: UploadFile = File(...),
    _: dict[str, Any] = Depends(require_police_admin),
) -> dict[str, Any]:
    report = await upload_police_evidence(report_id, file)
    return {
        "message": "Evidence uploaded successfully.",
        "bucket": SUPABASE_EVIDENCE_BUCKET,
        "report": report,
    }


@app.get("/admin/reports/{report_id}/evidence-link")
def get_admin_report_evidence_link(
    report_id: str,
    _: dict[str, Any] = Depends(require_police_admin),
) -> dict[str, Any]:
    return create_evidence_access_link(report_id)
