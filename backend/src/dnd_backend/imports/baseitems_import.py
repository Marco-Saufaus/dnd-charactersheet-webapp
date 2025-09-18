import json
import os
from dnd_backend.config.database import MongoManager

COLLECTION_NAME = "items"
BASEITEMS_JSON_PATH = f"{os.getenv("DND_DATA_PATH")}/items-base.json"

def matches_criteria(baseitem):
    source = baseitem.get("source")
    age = baseitem.get("age")
    if source == "XPHB" or source == "XDMG":
        if age:
            return False
        return True
    return False

async def import_baseitems():
    MongoManager.connect_to_database()
    try:
        with open(BASEITEMS_JSON_PATH, encoding="utf-8") as f:
            data = json.load(f)
            baseitems = data.get("baseitem", [])
            baseitems_to_insert = [b for b in baseitems if matches_criteria(b)]
            if baseitems_to_insert:
                assert MongoManager.db is not None
                collection = MongoManager.db[COLLECTION_NAME]
                upserted = 0
                for b in baseitems_to_insert:
                    doc = dict(b)
                    doc["origin"] = "baseitems"
                    filt = {"name": doc.get("name"), "source": doc.get("source")}
                    res = await collection.replace_one(filt, doc, upsert=True)
                    if res.upserted_id is not None or res.modified_count > 0:
                        upserted += 1
                print(f"[items] Upserted baseitems: {upserted} (tagged origin=baseitems)")
            else:
                print("No baseitems matched the criteria. Nothing inserted.")
            names = [f['name'] for f in baseitems_to_insert]
            categories = sorted(set(f['category'] for f in baseitems_to_insert if 'category' in f))
            
            return names + categories
    finally:
        MongoManager.close_database_connection()
