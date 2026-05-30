import os
from datetime import datetime, timedelta

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from dbsetup import collection


load_dotenv()


GEOAPIFY_PLACES_URL = "https://api.geoapify.com/v2/places"
NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"
REQUEST_TIMEOUT_SECONDS = 10
ALERT_RADIUS_METERS = 5000
ALERT_EXPIRY_MINUTES = 30
USER_AGENT = "surakshasathi-crime-detector"
API_KEY = os.getenv("SURAKSHASATHI_API_KEY")


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


@app.get("/")
def health_check() -> dict[str, str]:
    return {"message": "Surakshasathi API is running."}


@app.post("/camera-crime")
@app.post("/update-location")
def update_location(location: Location) -> dict:
    nearby_areas = get_nearby_areas(location.latitude, location.longitude)
    crime_report = create_crime_report(nearby_areas)
    collection.insert_one(crime_report)

    return {
        "result": "Crime alert stored successfully.",
        "main_area": crime_report["main_area"],
        "nearby_areas": nearby_areas,
        "expires_in_minutes": ALERT_EXPIRY_MINUTES,
    }


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
