"use client"

import Link from "next/link"

const crops = [
  { name: "tomato",     emoji: "🍅", label: "토마토",   color: "from-red-50 to-red-100",     border: "border-red-200",    hover: "hover:border-red-400" },
  { name: "carrot",     emoji: "🥕", label: "당근",     color: "from-orange-50 to-orange-100", border: "border-orange-200", hover: "hover:border-orange-400" },
  { name: "potato",     emoji: "🥔", label: "감자",     color: "from-yellow-50 to-yellow-100", border: "border-yellow-200", hover: "hover:border-yellow-400" },
  { name: "lettuce",    emoji: "🥬", label: "상추",     color: "from-green-50 to-green-100",   border: "border-green-200",  hover: "hover:border-green-400" },
  { name: "rucola",     emoji: "🌿", label: "루꼴라",   color: "from-emerald-50 to-emerald-100", border: "border-emerald-200", hover: "hover:border-emerald-400" },
  { name: "onion",      emoji: "🧅", label: "양파",     color: "from-lime-50 to-lime-100",     border: "border-lime-200",   hover: "hover:border-lime-400" },
]

export default function DatasetPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-20 py-20">

        {/* 헤더 */}
        <div className="mb-14">
          <h1 className="text-6xl font-black text-black mb-3">Dataset</h1>
          <p className="text-gray-400 text-lg">작물을 선택해 환경 데이터와 성장 기록을 확인하세요</p>
        </div>

        {/* 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {crops.map((crop) => (
            <Link key={crop.name} href={`/crop/${crop.name}`}>
              <div className={`bg-gradient-to-br ${crop.color} border-2 ${crop.border} ${crop.hover} rounded-3xl p-8 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg group`}>
                <div className="text-5xl mb-4">{crop.emoji}</div>
                <div className="text-2xl font-black text-gray-800 mb-1">{crop.label}</div>
                <div className="text-sm text-gray-400 font-medium">{crop.name}</div>
                <div className="mt-4 text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
                  데이터 보기 →
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}