import json
import os
from dnd_backend.config.database import MongoManager

COLLECTION_NAME = "properties"
PROPERTIES_JSON_PATH = f"{os.getenv("DND_DATA_PATH")}/items-base.json"

def matches_criteria(item):
    source = item.get("source")
    if source == "XPHB":
        return True
    return False

async def import_properties():
    MongoManager.connect_to_database()
    try:
        with open(PROPERTIES_JSON_PATH, encoding="utf-8") as f:
            data = json.load(f)
            properties = data.get("itemProperty", [])
            properties_to_insert = [p for p in properties if matches_criteria(p)]
            # Ensure each property has a top-level name to match API models/queries
            for p in properties_to_insert:
                if "name" not in p:
                    n = next((e.get("name") for e in p.get("entries", []) if isinstance(e, dict) and "name" in e), None)
                    if n:
                        p["name"] = n
            if properties_to_insert:
                await MongoManager.insert_data(properties_to_insert, COLLECTION_NAME)
            else:
                print("No properties matched the criteria. Nothing inserted.")

            names = []
            for p in properties_to_insert:
                n = next((e.get("name") for e in p.get("entries", []) if isinstance(e, dict) and "name" in e), None)
                if n:
                    names.append(n)

            return names
    finally:
        MongoManager.close_database_connection()
