"use client"

import { useState } from "react"

import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
export default function Login() {

    const router =
    useRouter()

    const [email,setEmail] =
    useState("")

    const [password,setPassword] =
    useState("")

    const login = async () => {

        const response = await fetch(

            "http://127.0.0.1:8000/login",

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

        if(

            data.message ===
            "Login successful"
        ){

            localStorage.setItem(

                "user",

                JSON.stringify(
                    data.user
                )
            )

            router.push("/")
        }
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

                    Login

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

                    onClick={login}

                    className="
                        bg-green-500
                        text-white
                        px-6
                        py-3
                    "
                >

                    Login

                </button>
        
            </div>
        </>
    )
}