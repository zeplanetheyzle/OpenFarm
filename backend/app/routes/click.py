from fastapi import APIRouter

from app.preference_supabase import (
    preference_supabase
)

router = APIRouter()

@router.post("/click/{section}")

def add_click(

    section: str,

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

    if len(response.data) == 0:

        (

            preference_supabase

            .table(
                "user_preference"
            )

            .insert({

                "email": email,

                "graph_click": 0,

                "table_click": 0,

                "report_click": 0
            })

            .execute()
        )

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

    current = response.data[0].get(

        f"{section}_click",

        0
    )

    (

        preference_supabase

        .table(
            "user_preference"
        )

        .update({

            f"{section}_click":

            current + 1

        })

        .eq(
            "email",
            email
        )

        .execute()
    )

    return {

        "message":

        "updated"
    }