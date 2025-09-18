import json
import os
from dnd_backend.config.database import MongoManager

COLLECTION_NAME = "optionalfeatures"
OPTIONALFEATURES_JSON_PATH = f"{os.getenv("DND_DATA_PATH")}/optionalfeatures.json"

def matches_criteria(optionalfeature):
    source = optionalfeature.get("source")
    type = optionalfeature.get("featureType")
    if source == "XPHB":
        return True
    return False

async def import_optionalfeatures():
    MongoManager.connect_to_database()
    try:
        with open(OPTIONALFEATURES_JSON_PATH, encoding="utf-8") as f:
            data = json.load(f)
            optionalfeatures = data.get("optionalfeature", [])
            optionalfeatures_to_insert = [o for o in optionalfeatures if matches_criteria(o)]
            if optionalfeatures_to_insert:
                await MongoManager.insert_data(optionalfeatures_to_insert, COLLECTION_NAME)
            else:
                print("No Optional Features matched the criteria. Nothing inserted.")
            names = [o['name'] for o in optionalfeatures_to_insert]
            raw_types: list[str] = [t for o in optionalfeatures_to_insert for t in o['featureType']]
            feature_types = sorted(set(raw_types))
            return names + feature_types
    finally:
        MongoManager.close_database_connection()
