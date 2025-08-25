import json
import os
from dnd_backend.config.database import MongoManager

COLLECTION_NAME = "conditions"
STATUS_JSON_PATH = f"{os.getcwd()}/../data/5etools-v2.10.2/data/conditionsdiseases.json"

def matches_criteria(condition):
    source = condition.get("source")
    if source == "XPHB":
        return True
    return False

async def import_status():
    MongoManager.connect_to_database()
    try:
        with open(STATUS_JSON_PATH, encoding="utf-8") as f:
            data = json.load(f)
            status = data.get("status", [])
            status_to_insert = [c for c in status if matches_criteria(c)]
            if status_to_insert:
                await MongoManager.insert_data(status_to_insert, COLLECTION_NAME)
            else:
                print("No status matched the criteria. Nothing inserted.")
            return [s['name'] for s in status_to_insert]
    finally:
        MongoManager.close_database_connection()
