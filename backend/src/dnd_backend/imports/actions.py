import json
import os
from dnd_backend.config.database import MongoManager

COLLECTION_NAME = "actions"
# Use the original working-directory-based relative path
ACTIONS_JSON_PATH = f"{os.getcwd()}/../data/5etools-v2.10.2/data/actions.json"

def matches_criteria(action):
    source = action.get("source")
    if source == "XPHB":
        return True
    if source == "DMG" and action.get("basicRules") is True:
        return True
    return False

async def import_actions():
    # Ensure a single shared connection is used
    MongoManager.connect_to_database()
    try:
        with open(ACTIONS_JSON_PATH, encoding="utf-8") as f:
            data = json.load(f)
            actions = data.get("action", [])
            actions_to_insert = [a for a in actions if matches_criteria(a)]

            if actions_to_insert:
                await MongoManager.insert_data(actions_to_insert, COLLECTION_NAME)
            else:
                print("No actions matched the criteria. Nothing inserted.")
    finally:
        MongoManager.close_database_connection()
