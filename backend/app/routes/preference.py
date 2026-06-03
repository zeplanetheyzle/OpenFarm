from fastapi import APIRouter

import subprocess

from app.preference_supabase import (
    preference_supabase
)

router = APIRouter()

@router.get("/preference")

def get_preference(
    email: str
):
    response = (

        preference_supabase

        .table(
            "user_preference"
        )

        .select("*")

        .eq(
            "email",
            email
        )

        .execute()
    )

    print("preference =", response.data)

    if len(response.data) == 0:

        return {
            "recommended_order":
            ["REPORT", "TABLE", "GRAPH"]
        }

    data = response.data[0]


    graph_click = data["graph_click"]

    report_click = data["report_click"]

    table_click = data["table_click"]

    result = subprocess.run(

        [

            "./app/cpp/preference_engine.exe",

            str(graph_click),

            str(report_click),

            str(table_click)
        ],

        capture_output=True,

        text=True
    )

    order = result.stdout.strip().split(",")

    return {

        "recommended_order":
        order,

        "pin_mode":
        data.get(
            "pin_mode",
            False
        ),

        "first_section":
        data.get(
            "first_section",
            "GRAPH"
        ),

        "second_section":
        data.get(
            "second_section",
            "REPORT"
        ),

        "third_section":
        data.get(
            "third_section",
            "TABLE"
        )
    }
    

