from supabase import AsyncClient, acreate_client, create_client, Client
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()


def init_supabase() -> Client:
    """
    Initialize and return a Supabase client.
    Raises an exception if required environment variables are missing.
    """
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")

    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in the .env file")

    try:
        client = create_client(supabase_url, supabase_key)
        return client
    except Exception as e:
        raise Exception(f"Failed to initialize Supabase client: {str(e)}")

async def init_async_supabase() -> AsyncClient:
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")

    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in the .env file")

    try:
        client = await acreate_client(supabase_url, supabase_key)
        return client
    except Exception as e:
        raise Exception(f"Failed to initialize Supabase async client: {str(e)}")


# Initialize Supabase client
supabase: Client = init_supabase()
