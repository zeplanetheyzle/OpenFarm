import Link from "next/link"

interface Props {

    name: string
    image: string
}

export default function CropCard({
    name,
    image
}: Props) {

    return (

        <Link href={`/crop/${name.toLowerCase()}`}>

            <div className="w-80 rounded-2xl overflow-hidden shadow-xl bg-white hover:scale-105 transition duration-300 cursor-pointer">

                <img
                    src={image}
                    className="w-full h-64 object-cover"
                />

                <div className="p-5 text-center">

                    <h1 className="text-3xl font-bold">
                        {name}
                    </h1>

                </div>

            </div>

        </Link>
    )
}