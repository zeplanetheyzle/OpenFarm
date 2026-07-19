from fastapi import APIRouter
from app.preference_supabase import preference_supabase

router = APIRouter()

@router.get("/smartfarms")
def get_my_smartfarms(email: str):
    response = preference_supabase.table("smartfarms")\
        .select("*")\
        .eq("user_email", email)\
        .execute()
    return response.data

@router.post("/smartfarms")
def register_smartfarm(body: dict):
    response = preference_supabase.table("smartfarms")\
        .insert(body)\
        .execute()
    return response.data

@router.delete("/smartfarms/{farm_id}")
def delete_smartfarm(farm_id: int):
    response = preference_supabase.table("smartfarms")\
        .delete()\
        .eq("id", farm_id)\
        .execute()
    return {"message": "삭제 완료"}