import os
import tempfile
from datetime import datetime, timedelta
from functools import lru_cache
from pathlib import Path

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from dbsetup import collection
from modelsup import DEFAULT_MODEL_PATH, load_trained_model, predict_video


load_dotenv()


GEOAPIFY_PLACES_URL = "https://api.geoapify.com/v2/places"
NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"
REQUEST_TIMEOUT_SECONDS = 10
ALERT_RADIUS_METERS = 5000
ALERT_EXPIRY_MINUTES = 30
USER_AGENT = "surakshasathi-crime-detector"
API_KEY = os.getenv("SURAKSHASATHI_API_KEY")
MODEL_PATH = Path(os.getenv("VIDEO_MODEL_PATH", DEFAULT_MODEL_PATH))
NON_CRIME_CLASSES = {"Normal"}


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


def get_nearby_areas(latitude: float, longitude: float) -> list[str]:
    """Fetch nearby populated places around the crime location."""
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
    """Resolve the user's coordinates into a practical area name."""
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


def create_crime_report(areas: list[str]) -> dict:
    """Create a short-lived alert document for MongoDB."""
    now = datetime.utcnow()
    return {
        "main_area": areas[0] if areas else None,
        "nearby_areas": areas,
        "detected_at": now,
        "expires_at": now + timedelta(minutes=ALERT_EXPIRY_MINUTES),
    }


@lru_cache(maxsize=1)
def get_prediction_model():
    """Load the trained TensorFlow model once and reuse it for API requests."""
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


def create_and_store_alert(latitude: float, longitude: float, event_type: str) -> dict:
    """Create a crime alert document enriched with nearby area details."""
    nearby_areas = get_nearby_areas(latitude, longitude)
    crime_report = create_crime_report(nearby_areas)
    crime_report["event_type"] = event_type
    crime_report["latitude"] = latitude
    crime_report["longitude"] = longitude
    collection.insert_one(crime_report)

    return {
        "result": "Crime alert stored successfully.",
        "event_type": event_type,
        "main_area": crime_report["main_area"],
        "nearby_areas": nearby_areas,
        "expires_in_minutes": ALERT_EXPIRY_MINUTES,
    }


@app.get("/")
def health_check() -> dict[str, str]:
    return {"message": "Surakshasathi API is running."}


@app.get("/model-status")
def model_status() -> dict[str, str]:
    return {"model_path": str(MODEL_PATH), "status": "ready" if MODEL_PATH.exists() else "missing"}


@app.post("/camera-crime")
def update_location(location: Location) -> dict:
    return create_and_store_alert(location.latitude, location.longitude, "manual_report")


@app.post("/predict-video")
async def predict_uploaded_video(
    file: UploadFile = File(...),
    latitude: float | None = Form(None),
    longitude: float | None = Form(None),
    create_alert: bool = Form(False),
) -> dict:
    file_extension = Path(file.filename or "").suffix.lower()
    if file_extension not in {".mp4", ".avi", ".mov", ".mkv"}:
        raise HTTPException(
            status_code=400,
            detail="Unsupported video format. Use .mp4, .avi, .mov, or .mkv.",
        )

    model = get_prediction_model()

    with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
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

    response = {
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

        alert_details = create_and_store_alert(
            latitude,
            longitude,
            prediction["predicted_class"],
        )
        response["alert_created"] = True
        response["alert_details"] = alert_details

    return response


@app.post("/notify")
def notify_users(location: Location) -> dict[str, str]:
    area = get_area_from_coordinates(location.latitude, location.longitude)
    if not area:
        return {"message": "Could not detect your area."}

    active_alert = collection.find_one(
        {
            "expires_at": {"$gt": datetime.utcnow()},
            "$or": [
                {"main_area": area},
                {"nearby_areas": {"$in": [area]}},
            ],
        }
    )

    if active_alert:
        return {
            "message": f"Crime reported near {area}. Stay alert and take precautions."
        }

    return {"message": f"No recent crime reports near {area}. Stay safe!"}
