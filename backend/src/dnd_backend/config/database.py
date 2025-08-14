from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.database import Database

MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "dnd_character_db"

class MongoManager:
    client: AsyncIOMotorClient = None
    db: Database = None

    @classmethod
    def connect_to_database(cls):
        cls.client = AsyncIOMotorClient(MONGODB_URL)
        cls.db = cls.client[DATABASE_NAME]
        print("Connected to MongoDB!")

    @classmethod
    def close_database_connection(cls):
        if cls.client:
            cls.client.close()
            print("MongoDB connection closed.")

    @classmethod
    async def insert_data(cls, data_to_insert, collection_name: str):
        collection = MongoManager.db[collection_name]
        inserted = 0
        for a in data_to_insert:
            # Single atomic op: insert only if an identical document does not already exist
            res = await collection.update_one(a, {"$setOnInsert": a}, upsert=True)
            if res.upserted_id is not None:
                inserted += 1
        skipped = len(data_to_insert) - inserted
        print(f"Inserted: {inserted}, Skipped (identical exists): {skipped}")
