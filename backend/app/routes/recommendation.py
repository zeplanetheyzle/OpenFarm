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

    recommended_temperature = max(
        24,
        min(
            avg_temperature,
            26
        )
    )

    recommended_temperature2 = (
        temperature2
    )

    recommended_humidity = max(
        60,
        min(
            humidity,
            70
        )
    )

    recommended_co2 = max(
        800,
        min(
            co2,
            1000
        )
    )

    return {

    "recommendations":
    recommendations,

    "recommended_temperature":

    round(
        recommended_temperature,
        1
    ),

    "recommended_temperature2":

    round(
        recommended_temperature2,
        1
    ),

    "recommended_humidity":

    round(
        recommended_humidity,
        1
    ),

    "recommended_co2":

    round(
        recommended_co2,
        0
    )
}