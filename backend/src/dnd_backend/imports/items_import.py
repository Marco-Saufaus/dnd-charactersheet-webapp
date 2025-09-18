import json
import os
from dnd_backend.config.database import MongoManager

COLLECTION_NAME = "items"
ITEMS_JSON_PATH = f"{os.getenv("DND_DATA_PATH")}/items.json"

def matches_criteria(item):
    source = item.get("source")
    age = item.get("age")
    if source == "XPHB" or source == "XDMG":
        if age:
            return False
        return True
    return False

async def import_items():
    MongoManager.connect_to_database()
    try:
        with open(ITEMS_JSON_PATH, encoding="utf-8") as f:
            data = json.load(f)
            items = data.get("item", [])
            items_to_insert = [f for f in items if matches_criteria(f)]
            if items_to_insert:
                await MongoManager.insert_data(items_to_insert, COLLECTION_NAME)
            else:
                print("No items matched the criteria. Nothing inserted.")
            names = [f['name'] for f in items_to_insert]
            categories = sorted(set(f['category'] for f in items_to_insert if 'category' in f))
            
            return names + categories
    finally:
        MongoManager.close_database_connection()
