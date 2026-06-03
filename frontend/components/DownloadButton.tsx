interface Props {

    data: any[]
}

export default function DownloadButton({
    data
}: Props) {

    const downloadCSV = () => {

        const headers = [

            "crop_type",

            "created_at",

            "device_id",

            "temperature",

            "temperature2",

            "humidity",

            "co2_level",

            "image_url"
        ]

        const rows = data.map((item) => [

            item.crop_type,

            item.created_at,

            item.device_id,

            item.temperature,

            item.temperature2,

            item.humidity,

            item.co2_level,

            item.image_url
        ])

        const csvContent = [

            headers.join(","),

            ...rows.map((row) =>
                row.join(",")
            )

        ].join("\n")

        const blob = new Blob(
            [
                "\uFEFF" + csvContent
            ],
            {
                type:
                "text/csv;charset=utf-8;"
            }
        )

        const link =
        document.createElement("a")

        const url =
        URL.createObjectURL(blob)

        link.setAttribute(
            "href",
            url
        )

        link.setAttribute(
            "download",
            "sensor_data.csv"
        )

        document.body.appendChild(link)

        link.click()

        document.body.removeChild(link)
    }

    return (

        <button
            onClick={downloadCSV}
            className="
                bg-green-500
                hover:bg-green-600
                text-white
                px-8
                py-4
                rounded-2xl
                text-xl
                font-bold
                shadow-lg
                transition
            "
        >

            Download CSV

        </button>
    )
}