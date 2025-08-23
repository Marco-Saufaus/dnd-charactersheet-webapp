from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from dnd_backend.config.database import MongoManager
from dnd_backend.routers.actions_router import router as actions_router
from dnd_backend.routers.backgrounds_router import router as backgrounds_router
from dnd_backend.routers.characters_router import router as characters_router
from dnd_backend.routers.conditions_router import router as conditions_router
from dnd_backend.routers.feats_router import router as feats_router
from dnd_backend.routers.baseitems_router import router as baseitem_router
from dnd_backend.routers.items_router import router as items_router
from dnd_backend.routers.item_masteries_router import router as item_masteries_router
from dnd_backend.routers.item_properties_router import router as item_properties_router
from dnd_backend.routers.language_router import router as languages_router
from dnd_backend.routers.optionalfeatures_router import router as optionalfeatures_router
from dnd_backend.routers.races_router import router as races_router
from dnd_backend.routers.senses_router import router as senses_router
from dnd_backend.routers.skills_router import router as skills_router
from dnd_backend.routers.variants_router import router as variants_router

app = FastAPI(
    title="D&D Character Sheet API",
    description="API for managing D&D character sheets",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    MongoManager.connect_to_database()

@app.on_event("shutdown")
async def shutdown_db_client():
    MongoManager.close_database_connection()

@app.get("/")
async def root():
    return {"message": "Welcome to D&D Character Sheet API"}
    
# Include routers
app.include_router(actions_router)
app.include_router(backgrounds_router)
app.include_router(characters_router)
app.include_router(conditions_router)
app.include_router(feats_router)
app.include_router(baseitem_router)
app.include_router(items_router)
app.include_router(item_masteries_router)
app.include_router(item_properties_router)
app.include_router(languages_router)
app.include_router(optionalfeatures_router)
app.include_router(races_router)
app.include_router(senses_router)
app.include_router(skills_router)
app.include_router(variants_router)

