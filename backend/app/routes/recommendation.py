from fastapi import APIRouter
from app.supabase_client import supabase

router = APIRouter()

@router.get("/recommendation/{device_id}")
def get_recommendation(device_id: str):

    response = supabase.table(
        "sensor_logs"
    )\
    .select("*")\
    .eq("device_id", device_id)\
    .order("created_at", desc=True)\
    .limit(1)\
    .execute()

    print(response.data)

    if len(response.data) == 0:
        return {
            "recommendations":[
                "No sensor data found"
            ]
        }
    
    latest_data = response.data[0]

    temperature = latest_data["temperature"]

    temperature2 = latest_data["temperature2"]

    humidity = latest_data["humidity"]

    co2 = latest_data["co2_level"]

    recommendations = []

    avg_temperature = (
        temperature +
        temperature2
    ) / 2

    if humidity < 30:

        recommendations.append(
            "Increase watering frequency"
        )

    if avg_temperature > 30:

        recommendations.append(
            "Reduce light exposure"
        )

    if abs(
        temperature - temperature2
    ) > 5:

        recommendations.append(
            "Temperature imbalance detected"
        )

    if co2 > 900:

        recommendations.append(
            "Ventilation recommended"
        )

    if len(recommendations) == 0:

        recommendations.append(
            "Farm condition is stable"
        )

    return {

        "recommendations":
        recommendations
    }