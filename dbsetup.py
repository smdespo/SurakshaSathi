import os

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ConfigurationError, OperationFailure, ServerSelectionTimeoutError
from pymongo.server_api import ServerApi


load_dotenv()


MONGO_URI = os.getenv("MONGO_URL")
DATABASE_NAME = os.getenv("MONGO_DB_NAME", "crime_detection")
COLLECTION_NAME = os.getenv("MONGO_COLLECTION_NAME", "camera_crime")
REPORTS_COLLECTION_NAME = os.getenv("MONGO_REPORTS_COLLECTION", "police_reports")
ADMINS_COLLECTION_NAME = os.getenv("MONGO_ADMINS_COLLECTION", "police_admins")


if not MONGO_URI:
    raise RuntimeError("MONGO_URL is missing. Add your MongoDB Atlas URI to .env.")


try:
    client = MongoClient(
        MONGO_URI,
        server_api=ServerApi("1"),
        serverSelectionTimeoutMS=10000,
    )
    client.admin.command("ping")
except ConfigurationError as exc:
    raise RuntimeError(
        "MongoDB Atlas configuration error. Check the URI format and ensure dnspython is installed."
    ) from exc
except OperationFailure as exc:
    raise RuntimeError(
        "MongoDB Atlas authentication failed. Check username, password, and database access."
    ) from exc
except ServerSelectionTimeoutError as exc:
    raise RuntimeError(
        "Could not reach MongoDB Atlas. Check internet access, Atlas IP access list, and cluster status."
    ) from exc


db = client[DATABASE_NAME]
collection = db[COLLECTION_NAME]
alerts_collection = db[COLLECTION_NAME]
reports_collection = db[REPORTS_COLLECTION_NAME]
admins_collection = db[ADMINS_COLLECTION_NAME]
