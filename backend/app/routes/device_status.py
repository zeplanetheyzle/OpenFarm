from fastapi import APIRouter

from app.supabase_client import supabase

from datetime import datetime

router = APIRouter()

@router.get("/device-status/{device_id}")
def get_device_status(device_id: str):

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

            "temperature_sensor": "OFFLINE",

            "temperature2_sensor": "OFFLINE",

            "humidity_sensor": "OFFLINE",

            "co2_sensor": "OFFLINE",

            "device_connection": "OFFLINE",

            "last_update": "No Data"
        }

    latest_data = response.data[0]

    print(latest_data)

    # 안전하게 가져오기
    temperature = latest_data.get(
        "temperature",
        0
    )

    temperature2 = latest_data.get(
        "temperature2",
        0
    )

    humidity = latest_data.get(
        "humidity",
        0
    )

    co2 = latest_data.get(
        "co2_level",
        0
    )

    created_at = latest_data.get(
        "created_at",
        None
    )

    # Temperature Sensor
    if temperature > 35:

        temperature_sensor = "WARNING"

    else:

        temperature_sensor = "ACTIVE"

    # Temperature2 Sensor
    if temperature2 > 35:

        temperature2_sensor = "WARNING"

    else:

        temperature2_sensor = "ACTIVE"

    # Humidity Sensor
    if humidity < 30:

        humidity_sensor = "WARNING"

    else:

        humidity_sensor = "STABLE"

    # CO2 Sensor
    if co2 > 900:

        co2_sensor = "WARNING"

    else:

        co2_sensor = "ACTIVE"

    # Last Update 계산
    last_update = "Unknown"

    if created_at:

        created_time = datetime.fromisoformat(

            str(created_at.replace("Z", "+00:00"))

        )

        now = datetime.now(
            created_time.tzinfo
        )

        time_diff = now - created_time

        minutes = int(
            time_diff.total_seconds() / 60
        )

        if minutes < 60:

            last_update = (
                f"{minutes} mins ago"
            )

        else:

            hours = minutes // 60

            last_update = (
                f"{hours} hours ago"
            )

    return {

        "temperature_sensor":
        temperature_sensor,

        "temperature2_sensor":
        temperature2_sensor,

        "humidity_sensor":
        humidity_sensor,

        "co2_sensor":
        co2_sensor,

        "device_connection":
        "ONLINE",

        "last_update":
        last_update
    }