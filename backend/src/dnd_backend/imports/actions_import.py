import json
import os
from dnd_backend.config.database import MongoManager

COLLECTION_NAME: str = "actions"
ACTIONS_JSON_PATH: str = f"{os.getcwd()}/../data/5etools-v2.10.2/data/actions.json"

def matches_criteria(action: dict) -> bool:
    source: str = action.get("source")
    if source == "XPHB":
        return True
    if source == "DMG" and action.get("basicRules") is True:
        return True
    return False

async def import_actions() -> list[dict]:
    MongoManager.connect_to_database()
    try:
        with open(ACTIONS_JSON_PATH, encoding="utf-8") as f:
            data: dict = json.load(f)
            actions_raw = data.get("action", [])
            actions: list[dict] = list(actions_raw)
            actions_to_insert: list[dict] = [a for a in actions if matches_criteria(a)]
            if actions_to_insert:
                await MongoManager.insert_data(actions_to_insert, COLLECTION_NAME)
            else:
                print("No actions matched the criteria. Nothing inserted.")
            return [a['name'] for a in actions_to_insert]
    finally:
        MongoManager.close_database_connection()
