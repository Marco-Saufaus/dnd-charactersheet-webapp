import json
import os
from dnd_backend.config.database import MongoManager

COLLECTION_NAME = "masteries"
MASTERIES_JSON_PATH = f"{os.getenv("DND_DATA_PATH")}/items-base.json"

def matches_criteria(item):
    source = item.get("source")
    if source == "XPHB":
        return True
    return False

async def import_masteries():
    MongoManager.connect_to_database()
    try:
        with open(MASTERIES_JSON_PATH, encoding="utf-8") as f:
            data = json.load(f)
            masteries = data.get("itemMastery", [])
            masteries_to_insert = [p for p in masteries if matches_criteria(p)]
            if masteries_to_insert:
                await MongoManager.insert_data(masteries_to_insert, COLLECTION_NAME)
            else:
                print("No masteries matched the criteria. Nothing inserted.")
            return [m['name'] for m in masteries_to_insert]
    finally:
        MongoManager.close_database_connection()