from fastapi import APIRouter

from pydantic import BaseModel

from app.preference_supabase import (
    preference_supabase
)

router = APIRouter()

class User(BaseModel):

    email: str

    password: str


@router.post("/signup")

def signup(user: User):

    response = (

        preference_supabase

        .table("users")

        .select("*")

        .eq("email", user.email)

        .execute()
    )

    if response.data:

        return {

            "message":
            "User already exists"
        }

    (

        preference_supabase

        .table("users")

        .insert({

            "email":
            user.email,

            "password":
            user.password
        })

        .execute()
    )

    return {

        "message":
        "Signup successful"
    }


@router.post("/login")

def login(user: User):

    response = (

        preference_supabase

        .table("users")

        .select("*")

        .eq("email", user.email)

        .eq("password", user.password)

        .execute()
    )

    if not response.data:

        return {

            "message":
            "Invalid email or password"
        }

    return {

        "message":
        "Login successful",

        "user":
        response.data[0]
    }