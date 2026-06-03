"use client"

import Link from "next/link"

import { useEffect, useState } from "react"

export default function Navbar() {

    const [search, setSearch] = useState("")
    const [user, setUser] = useState<any>(null)
    useEffect(() => {

        const savedUser = localStorage.getItem(
            "user"
        )

        if(savedUser){

            setUser(
                JSON.parse(savedUser)
            )
        }

    }, [])

    return (

        <div className="w-full h-24 bg-green-100 flex items-center justify-between px-10">

            <Link href="/">

                <div className="text-3xl font-bold text-green-700 leading-8 cursor-pointer">

                    Public <br />
                    Smart Farm SET

                </div>

            </Link>

            <div className="flex gap-16 text-green-700 font-semibold text-xl">

                <Link href="/introduction">

                    <button className="cursor-pointer">

                        INTRODUCTION

                    </button>

                </Link>

                <Link href="/dataset">

                    <button className="cursor-pointer">

                        DATASET

                    </button>

                </Link>
                

            </div>

            <div className="flex gap-6 items-center">

                <input
                    type="text"

                    value={search}

                    onChange={(e) =>
                        setSearch(e.target.value)
                    }

                    onKeyDown={(e) => {

                        if (
                            e.key === "Enter"
                            &&
                            search.trim() !== ""
                        ) {

                            window.location.href =
                            `/crop/${search.trim()}`
                        }
                    }}

                    placeholder="Search"

                    className="
                        border-2
                        border-green-300
                        rounded-full
                        px-6
                        py-2
                    "
                />

                <Link href="/mypage">
                    <button className="text-xl">

                        ☰

                    </button>
                </Link>
                {
                    user

                    ?

                    <button

                        onClick={async () => {

                            localStorage.removeItem(
                                "user"
                            )

                            setUser(null)

                            location.reload()
                        }}

                        className="
                            bg-red-500
                            text-white
                            px-4
                            py-2
                            rounded-xl
                        "
                    >

                        Logout

                    </button>

                    :

                    <div className="flex gap-2">

                        <Link href="/login">

                            <button

                                className="
                                    bg-green-500
                                    text-white
                                    px-4
                                    py-2
                                    rounded-xl
                                "
                            >

                                Login

                            </button>

                        </Link>

                        <Link href="/signup">

                            <button

                                className="
                                    bg-blue-500
                                    text-white
                                    px-4
                                    py-2
                                    rounded-xl
                                "
                            >

                                Sign Up

                            </button>

                        </Link>

                    </div>
                }

            </div>

        </div>
    )
}