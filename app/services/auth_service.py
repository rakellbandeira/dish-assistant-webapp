from app.db.database import user_collection
from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.core.security import hash_password, verify_password, verify_password_dummy


class AuthService:

    @staticmethod
    async def get_user_by_email(email: str):
        email = email.strip().lower()

        return await user_collection.find_one({"email": email})

    @staticmethod
    async def get_user_by_id(user_id: str):
        from app.db.database import to_object_id

        object_id = to_object_id(user_id)

        if object_id is None:
            return None

        return await user_collection.find_one({"_id": object_id})
    
    @staticmethod
    async def create_user(
        email: str,
        username: str,
        password_hash: str,
    ):
        from datetime import datetime, timezone

        now = datetime.now(timezone.utc)

        user = {
            "email": email.strip().lower(),
            "username": username.strip(),
            "password_hash": password_hash,
            "terms_accepted_at": now,
            "created_at": now,
            "updated_at": now,
        }

        result = await user_collection.insert_one(user)

        return await user_collection.find_one({"_id": result.inserted_id})
    
    @staticmethod
    async def create_indexes():
        await user_collection.create_index(
            [("email", 1)],
            unique=True,
        )

        await user_collection.create_index(
            [("username", 1)],
            unique=True,
            collation={"locale": "en", "strength": 2},
        )

        await user_collection.create_index(
            [("created_at", -1)],
        )

    @staticmethod
    async def register(email: str, username: str, password: str):
        email = email.strip().lower()
        username = username.strip()

        # Check whether the email is already registered.
        existing_email = await AuthService.get_user_by_email(email)

        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email is already registered.",
            )

        # Check whether the username already exists (case-insensitive).
        existing_username = await user_collection.find_one(
            {"username": username},
            collation={"locale": "en", "strength": 2},
        )

        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username is already taken.",
            )

        # Hash the password before storing it.
        password_hash = hash_password(password)

        try:
            return await AuthService.create_user(
                email=email,
                username=username,
                password_hash=password_hash,
            )
        except DuplicateKeyError:
            # Handles a duplicate created between the checks and the insert.
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email or username is already registered.",
            )
    @staticmethod
    async def login(email: str, password: str):
        email = email.strip().lower()

        user = await AuthService.get_user_by_email(email)

        if not user:
            verify_password_dummy(password)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        if not verify_password(password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        return user