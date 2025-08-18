import json
import os
from dnd_backend.config.database import MongoManager

COLLECTION_NAME = "conditions"
# Use the original working-directory-based relative path
CONDITIONS_JSON_PATH = f"{os.getcwd()}/../data/5etools-v2.10.2/data/conditionsdiseases.json"

def matches_criteria(action):
    source = action.get("source")
    if source == "XPHB":
        return True
    return False

async def import_conditions():
    # Ensure a single shared connection is used
    MongoManager.connect_to_database()
    try:
        with open(CONDITIONS_JSON_PATH, encoding="utf-8") as f:
            data = json.load(f)
            conditions = data.get("condition", [])
            conditions_to_insert = [a for a in conditions if matches_criteria(a)]

            if conditions_to_insert:
                await MongoManager.insert_data(conditions_to_insert, COLLECTION_NAME)
            else:
                print("No conditions matched the criteria. Nothing inserted.")
    finally:
        MongoManager.close_database_connection()
