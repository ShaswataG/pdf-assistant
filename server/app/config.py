import os
from dotenv import load_dotenv
import cloudinary

load_dotenv()

# get the DB file path from environment, default to ./db/database.db
DB_DIR = os.getenv("DB_DIR", "./db")

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)
