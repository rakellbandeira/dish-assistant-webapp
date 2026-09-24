from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings


client = AsyncIOMotorClient(settings.mongodb_url)

database = client[settings.database_name]

user_collection = database["user"]
menu_collection = database["menu"]
ai_recommendation_collection = database["ai_recommendation"]
dish_collection = database["dish"]
preferences_collection = database["preferences"]
feedback_collection = database["feedback"]

async def check_database_connection():
    await client.admin.command("ping")
    return True

def to_object_id(document_id: str) -> ObjectId | None:
    """Convert a string id (from a URL or JWT) to an ObjectId. Returns None if it isn't a valid id."""
    try:
        return ObjectId(document_id)
    except (InvalidId, TypeError):
        return None

async def document_exists(collection, document_id: str):
    object_id = to_object_id(document_id)
    if object_id is None:
        return False
    document = await collection.find_one({"_id": object_id})
    return document is not None