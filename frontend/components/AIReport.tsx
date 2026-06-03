import jsPDF from "jspdf"

interface Props {

    data: any[]

    recommendation: any
}

export default function AIReport({
    data,

    recommendation

}: Props) {

    const latest =

        data.length > 0

        ?

        data[0]

        :

        null
    
        const downloadPDF = () => {

            const doc = new jsPDF()

            doc.setFontSize(24)

            doc.text(

                "OpenFarm AI Growth Report",

                20,

                20
            )

            doc.setFontSize(12)

            doc.text(

                `Generated: ${new Date().toLocaleString()}`,

                20,

                35
            )

            doc.line(

                20,

                40,

                190,

                40
            )

            doc.setFontSize(18)

            doc.text(

                "Executive Summary",

                20,

                55
            )

            doc.setFontSize(12)

            doc.text(

                "The crop environment is currently operating within acceptable conditions.",

                20,

                65
            )

            doc.text(

                "Current Environment",

                20,

                90
            )

            doc.text(

                `Temperature: ${latest?.temperature} C`,

                30,

                105
            )

            doc.text(

                `Temperature2: ${latest?.temperature2} C`,

                30,

                115
            )

            doc.text(

                `Humidity: ${latest?.humidity} %`,

                30,

                125
            )

            doc.text(

                `CO2: ${latest?.co2_level} ppm`,

                30,

                135
            )

            doc.text(

                "AI Recommendation",

                20,

                160
            )

            doc.text(

                "Recommended Temperature: 24 ~ 26 C",

                30,

                175
            )

            doc.text(

                "Recommended Humidity: 60 ~ 70 %",

                30,

                185
            )

            doc.text(

                "Recommended CO2: 800 ~ 1000 ppm",

                30,

                195
            )

            doc.text(

                "Growth Assessment",

                20,

                220
            )

            doc.text(

                "Stable growth expected under current conditions.",

                30,

                235
            )

            doc.save(

                "OpenFarm_AI_Report.pdf"
            )
        }

    return (

        <div
            className="
                bg-white
                w-[900px]
                min-h-[1200px]
                p-16
                shadow-2xl
                rounded-xl
            "
        >

            <div
                className="
                    border-b-4
                    border-green-500
                    pb-6
                    mb-10
                "
            >

                <h1
                    className="
                        text-5xl
                        font-bold
                        text-green-700
                    "
                >

                    OpenFarm AI Growth Report

                </h1>

                <p
                    className="
                        text-gray-500
                        mt-4
                    "
                >

                    Generated:
                    {
                        new Date()
                        .toLocaleString()
                    }

                </p>

            </div>

            <section className="mb-12">

                <h2
                    className="
                        text-3xl
                        font-bold
                        mb-4
                    "
                >

                    Executive Summary

                </h2>

                <p
                    className="
                        text-xl
                        leading-10
                        text-black
                    "
                >

                    The crop environment is currently
                    operating within acceptable
                    conditions. Sensor data indicates
                    stable growth conditions with no
                    critical environmental risks
                    detected.

                </p>

            </section>

            <section className="mb-12">

                <h2
                    className="
                        text-3xl
                        font-bold
                        mb-6
                    "
                >

                    Current Environment

                </h2>

                <div
                    className="
                        grid
                        grid-cols-2
                        gap-6
                    "
                >

                    <div className="bg-gray-100 p-6 rounded-xl">

                        <p className="
                                text-[#f97316]
                                font-bold
                            "
                        >

                            Temperature

                        </p>

                        <p className="text-3xl font-bold text-[#f97316]">

                            {latest?.temperature}°C

                        </p>

                    </div>

                    <div className="bg-gray-100 p-6 rounded-xl">

                        <p className="
                                text-[#a855f7]
                                font-bold
                            "
                        >

                            Temperature 2

                        </p>

                        <p className="text-3xl font-bold text-[#a855f7]">

                            {latest?.temperature2}°C

                        </p>

                    </div>

                    <div className="bg-gray-100 p-6 rounded-xl">

                        <p className="
                                text-[#3b82f6]
                                font-bold
                            "
                        >

                            Humidity

                        </p>

                        <p className="text-3xl font-bold text-[#3b82f6]">

                            {latest?.humidity}%

                        </p>

                    </div>

                    <div className="bg-gray-100 p-6 rounded-xl">

                        <p className="
                                text-[#10b981]
                                font-bold
                            "
                        >

                            CO₂

                        </p>

                        <p className="text-3xl font-bold text-[#10b981]">

                            {latest?.co2_level} ppm

                        </p>

                    </div>

                </div>

            </section>

            <section className="mb-12">

                <h2
                    className="
                        text-3xl
                        font-bold
                        mb-4
                    "
                >

                    AI Recommendation

                </h2>

                <div
                    className="
                        bg-green-50
                        p-8
                        rounded-xl
                        border-l-8
                        border-green-500
                    "
                >

                    <h3
                        className="
                            text-2xl
                            font-bold
                            text-green-700
                            mb-6
                        "
                    >

                        AI Detection Result

                    </h3>

                    {
                        recommendation?.
                        recommendations?.
                        length > 0

                        ?

                        recommendation.
                        recommendations.
                        map(

                            (
                                item: string,
                                index: number
                            ) => (

                                <p

                                    key={index}

                                    className="
                                        text-xl
                                        text-black
                                        mb-4
                                    "
                                >

                                    • {item}

                                </p>
                            )
                        )

                        :

                        <p
                            className="
                                text-xl
                                text-black
                            "
                        >

                            No recommendation available.

                        </p>
                    }
                    <div
                        className="
                            mt-8
                            border-t
                            pt-6
                        "
                    >

                        <p
                            className="
                                text-xl
                                text-black
                                mb-3
                            "
                        >

                            Recommended Temperature:

                            {
                                recommendation?.
                                recommended_temperature
                            }°C

                        </p>

                        <p
                            className="
                                text-xl
                                text-black
                                mb-3
                            "
                        >

                            Recommended Temperature2:

                            {
                                recommendation?.
                                recommended_temperature2
                            }°C

                        </p>

                        <p
                            className="
                                text-xl
                                text-black
                                mb-3
                            "
                        >

                            Recommended Humidity:

                            {
                                recommendation?.
                                recommended_humidity
                            }%

                        </p>

                        <p
                            className="
                                text-xl
                                text-black
                            "
                        >

                            Recommended CO₂:

                            {
                                recommendation?.
                                recommended_co2
                            } ppm

                        </p>

                    </div>

                </div>

            </section>

            <section className="mb-12">

                <h2
                    className="
                        text-3xl
                        font-bold
                        mb-4
                    "
                >

                    Growth Assessment

                </h2>

                <p
                    className="
                        text-xl
                        leading-10
                        text-black
                    "
                >

                    Based on current environmental
                    conditions, crop growth is
                    expected to remain stable.
                    Continuous monitoring is
                    recommended to maintain
                    optimal productivity.

                </p>

            </section>

            <div
                className="
                    mt-20
                    pt-8
                    border-t
                    text-center
                    text-black
                "
            >

                OpenFarm Smart Agriculture Platform

            </div>

            <button

                onClick={downloadPDF}

                className="
                    bg-blue-500
                    hover:bg-blue-700
                    text-white
                    font-bold
                    py-3
                    px-6
                    rounded-xl
                    mt-10
                "
            >
                Download PDF
            </button>

        </div>
    )
}