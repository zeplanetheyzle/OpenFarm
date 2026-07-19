from fastapi import APIRouter
from app.preference_supabase import preference_supabase

router = APIRouter()

@router.get("/preference")
def get_preference(email: str):
    response = preference_supabase\
        .table("user_preference")\
        .select("*")\
        .eq("email", email)\
        .execute()

    if len(response.data) == 0:
        return {
            "recommended_order": ["GRAPH", "TABLE"],
            "pin_mode": False,
            "first_section": "GRAPH",
            "second_section": "TABLE",
        }

    data = response.data[0]

    graph_click = data.get("graph_click", 0) or 0
    table_click = data.get("table_click", 0) or 0

    # 클릭 수 기반으로 순서 결정
    if table_click > graph_click:
        order = ["TABLE", "GRAPH"]
    else:
        order = ["GRAPH", "TABLE"]

    return {
        "recommended_order": order,
        "pin_mode": data.get("pin_mode", False),
        "first_section": data.get("first_section", "GRAPH"),
        "second_section": data.get("second_section", "TABLE"),
    }