from fastapi import APIRouter

from app.supabase_client import supabase

router = APIRouter()


# 작물 종류별 센서 데이터 조회
@router.get("/sensor-data/{crop_type}")
def get_sensor_data(crop_type: str):

    response = supabase.table(
        "sensor_logs"
    ).select("*").eq(
        "crop_type",
        crop_type
    ).execute()

    return response.data


# 전체 센서 데이터 조회
@router.get("/sensor-data")
def get_all_sensor_data():

    response = supabase.table(
        "sensor_logs"
    ).select("*").execute()
    #전체 데이터 반환
    return response.data