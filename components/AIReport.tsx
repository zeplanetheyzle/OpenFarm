interface Props {

    data: any[]
}

export default function Report({
    data
}: Props) {

    return (

        <div
            className="
                mt-10
                bg-white
                rounded-3xl
                p-10
                shadow-xl
                border-2
                border-green-200
            "
        >

            <h1 className="
                text-4xl
                font-bold
                text-green-600
                mb-8
            ">

                Summary Report

            </h1>

            <div className="
                text-2xl
                leading-[55px]
                text-gray-700
            ">

                <p>

                    • Temperature condition is stable

                </p>

                <p>

                    • Humidity trend is decreasing

                </p>

                <p>

                    • CO2 concentration is normal

                </p>

                <p>

                    • Crop growth prediction:
                    Stable

                </p>

                <p>

                    • Recommended action:
                    Increase watering frequency

                </p>

            </div>

        </div>
    )
}