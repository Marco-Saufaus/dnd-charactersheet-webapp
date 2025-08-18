import json
import os
from dnd_backend.config.database import MongoManager

COLLECTION_NAME = "variants"
# Use the original working-directory-based relative path
VARIANTS_JSON_PATH = f"{os.getcwd()}/../data/5etools-v2.10.2/data/variantrules.json"

def matches_criteria(variant):
    source = variant.get("source")
    if source == "XPHB":
        return True
    return False

async def import_variants():
    # Ensure a single shared connection is used
    MongoManager.connect_to_database()
    try:
        with open(VARIANTS_JSON_PATH, encoding="utf-8") as f:
            data = json.load(f)
            variants = data.get("variant", [])
            variants_to_insert = [v for v in variants if matches_criteria(v)]

            if variants_to_insert:
                await MongoManager.insert_data(variants_to_insert, COLLECTION_NAME)
            else:
                print("No Variant Rule matched the criteria. Nothing inserted.")
    finally:
        MongoManager.close_database_connection()
