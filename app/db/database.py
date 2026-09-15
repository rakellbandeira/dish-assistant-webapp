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

async def document_exists(collection, document_id: str):
    document = await collection.find_one({"_id": document_id})
    return document is not None