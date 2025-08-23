import json
import os
from dnd_backend.config.database import MongoManager

COLLECTION_NAME = "itemgroups"
ITEMGROUPS_JSON_PATH = f"{os.getcwd()}/../data/5etools-v2.10.2/data/items.json"

def matches_criteria(item):
    source = item.get("source")
    if source == "XPHB" or source == "XDMG":
        return True
    return False


async def import_itemgroups():
    MongoManager.connect_to_database()
    try:
        with open(ITEMGROUPS_JSON_PATH, encoding="utf-8") as f:
            data = json.load(f)
            itemgroups = data.get("itemGroup", [])
            itemgroups_to_insert = [g for g in itemgroups if matches_criteria(g)]
            if itemgroups_to_insert:
                await MongoManager.insert_data(itemgroups_to_insert, COLLECTION_NAME)
            else:
                print("No item groups matched the criteria. Nothing inserted.")
            names = [g['name'] for g in itemgroups_to_insert if 'name' in g]
            return names
    finally:
        MongoManager.close_database_connection()
