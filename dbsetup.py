import pymongo
from dotenv import load_dotenv
load_dotenv()
client=pymongo.MongoClient("mongodb://localhost:27017/")
db=client['crime_detection']
collection=db['camera_crime']