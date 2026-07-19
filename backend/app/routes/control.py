from fastapi import APIRouter
from app.control_supabase import control_supabase

router = APIRouter()

@router.get("/control/latest")
async def get_latest_control(device_id: str = None):
    query = control_supabase.table("recommend_logs").select("*")
    if device_id:
        query = query.eq("device_id", device_id)
    response = query.order("created_at", desc=True).limit(1).execute()
    if response.data:
        return response.data[0]
    return {"error": "데이터 없음"}

@router.get("/control/history")
async def get_control_history(device_id: str):
    response = control_supabase.table("recommend_logs")\
        .select("*")\
        .eq("device_id", device_id)\
        .order("created_at", desc=False)\
        .execute()
    if response.data:
        return response.data
    return []