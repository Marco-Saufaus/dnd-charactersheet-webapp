import json
import os
from dnd_backend.config.database import MongoManager

COLLECTION_NAME = "races"
RACES_JSON_PATH = f"{os.getenv("DND_DATA_PATH")}/races.json"

def matches_criteria(race):
    source = race.get("source")
    if source == "XPHB":
        return True
    return False

async def import_races():
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
            return [r['name'] for r in races_to_insert]
    finally:
        MongoManager.close_database_connection()
