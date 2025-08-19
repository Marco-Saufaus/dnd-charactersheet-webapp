import json
import os
from dnd_backend.config.database import MongoManager

COLLECTION_NAME = "optionalfeatures"
# Use the original working-directory-based relative path
OPTIONALFEATURES_JSON_PATH = f"{os.getcwd()}/../data/5etools-v2.10.2/data/optionalfeatures.json"

def matches_criteria(optionalfeature):
    source = optionalfeature.get("source")
    type = optionalfeature.get("featureType")

    if source == "XPHB":
        return True
    return False

async def import_optionalfeatures():
    # Ensure a single shared connection is used
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
    finally:
        MongoManager.close_database_connection()
