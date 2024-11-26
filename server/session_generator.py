import os
from pyrogram import Client

# Fetch details from environment variables
API_ID = int(os.getenv("API_ID"))
API_HASH = os.getenv("API_HASH")

app = Client("my_account", api_id=API_ID, api_hash=API_HASH)

async def main():
    await app.start()
    print("Session string:", app.export_session_string())
    await app.stop()

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())