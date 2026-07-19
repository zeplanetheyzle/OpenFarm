"use client"

import { useEffect, useState } from "react"
import PreferencePieChart from "@/components/PreferencePieChart"
import Link from "next/link"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

type CropHistory = {
  id: string
  visitedAt: string
}

const cropLabelMap: Record<string, string> = {
  lettuce: "상추", tomato: "토마토", carrot: "당근",
  potato: "감자", onion: "양파", rucola: "루꼴라"
}

const cropEmojiMap: Record<string, string> = {
  lettuce: "🥬", tomato: "🍅", carrot: "🥕",
  potato: "🥔", onion: "🧅", rucola: "🌿"
}

export default function MyPage() {
  const [stats, setStats] = useState({ graph: 0, table: 0})
  const [pinMode, setPinMode] = useState(false)
  const [first, setFirst] = useState("GRAPH")
  const [second, setSecond] = useState("TABLE")
  const [userEmail, setUserEmail] = useState("")
  const [cropHistory, setCropHistory] = useState<CropHistory[]>([])

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    if (!user.email) { window.location.href = "/login"; return }
    setUserEmail(user.email)

    // 선호도 데이터
    fetch(`${API_URL}/preference-stats?email=${user.email}`)
      .then(res => res.json())
      .then(data => {
        setStats(data)
        setPinMode(data.pin_mode || false)
        setFirst(data.first_section || "GRAPH")
        setSecond(data.second_section || "TABLE")
      })
      .catch(err => console.error(err))

    // 최근 본 작물 기록
    const history = JSON.parse(localStorage.getItem("cropHistory") || "[]")
    setCropHistory(history)
  }, [])

  const handleSaveLayout = async () => {
    if (first === second || second === first) {
      alert("Priority cannot contain duplicates.")
      return
    }
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    await fetch(`${API_URL}/save-layout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, pin_mode: pinMode, first, second})
    })
    alert("Layout Saved!")
  }

  const totalClicks = stats.graph + stats.table

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">

        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-800">설정</h1>
          {userEmail && <p className="text-gray-400 mt-1 text-sm">{userEmail}</p>}
        </div>

        {/* 상단 2열 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

          {/* 이용 통계 */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">이용 통계</h2>
            <div className="flex justify-center">
              <PreferencePieChart
                graph={stats.graph}
                table={stats.table}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {[
                { label: "그래프", value: stats.graph, color: "bg-blue-100 text-blue-700" },
                { label: "테이블", value: stats.table, color: "bg-yellow-100 text-yellow-700" },
              ].map(s => (
                <div key={s.label} className={`rounded-xl p-3 text-center ${s.color}`}>
                  <div className="text-xl font-bold">{s.value}</div>
                  <div className="text-xs mt-1">{s.label}</div>
                  <div className="text-xs opacity-70">
                    {totalClicks > 0 ? `${Math.round(s.value / totalClicks * 100)}%` : "0%"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 레이아웃 설정 */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">레이아웃 설정</h2>
            <label className="flex items-center gap-3 mb-5 cursor-pointer">
              <input
                type="checkbox"
                checked={pinMode}
                onChange={e => setPinMode(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">커스텀 레이아웃 사용</span>
            </label>
            {[
              { label: "Priority 1", value: first, setter: setFirst },
              { label: "Priority 2", value: second, setter: setSecond },
            ].map(p => (
              <div key={p.label} className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600 font-medium">{p.label}</span>
                <select
                  value={p.value}
                  onChange={e => p.setter(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:border-green-400"
                >
                  <option>GRAPH</option>
                  <option>TABLE</option>
                </select>
              </div>
            ))}
            <button
              onClick={handleSaveLayout}
              className="w-full mt-2 bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600 transition"
            >
              저장
            </button>
          </div>
        </div>

        {/* 최근 본 수집형 데이터 */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">최근 본 데이터</h2>
          {cropHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">🌱</div>
              <p className="text-sm">아직 방문한 데이터가 없습니다</p>
              <Link href="/dataset">
                <button className="mt-4 px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition">
                  데이터셋 보러가기
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {cropHistory.map((h, i) => (
                <Link key={i} href={`/crop/${h.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-green-50 transition cursor-pointer">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{cropEmojiMap[h.id] || "🌿"}</span>
                      <div>
                        <div className="font-medium text-gray-800">
                          {cropLabelMap[h.id] || h.id}
                        </div>
                        <div className="text-xs text-gray-400">/crop/{h.id}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(h.visitedAt).toLocaleString("ko-KR")}
                    </div>
                  </div>
                </Link>
              ))}
              <button
                onClick={() => {
                  localStorage.removeItem("cropHistory")
                  setCropHistory([])
                }}
                className="w-full mt-2 text-xs text-gray-400 hover:text-red-500 py-2 transition"
              >
                기록 전체 삭제
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}