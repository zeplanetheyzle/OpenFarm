import Navbar from "@/components/Navbar"

export default function IntroductionPage() {

    return (

        <div className="min-h-screen bg-gray-50">

            <Navbar />

            <div className="p-20">

                <h1 className="text-6xl font-bold mb-10">

                    Introduction

                </h1>

                <p className="text-2xl leading-[50px]">

                    OpenFarm is a smart farming
                    platform that visualizes
                    sensor data, crop images,
                    and environmental analytics
                    using IoT and Supabase.

                </p>

            </div>

        </div>
    )
}