from fastapi import APIRouter

from app.preference_supabase import (
    preference_supabase
)

router = APIRouter()

@router.get("/preference-stats")
def get_stats(email: str):

    response = (preference_supabase
        .table("user_preference")
        .select("*")
        .eq("email", email)
        .execute()
    )

    if len(response.data) == 0:
        return {
            "graph": 0,
            "table": 0,
            "pin_mode": False,
            "first_section": "GRAPH",
            "second_section": "TABLE"
        }

    data = response.data[0]

    return {
        "graph": data["graph_click"],
        "table": data["table_click"],
        "pin_mode": data.get("pin_mode", False),
        "first_section": data.get("first_section", "GRAPH"),
        "second_section": data.get("second_section", "TABLE")
    }

@router.post("/save-layout")
def save_layout(data: dict):
    preference_supabase.table("user_preference")\
        .update({
            "pin_mode": data["pin_mode"],
            "first_section": data["first"],
            "second_section": data["second"],
        })\
        .eq("email", data["email"])\
        .execute()
    return {"message": "saved"}