interface SensorData {

    id: number
    created_at: string
    device_id: string
    temperature: number
    temperature2: number
    humidity: number
    co2_level: number

    image_url: string
}

interface Props {

    data: SensorData[]
}

export default function DataTable({
    data
}: Props) {

    return (

        <table className="w-full mt-10 border-collapse shadow-lg overflow-hidden rounded-xl">

            <thead>

                <tr className="bg-green-300 h-16 text-xl text-black">

                    <th>Device</th>
                    <th>Date</th>
                    <th className="text-red-500">
                        Temperature
                    </th>
                    <th className="text-purple-500">
                        Temperature2
                    </th>
                    <th className="text-blue-500">
                        Humidity
                        </th>
                    <th className="text-green-500">
                        CO2 Level
                    </th>
                    <th>Image</th>

                </tr>

            </thead>

            <tbody>

                {
                    data.map((item) => (

                        <tr
                            key={item.id}
                            className="
                            text-center 
                            h-14 
                            border-b 
                            bg-white 
                            text-black
                            hover:bg-gray-100
                            "
                        >
                            <td>
                                {item.device_id}
                            </td>

                            <td>
                                {
                                    new Date(
                                        item.created_at
                                    ).toLocaleString()
                                }
                            </td>

                            <td>
                                {item.temperature}°C
                            </td>
                            
                            <td>
                                {item.temperature2}°C
                            </td>
                            
                            <td>
                                {item.humidity}%
                            </td>

                            <td>
                                {item.co2_level}
                            </td>
                

                            <td>
                                <img
                                    src={item.image_url}
                                    className="
                                        w-24
                                        h-24
                                        object-cover
                                        rounded-x1
                                        mx-auto
                                        "
                                />
                            </td>
                        </tr>
                    ))
                }

            </tbody>

        </table>
    )
}