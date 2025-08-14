import json
import os
from dnd_backend.config.database import MongoManager

COLLECTION_NAME = "backgrounds"
# Use the original working-directory-based relative path
BACKGROUNDS_JSON_PATH = f"{os.getcwd()}/../data/5etools-v2.10.2/data/backgrounds.json"

def matches_criteria(background):
    source = background.get("source")
    if source == "XPHB":
        return True
    return False

async def import_backgrounds():
    # Ensure a single shared connection is used
    MongoManager.connect_to_database()
    try:
        with open(BACKGROUNDS_JSON_PATH, encoding="utf-8") as f:
            data = json.load(f)
            backgrounds = data.get("background", [])
            backgrounds_to_insert = [b for b in backgrounds if matches_criteria(b)]

            if backgrounds_to_insert:
                await MongoManager.insert_data(backgrounds_to_insert, COLLECTION_NAME)
            else:
                print("No backgrounds matched the criteria. Nothing inserted.")
    finally:
        MongoManager.close_database_connection()
