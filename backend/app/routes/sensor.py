from fastapi import APIRouter

from app.supabase_client import supabase
from app.preference_supabase import preference_supabase

router = APIRouter()


# 작물 종류별 센서 데이터 조회
@router.get("/sensor-logs/{crop_type}")
def get_sensor_logs(crop_type: str):

    response = supabase.table(
        "sensor_logs"
    ).select("*").eq(
        "crop_type",
        crop_type
    ).execute()

    return response.data


# 전체 센서 데이터 조회
@router.get("/sensor-logs")
def get_all_sensor_logs():

    response = supabase.table(
        "sensor_logs"
    ).select("*").execute()
    #전체 데이터 반환
    return response.data

@router.get("/latest")
async def get_latest_sensor(device_id: str = None):
    query = supabase.table("sensor_logs").select("*")
    if device_id:
        query = query.eq("device_id", device_id)
    response = query.order("created_at", desc=True).limit(1).execute()
    if response.data:
        return response.data[0]
    return {"error": "데이터 없음"}

@router.get("/devices/{crop_type}")
def get_devices_by_crop(crop_type: str):
    # 수집형 스마트팜 고정 정보
    DEVICE_INFO = {
        "openfarm1": { "location": "숭실대 형남공학관 5층 과방", "size": "Small" },
        "openfarm2": { "location": "숭실대 정보과학관 B1층 과방", "size": "Small" },
    }

    response = supabase.table("sensor_logs")\
        .select("device_id, created_at")\
        .eq("crop_type", crop_type)\
        .order("created_at", desc=True)\
        .execute()

    seen = set()
    result = []
    for row in response.data:
        device_id = row["device_id"]
        if device_id not in seen:
            seen.add(device_id)
            # pi_integrated_test같은 테스트용 기기는 제외
            if device_id not in DEVICE_INFO:
                continue
            info = DEVICE_INFO[device_id]
            result.append({
                "device_id": device_id,
                "created_at": row["created_at"],
                "crop_type": crop_type,
                "location": info["location"],
                "size": info["size"],
            })
    
    result.sort(key=lambda x: x["device_id"])
    return result