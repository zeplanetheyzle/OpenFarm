from fastapi import APIRouter
import subprocess

router = APIRouter()

@router.get("/preference")
def get_preference():

    graph_click = 3
    report_click = 50
    table_click = 2

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

    return {

        "recommended_ui":
        result.stdout.strip()
    }