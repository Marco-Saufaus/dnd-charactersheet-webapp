import json
import os
from dnd_backend.config.database import MongoManager

COLLECTION_NAME: str = "bestiary"
BESTIARY_JSON_PATH: str = f"{os.getcwd()}/../data/5etools-v2.10.2/data/bestiary/bestiary-xphb.json"

def matches_criteria(bestiary: dict) -> bool:
    source: str = bestiary.get("source")
    if source == "XPHB":
        return True
    return False

async def import_bestiary() -> list[dict]:
    MongoManager.connect_to_database()
    try:
        with open(BESTIARY_JSON_PATH, encoding="utf-8") as f:
            data: dict = json.load(f)
            bestiary_raw = data.get("monster", [])
            bestiary: list[dict] = list(bestiary_raw)
            bestiary_to_insert: list[dict] = [b for b in bestiary if matches_criteria(b)]
            if bestiary_to_insert:
                await MongoManager.insert_data(bestiary_to_insert, COLLECTION_NAME)
            else:
                print("No bestiary entries matched the criteria. Nothing inserted.")
            return [b['name'] for b in bestiary_to_insert]
    finally:
        MongoManager.close_database_connection()
