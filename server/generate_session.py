import os
from pyrogram import Client
import asyncio
import sys

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

# Ensure to provide the phone number via command-line arguments or environment variable
PHONE_NUMBER = sys.argv[1] if len(sys.argv) > 1 else None

if not PHONE_NUMBER:
    raise Exception("Phone number not provided.")

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
        
        # Check if the user is authorized
        if not await app.is_user_authorized():
            # If the phone number is not authorized, it sends a code to the phone number
            await app.send_code_request(PHONE_NUMBER)
            print("Sent the code request to the phone number.")
        
        # Export session string
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