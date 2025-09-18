#!/bin/bash
set -e

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to be ready..."
until python -c "import pymongo; pymongo.MongoClient('${MONGODB_URL}').admin.command('ping')" 2>/dev/null; do
    echo "MongoDB not ready, waiting..."
    sleep 2
done

echo "MongoDB is ready! Running data import..."
python -m dnd_backend.import_data

echo "Data import completed. Starting server..."
exec "$@"