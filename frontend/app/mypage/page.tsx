"use client"

import {

    useEffect,

    useState

} from "react"

import PreferencePieChart from "@/components/PreferencePieChart"
import Navbar from "@/components/Navbar"

export default function MyPage() {

    const [

        stats,

        setStats

    ] = useState({

        graph: 0,

        table: 0,

        report: 0
    })

    const [pinMode, setPinMode] =
    useState(false)

    const [first, setFirst] =
    useState("GRAPH")

    const [second, setSecond] =
    useState("REPORT")

    const [third, setThird] =
    useState("TABLE")

    useEffect(() => {

        const user = JSON.parse(

            localStorage.getItem(
                "user"
            ) || "{}"
        )

        fetch(

            `http://127.0.0.1:8000/preference-stats?email=${user.email}`

        )

        .then(

            res => res.json()
        )

        .then(

            data => {

                setStats(data)

                setPinMode(
                    data.pin_mode || false
                )

                setFirst(
                    data.first_section || "GRAPH"
                )

                setSecond(
                    data.second_section || "REPORT"
                )

                setThird(
                    data.third_section || "TABLE"
                )
            }
        )

    }, [])

    return (

        <>
            <Navbar/>
            <div className="
                    min-h-screen
                    bg-white
                    text-black
                    p-20
                "
            >

                <h1

                    className="
                        text-4xl
                        font-bold
                        mb-10
                    "
                >

                    User Preference

                </h1>

                <div
                    className="
                        flex
                        gap-10
                        items-start
                        mb-10
                    "
                >

                    <div
                        className="
                            bg-white
                            rounded-3xl
                            shadow-xl
                            p-10
                        "
                    >

                        <PreferencePieChart

                            graph={stats.graph}

                            table={stats.table}

                            report={stats.report}
                        />

                    </div>

                    <div
                        className="
                            bg-gray-100
                            p-6
                            rounded-2xl
                            min-w-[400px]
                        "
                    >

                        <h2
                            className="
                                text-2xl
                                font-bold
                                mb-4
                            "
                        >

                            Layout Settings

                        </h2>

                        <label
                            className="
                                flex
                                items-center
                                gap-3
                                mb-6
                            "
                        >

                            <input

                                type="checkbox"

                                checked={pinMode}

                                onChange={(e)=>

                                    setPinMode(
                                        e.target.checked
                                    )
                                }
                            />

                            Use Custom Layout

                        </label>

                        <div className="mb-4">

                            Priority 1

                            <select

                                value={first}

                                onChange={(e)=>

                                    setFirst(
                                        e.target.value
                                    )
                                }

                                className="
                                    border
                                    ml-4
                                    px-4
                                    py-2
                                "
                            >

                                <option>
                                    GRAPH
                                </option>

                                <option>
                                    REPORT
                                </option>

                                <option>
                                    TABLE
                                </option>

                            </select>

                        </div>

                        <div className="mb-4">

                            Priority 2

                            <select

                                value={second}

                                onChange={(e)=>

                                    setSecond(
                                        e.target.value
                                    )
                                }

                                className="
                                    border
                                    ml-4
                                    px-4
                                    py-2
                                "
                            >

                                <option>
                                    GRAPH
                                </option>

                                <option>
                                    REPORT
                                </option>

                                <option>
                                    TABLE
                                </option>

                            </select>

                        </div>

                        <div className="mb-6">

                            Priority 3

                            <select

                                value={third}

                                onChange={(e)=>

                                    setThird(
                                        e.target.value
                                    )
                                }

                                className="
                                    border
                                    ml-4
                                    px-4
                                    py-2
                                "
                            >

                                <option>
                                    GRAPH
                                </option>

                                <option>
                                    REPORT
                                </option>

                                <option>
                                    TABLE
                                </option>

                            </select>

                        </div>

                        <button

                            onClick={async() => {

                                if(

                                    first === second ||

                                    first === third ||

                                    second === third

                                ){

                                    alert(

                                        "Priority cannot contain duplicates."
                                    )

                                    return
                                }

                                const user = JSON.parse(

                                    localStorage.getItem(
                                        "user"
                                    ) || "{}"
                                )


                                await fetch(

                                    "http://127.0.0.1:8000/save-layout",

                                    {

                                        method: "POST",

                                        headers: {

                                            "Content-Type":
                                            "application/json"
                                        },

                                        body: JSON.stringify({

                                            email:
                                            user.email,

                                            pin_mode:
                                            pinMode,

                                            first:
                                            first,

                                            second:
                                            second,

                                            third:
                                            third
                                        })
                                    }
                                )

                                alert(
                                    "Layout Saved!"
                                )
                            }}

                            className="
                                bg-green-500
                                text-white
                                px-6
                                py-3
                                rounded-xl
                                font-bold
                            "
                        >

                            Save Layout

                        </button>

                    </div>

                </div>

            
                <div className="mt-10 text-xl">

                    Graph :
                    {stats.graph}

                    <br/>

                    Table :
                    {stats.table}

                    <br/>

                    Report :
                    {stats.report}

                </div>
            </div>
        </>
    )
}