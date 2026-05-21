#gpt사용
from supabase import create_client
from dotenv import load_dotenv

import os

#.env 환경 변수 불러오기
load_dotenv()

#Supabase URL 및 API key 가져오기
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

#Supabase 클라이언트 생성
supabase = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)