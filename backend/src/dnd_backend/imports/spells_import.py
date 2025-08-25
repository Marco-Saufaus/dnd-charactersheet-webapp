import json
import os
from dnd_backend.config.database import MongoManager

COLLECTION_NAME = "spells"
SPELLS_JSON_PATH = f"{os.getcwd()}/../data/5etools-v2.10.2/data/spells/spells-xphb.json"

def matches_criteria(item):
    source = item.get("source")
    if source == "XPHB":
        return True
    return False

async def import_spells():
    MongoManager.connect_to_database()
    try:
        with open(SPELLS_JSON_PATH, encoding="utf-8") as f:
            data = json.load(f)
            spells = data.get("spell", [])
            spells_to_insert = []
            for s in spells:
                if matches_criteria(s):
                    # Add 'category' as string version of 'level' for backend compatibility
                    s = dict(s)  # copy to avoid mutating original
                    if 'level' in s:
                        s['category'] = str(s['level'])
                    spells_to_insert.append(s)
            if spells_to_insert:
                await MongoManager.insert_data(spells_to_insert, COLLECTION_NAME)
            else:
                print("No spells matched the criteria. Nothing inserted.")
            names = [s['name'] for s in spells_to_insert]
            
            return names
    finally:
        MongoManager.close_database_connection()
