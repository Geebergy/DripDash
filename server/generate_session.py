import os
from pyrogram import Client
import asyncio

# Fetch details from environment variables
try:
    print("Fetching API credentials...")
    API_ID = int(os.getenv("API_ID"))
    API_HASH = os.getenv("API_HASH")
    print("API_ID:", API_ID)
    print("API_HASH fetched successfully.")
except Exception as e:
    print("Error fetching API credentials:", e)
    raise

try:
    print("Creating the Client instance...")
    app = Client("my_account", api_id=API_ID, api_hash=API_HASH)
    print("Client instance created successfully.")
except Exception as e:
    print("Error creating Client instance:", e)
    raise

async def main():
    print("Starting the application...")
    try:
        await app.start()
        print("Application started.")
        session_string = await app.export_session_string()
        print("Session string:", session_string)
    except Exception as e:
        print("Error during application execution:", e)
    finally:
        print("Stopping the application...")
        await app.stop()
        print("Application stopped.")

if __name__ == "__main__":
    print("Script is running...")
    asyncio.run(main())