import json
import os
from dnd_backend.config.database import MongoManager

COLLECTION_NAME = "senses"
SENSES_JSON_PATH = f"{os.getcwd()}/../data/5etools-v2.10.2/data/senses.json"

def matches_criteria(sense):
    source = sense.get("source")
    if source == "XPHB":
        return True
    return False

async def import_senses():
    MongoManager.connect_to_database()
    try:
        with open(SENSES_JSON_PATH, encoding="utf-8") as f:
            data = json.load(f)
            senses = data.get("sense", [])
            senses_to_insert = [s for s in senses if matches_criteria(s)]
            if senses_to_insert:
                await MongoManager.insert_data(senses_to_insert, COLLECTION_NAME)
            else:
                print("No senses matched the criteria. Nothing inserted.")
            return [s['name'] for s in senses_to_insert]
    finally:
        MongoManager.close_database_connection()
