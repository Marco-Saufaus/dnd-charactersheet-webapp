import json
import os
from dnd_backend.config.database import MongoManager

COLLECTION_NAME = "languages"
LANGUAGES_JSON_PATH = f"{os.getcwd()}/../data/5etools-v2.10.2/data/languages.json"

def matches_criteria(language):
    source = language.get("source")
    if source == "XPHB":
        return True
    return False

async def import_languages():
    MongoManager.connect_to_database()
    try:
        with open(LANGUAGES_JSON_PATH, encoding="utf-8") as f:
            data = json.load(f)
            languages = data.get("language", [])
            languages_to_insert = [l for l in languages if matches_criteria(l)]
            if languages_to_insert:
                await MongoManager.insert_data(languages_to_insert, COLLECTION_NAME)
            else:
                print("No languages matched the criteria. Nothing inserted.")
            return [l['name'] for l in languages_to_insert]
    finally:
        MongoManager.close_database_connection()
