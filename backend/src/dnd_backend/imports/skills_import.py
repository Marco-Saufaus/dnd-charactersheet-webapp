import json
import os
from dnd_backend.config.database import MongoManager

COLLECTION_NAME = "skills"
SKILLS_JSON_PATH = f"{os.getcwd()}/../data/5etools-v2.10.2/data/skills.json"

def matches_criteria(skill):
    source = skill.get("source")
    if source == "XPHB":
        return True
    return False

async def import_skills():
    MongoManager.connect_to_database()
    try:
        with open(SKILLS_JSON_PATH, encoding="utf-8") as f:
            data = json.load(f)
            skills = data.get("skill", [])
            skills_to_insert = [s for s in skills if matches_criteria(s)]
            if skills_to_insert:
                await MongoManager.insert_data(skills_to_insert, COLLECTION_NAME)
            else:
                print("No skills matched the criteria. Nothing inserted.")
            return [s['name'] for s in skills_to_insert]
    finally:
        MongoManager.close_database_connection()
