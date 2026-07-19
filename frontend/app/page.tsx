import GraphChart from "@/components/GraphChart"
import CropCard from "@/components/CropCard"

export default function Home() {

  return (

    <div className="min-h-screen bg-gray-50">

      <div className="text-center mt-20">

        <h1 className="text-3xl lg:text-6xl font-bold">
          SMART FARM DATASET
        </h1>

        <p className="text-2xl mt-5 text-gray-700">
          Datasets collected on environment,
          control and growth images
        </p>

      </div>

      <div className="flex justify-center gap-10 mt-20 flex-wrap px-10 pb-20">

        <CropCard
          name="Tomato"
          image="/images/tomato.jpg"
        />

        <CropCard
          name="Carrot"
          image="/images/carrot.jpg"
        />

        <CropCard
          name="Potato"
          image="/images/potato.jpg"
        />

        <CropCard
          name="Lettuce"
          image="/images/lettuce.jpg"
        />

        <CropCard
          name="Rucola"
          image="/images/rucola.jpg"
        />

        <CropCard
          name="Onion"
          image="/images/onion.jpg"
        />

      </div>

    </div>
  )
}