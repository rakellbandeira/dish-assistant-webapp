from app.db.database import preferences_collection


class PreferenceService:

    @staticmethod
    async def create_indexes():
        await preferences_collection.create_index(
            [("user_id", 1)],
            unique=True,
        )