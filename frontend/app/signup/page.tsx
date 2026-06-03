"use client"

import { useState } from "react"
import Navbar from "@/components/Navbar"

export default function SignUp() {

    const [email,setEmail] =
    useState("")

    const [password,setPassword] =
    useState("")

    const signUp = async () => {

        const response = await fetch(

            "http://127.0.0.1:8000/signup",

            {

                method: "POST",

                headers: {

                    "Content-Type":
                    "application/json"
                },

                body: JSON.stringify({

                    email,

                    password
                })
            }
        )

        const data =
        await response.json()

        alert(data.message)
    }

    return (
        <>
            <Navbar />

            <div 
                className="
                    min-h-screen
                    bg-white
                    text-black
                    p-20
                "
            >

                <h1 className="text-4xl mb-8">

                    Sign Up

                </h1>

                <input

                    value={email}

                    onChange={(e)=>
                        setEmail(
                            e.target.value
                        )
                    }

                    placeholder="Email"

                    className="
                        border
                        p-3
                        block
                        mb-4
                    "
                />

                <input

                    type="password"

                    value={password}

                    onChange={(e)=>
                        setPassword(
                            e.target.value
                        )
                    }

                    placeholder="Password"

                    className="
                        border
                        p-3
                        block
                        mb-4
                    "
                />

                <button

                    onClick={signUp}

                    className="
                        bg-blue-500
                        text-white
                        px-6
                        py-3
                    "
                >

                    Sign Up

                </button>

            </div>
        </>
    )
}