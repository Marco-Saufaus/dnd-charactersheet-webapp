import json
import os
import glob
from dnd_backend.config.database import MongoManager

CLASSES_COLLECTION: str = "classes"
SUBCLASSES_COLLECTION: str = "subclasses"
CLASSFEATURE_COLLECTION: str = "classFeatures"
CLASSES_DIR_PATH: str = f"{os.getenv('DND_DATA_PATH')}/class/"

def matches_criteria(item: dict) -> bool:
    """Check if class or subclass has source XPHB"""
    source: str = item.get("source")
    return source == "XPHB"

async def import_classes() -> dict:
    """Import classes and subclasses from all class JSON files"""
    MongoManager.connect_to_database()
    try:
        # Find all class JSON files
        json_files = glob.glob(os.path.join(CLASSES_DIR_PATH, "class-*.json"))
        
        all_classes = []
        all_subclasses = []
        all_classFeatures = []
        all_subclassFeatures = []
        
        for json_file in json_files:
            try:
                with open(json_file, encoding="utf-8") as f:
                    data: dict = json.load(f)
                    
                    # Import classes
                    classes_raw = data.get("class", [])
                    xphb_classes = [c for c in classes_raw if matches_criteria(c)]
                    all_classes.extend(xphb_classes)
                    
                    # Import subclasses
                    subclasses_raw = data.get("subclass", [])
                    xphb_subclasses = [s for s in subclasses_raw if matches_criteria(s)]
                    all_subclasses.extend(xphb_subclasses)

                    # Import class features
                    class_features_raw = data.get("classFeature", [])
                    xphb_classFeatures = [f for f in class_features_raw if matches_criteria(f)]
                    all_classFeatures.extend(xphb_classFeatures)
                    
                    # Import subclass features
                    subclass_features_raw = data.get("subclassFeature", [])
                    xphb_subclassFeatures = [f for f in subclass_features_raw if matches_criteria(f)]
                    all_subclassFeatures.extend(xphb_subclassFeatures)

            except Exception as e:
                print(f"Error processing {json_file}: {e}")
                continue
        
        # Insert classes
        if all_classes:
            await MongoManager.insert_data(all_classes, CLASSES_COLLECTION)
        else:
            print("No XPHB classes found to insert")
            
        # Insert subclasses
        if all_subclasses:
            await MongoManager.insert_data(all_subclasses, SUBCLASSES_COLLECTION)
        else:
            print("No XPHB subclasses found to insert")

        # Insert class features
        if all_classFeatures:
            await MongoManager.insert_data(all_classFeatures, CLASSFEATURE_COLLECTION)
        else:
            print("No XPHB class features found to insert")

        # Insert subclass features
        if all_subclassFeatures:
            await MongoManager.insert_data(all_subclassFeatures, "subclassFeature")
        else:
            print("No XPHB subclass features found to insert")

        return {
            "classes": [c.get('name') for c in all_classes],
            "subclasses": [s.get('name') for s in all_subclasses],
            "classFeatures": [f.get('name') for f in all_classFeatures],
            "subclassFeatures": [f.get('name') for f in all_subclassFeatures]
        }
        
    finally:
        MongoManager.close_database_connection()
