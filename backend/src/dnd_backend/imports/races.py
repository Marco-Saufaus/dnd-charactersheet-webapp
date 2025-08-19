import json
import os
from dnd_backend.config.database import MongoManager

COLLECTION_NAME = "races"
# Use the original working-directory-based relative path
RACES_JSON_PATH = f"{os.getcwd()}/../data/5etools-v2.10.2/data/races.json"

def matches_criteria(race):
    source = race.get("source")

    if source == "XPHB":
        return True
    return False

async def import_races():
    # Ensure a single shared connection is used
    MongoManager.connect_to_database()
    try:
        with open(RACES_JSON_PATH, encoding="utf-8") as f:
            data = json.load(f)
            races = data.get("race", [])
            races_to_insert = [r for r in races if matches_criteria(r)]

            if races_to_insert:
                await MongoManager.insert_data(races_to_insert, COLLECTION_NAME)
            else:
                print("No races matched the criteria. Nothing inserted.")
    finally:
        MongoManager.close_database_connection()
