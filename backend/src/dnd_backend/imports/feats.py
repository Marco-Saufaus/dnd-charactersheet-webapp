import json
import os
from dnd_backend.config.database import MongoManager

COLLECTION_NAME = "feats"
# Use the original working-directory-based relative path
FEATS_JSON_PATH = f"{os.getcwd()}/../data/5etools-v2.10.2/data/feats.json"

def matches_criteria(feat):
    source = feat.get("source")
    if source == "XPHB":
        return True
    return False

async def import_feats():
    # Ensure a single shared connection is used
    MongoManager.connect_to_database()
    try:
        with open(FEATS_JSON_PATH, encoding="utf-8") as f:
            data = json.load(f)
            feats = data.get("feat", [])
            feats_to_insert = [f for f in feats if matches_criteria(f)]

            if feats_to_insert:
                await MongoManager.insert_data(feats_to_insert, COLLECTION_NAME)
            else:
                print("No feats matched the criteria. Nothing inserted.")

            # Return list of feat names followed by unique categories (user request)
            names = [f['name'] for f in feats_to_insert]
            categories = sorted(set(f['category'] for f in feats_to_insert))
            return names + categories
    finally:
        MongoManager.close_database_connection()
