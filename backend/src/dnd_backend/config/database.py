from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.database import Database
from typing import Any, Iterable
import os

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = "dnd_character_db"

class MongoManager:
    client: AsyncIOMotorClient | None = None
    db: Database | None = None
    _ref_count: int = 0  # number of active users of the shared client

    @classmethod
    def connect_to_database(cls) -> None:
        """Acquire (or create) a shared Mongo client.

        Safe to call multiple times; underlying client created once.
        """
        if cls.client is None:
            cls.client = AsyncIOMotorClient(MONGODB_URL)
            cls.db = cls.client[DATABASE_NAME]
            print("Connected to MongoDB (new client)")
        cls._ref_count += 1

    @classmethod
    def close_database_connection(cls) -> None:
        """Release a reference; close when last user done."""
        if cls.client is None:
            return
        cls._ref_count -= 1
        if cls._ref_count <= 0:
            cls.client.close()
            cls.client = None
            cls.db = None
            cls._ref_count = 0
            print("MongoDB connection closed (refcount reached zero)")

    @classmethod
    async def insert_data(cls, data_to_insert: Iterable[dict[str, Any]], collection_name: str) -> None:
        if cls.client is None or cls.db is None:
            # Auto-connect if not already connected (defensive)
            cls.connect_to_database()
        assert cls.db is not None
        collection = cls.db[collection_name]
        inserted = 0
        total = 0
        for a in data_to_insert:
            total += 1
            # Single atomic op: insert only if an identical document does not already exist
            res = await collection.update_one(a, {"$setOnInsert": a}, upsert=True)
            if res.upserted_id is not None:
                inserted += 1
        skipped = total - inserted
        print(f"[{collection_name}] Inserted: {inserted}, Skipped (identical exists): {skipped}")

    @classmethod
    async def overwrite_one(cls, collection_name: str, filter_doc: dict[str, Any], document: dict[str, Any]) -> None:
        """Unconditionally overwrite (replace) a single document.

        Simpler semantics for generated aggregates: delete then insert fresh.
        """
        if cls.client is None or cls.db is None:
            cls.connect_to_database()
        assert cls.db is not None
        collection = cls.db[collection_name]
        await collection.delete_one(filter_doc)
        # Ensure the filter identity (like _id) is present in stored doc
        merged = {**document, **filter_doc}
        await collection.insert_one(merged)
        print(f"[{collection_name}] Overwrote document {filter_doc}")
