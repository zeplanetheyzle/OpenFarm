from supabase import create_client

import os

from dotenv import load_dotenv

load_dotenv()

PREFERENCE_URL = os.getenv(
    "PREFERENCE_SUPABASE_URL"
)

PREFERENCE_KEY = os.getenv(
    "PREFERENCE_SUPABASE_KEY"
)
print(
    "PREFERENCE_URL =",
    PREFERENCE_URL
)

preference_supabase = create_client(

    PREFERENCE_URL,

    PREFERENCE_KEY
)