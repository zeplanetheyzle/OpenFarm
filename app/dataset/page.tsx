import Link from "next/link"

import Navbar from "@/components/Navbar"

const crops = [
    "tomato",
    "carrot",
    "potato",
    "lettuce",
    "rucolla",
    "greenonion"
]

export default function DatasetPage() {

    return (

        <div className="min-h-screen bg-gray-50">

            <Navbar />

            <div className="p-20">

                <h1 className="text-5xl font-bold mb-10">

                    Dataset

                </h1>

                <div className="flex flex-col gap-6">

                    {
                        crops.map((crop) => (

                            <Link
                                key={crop}
                                href={`/crop/${crop}`}
                            >

                                <div
                                    className="
                                        bg-white
                                        p-8
                                        rounded-2xl
                                        shadow-lg
                                        text-3xl
                                        hover:scale-105
                                        transition
                                        cursor-pointer
                                    "
                                >

                                    {crop}

                                </div>

                            </Link>
                        ))
                    }

                </div>

            </div>

        </div>
    )
}