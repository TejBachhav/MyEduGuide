from motor.motor_asyncio import AsyncIOMotorClient

MONGO_DETAILS = "mongodb://localhost:27017"

client = AsyncIOMotorClient(MONGO_DETAILS)

database = client.career_portal

user_collection = database.get_collection("users")
profile_collection = database.get_collection("profiles")

# Phase 2: Aptitude test collections
questions_collection = database.get_collection("questions")
aptitude_results_collection = database.get_collection("aptitude_results")
