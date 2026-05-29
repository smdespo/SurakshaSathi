from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Allow frontend requests
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
    accuracy: float


@app.post("/update-location")
def update_location(location: Location):

    print("\n===== LIVE USER LOCATION =====")
    print("Latitude:", location.latitude)
    print("Longitude:", location.longitude)
    print("Accuracy:", location.accuracy, "meters")

    return {
        "message": "Location received",
        "latitude": location.latitude,
        "longitude": location.longitude
    }
    