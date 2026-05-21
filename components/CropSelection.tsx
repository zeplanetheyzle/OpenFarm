interface Props {

    cropType: string

    createdAt: string

    deviceId: string

    onSelect: (
        deviceId: string
    ) => void
}

const deviceInfo: any = {

    "openfarm1": {

        region: "Seoul",

        size: "Small"
    },

    "openfarm2": {

        region: "Busan",

        size: "Medium"
    },

    "openfarm3": {

        region: "Jeju",

        size: "Large"
    }
}

export default function CropSelection({

    cropType,

    createdAt,

    deviceId,

    onSelect

}: Props) {

    return (

        <div className="mt-16">

            <div className="flex justify-center gap-10 flex-wrap">

                {

                    Object.keys(deviceInfo).map(

                        (deviceId) => (

                            <div

                                key={deviceId}

                                onClick={() =>
                                    onSelect(deviceId)
                                }

                                className="
                                    w-72
                                    h-96
                                    bg-white
                                    border-4
                                    border-orange-300
                                    rounded-3xl
                                    flex
                                    flex-col
                                    items-center
                                    justify-center
                                    cursor-pointer
                                    hover:scale-105
                                    transition
                                    duration-300
                                "
                            >

                                <h1 className="
                                    text-5xl
                                    font-bold
                                    text-orange-400
                                ">

                                    {cropType}

                                </h1>

                                <div className="
                                    w-48
                                    border-b-2
                                    border-orange-300
                                    my-6
                                " />

                                <div className="
                                    text-4xl
                                    font-bold
                                    leading-[60px]
                                ">
                                    <p>
                                        #
                                        {
                                            deviceId.replace(
                                                "openfarm",
                                                "OpenFarm"
                                            )
                                        }
                                    </p>

                                    <p>

                                        #
                                        {
                                            new Date(
                                                createdAt
                                            ).getFullYear()
                                        }

                                    </p>

                                    <p>

                                        #
                                        {
                                            deviceInfo[
                                                deviceId
                                            ]?.region
                                        }

                                    </p>

                                    <p>

                                        #
                                        {
                                            deviceInfo[
                                                deviceId
                                            ]?.size
                                        }

                                    </p>

                                </div>

                            </div>
                        )
                    )
                }

            </div>

        </div>
    )
}