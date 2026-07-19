from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

CONTROL_URL = os.getenv("CONTROL_SUPABASE_URL")
CONTROL_KEY = os.getenv("CONTROL_SUPABASE_KEY")

control_supabase = create_client(CONTROL_URL, CONTROL_KEY)