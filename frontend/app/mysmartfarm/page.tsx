"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

type SmartFarm = {
  id: number
  device_id: string
  location: string
  crop_type: string
  size: string
  created_at: string
}

type ControlLog = {
  id: number
  created_at: string
  device_id: string
  temperature: number
  humidity: number
  co2_level: number
  plant_area: number
  recommended_temp: number
  recommended_hum: number
}

const cropEmoji: Record<string, string> = {
  상추: "🥬", 토마토: "🍅", 당근: "🥕", 감자: "🥔", 루꼴라: "🌿", 양파: "🧅"
}
const sizeLabel: Record<string, string> = {
  small: "🌱 Small", medium: "🌿 Medium", large: "🌳 Large"
}

export default function MySmartFarmPage() {
  const router = useRouter()
  const [farms, setFarms] = useState<SmartFarm[]>([])
  const [userEmail, setUserEmail] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ device_id: "", location: "", crop_type: "", size: "" })
  const [loading, setLoading] = useState(false)
  const [selectedFarm, setSelectedFarm] = useState<SmartFarm | null>(null)
  const [history, setHistory] = useState<ControlLog[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const handleDelete = async (farmId: number) => {
    if (!confirm("정말 삭제할까요?")) return
    await fetch(`${API_URL}/smartfarms/${farmId}`, {
      method: "DELETE"
    })
    fetchFarms(userEmail)
    if (selectedFarm?.id === farmId) setSelectedFarm(null)
  }

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    if (!user.email) { window.location.href = "/login"; return }
    setUserEmail(user.email)
    fetchFarms(user.email)
  }, [])

  const fetchFarms = async (email: string) => {
    const res = await fetch(`${API_URL}/smartfarms?email=${email}`)
    const data = await res.json()
    setFarms(data)
  }

  const fetchHistory = async (deviceId: string) => {
    try {
      const res = await fetch(`${API_URL}/control/history?device_id=${deviceId}`)
      const data = await res.json()
      setHistory(data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleRegister = async () => {
    if (!form.device_id || !form.location || !form.crop_type || !form.size) {
      alert("모든 항목을 입력해주세요.")
      return
    }
    setLoading(true)
    await fetch(`${API_URL}/smartfarms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, user_email: userEmail })
    })
    setForm({ device_id: "", location: "", crop_type: "", size: "" })
    setShowForm(false)
    fetchFarms(userEmail)
    setLoading(false)
  }

  const handleSelectFarm = (farm: SmartFarm) => {
    setSelectedFarm(farm)
    fetchHistory(farm.device_id)
  }

  // 그래프 데이터
  const sensorChartData = history.map(h => ({
    time: new Date(h.created_at).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", hour: "numeric" }),
    온도: h.temperature?.toFixed(1),
    습도: h.humidity?.toFixed(1),
    CO2: h.co2_level?.toFixed(0),
  }))

  const recommendChartData = history.map(h => ({
    time: new Date(h.created_at).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", hour: "numeric" }),
    추천온도: h.recommended_temp?.toFixed(1),
    추천습도: h.recommended_hum?.toFixed(1),
  }))

  function getActionLabel(h: ControlLog): string {
    const actions: string[] = []
    if (h.recommended_temp !== undefined) {
      if (h.temperature > h.recommended_temp + 1) actions.push("❄️ 냉각")
      else if (h.temperature < h.recommended_temp - 1) actions.push("🔥 가열")
    }
    if (h.recommended_hum !== undefined) {
      if (h.humidity > h.recommended_hum + 5) actions.push("💨 제습")
      else if (h.humidity < h.recommended_hum - 5) actions.push("💧 가습")
    }
    if (h.co2_level > 1000) actions.push("💨 환기")
    return actions.length > 0 ? actions.join(", ") : "✅ 정상"
  }

  return (
    <div className="min-h-screen bg-white px-4 lg:px-20 py-16">
      <div className="max-w-5xl mx-auto">

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-black text-gray-800">My SmartFarm</h1>
            <p className="text-gray-400 mt-1 text-sm">{userEmail}</p>
          </div>
          <button
            onClick={() => setShowForm(p => !p)}
            className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600 transition"
          >
            {showForm ? "취소" : "+ 스마트팜 등록"}
          </button>
        </div>

        {/* 등록 폼 */}
        {showForm && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 mb-10">
            <h2 className="text-xl font-bold text-green-700 mb-6">새 스마트팜 등록</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-sm text-gray-500 mb-1 block">기기 ID</label>
                <input value={form.device_id} onChange={e => setForm(p => ({ ...p, device_id: e.target.value }))}
                  placeholder="예: hellofarm1"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-green-400" />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">위치</label>
                <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  placeholder="예: 형남공학관 4층"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-green-400" />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">작물 종류</label>
                <select value={form.crop_type} onChange={e => setForm(p => ({ ...p, crop_type: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-green-400 bg-white">
                  <option value="">선택</option>
                  {["상추", "토마토", "당근", "감자", "루꼴라", "양파"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">크기</label>
                <select value={form.size} onChange={e => setForm(p => ({ ...p, size: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-green-400 bg-white">
                  <option value="">선택</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </div>
            <button onClick={handleRegister} disabled={loading}
              className="bg-green-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-600 transition disabled:opacity-50">
              {loading ? "등록 중..." : "등록하기"}
            </button>
          </div>
        )}

        {/* 팜 목록 */}
        {farms.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-3xl lg:text-6xl mb-4">🌱</div>
            <p className="text-lg font-medium">등록된 스마트팜이 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
            {farms.map(farm => (
              <div key={farm.id}
                className={`border-2 rounded-2xl p-7 cursor-pointer transition-all ${selectedFarm?.id === farm.id ? "border-green-400 bg-green-50 shadow-lg" : "border-gray-100 bg-white hover:border-green-300 hover:shadow"}`}
                onClick={() => handleSelectFarm(farm)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{cropEmoji[farm.crop_type] || "🌿"}</div>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
                    {new Date(farm.created_at).toLocaleDateString("ko-KR")}
                  </span>
                </div>
                <div className="text-xl font-black text-gray-800 mb-1">{farm.location}</div>
                <div className="text-sm text-green-600 font-medium mb-1">{farm.crop_type}</div>
                <div className="text-sm text-gray-400 mb-1">기기 ID: {farm.device_id}</div>
                <div className="text-sm text-gray-400 mb-5">크기: {sizeLabel[farm.size] || farm.size}</div>
                <div className="flex gap-2">
                  <button
                    onClick={e => { e.stopPropagation(); router.push(`/monitor?device_id=${farm.device_id}&location=${farm.location}`) }}
                    className="flex-1 bg-green-500 text-white py-2 rounded-xl text-sm font-bold hover:bg-green-600 transition"
                  >
                    실시간 모니터링 →
                  </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(farm.id) }}
                      className="px-3 py-2 bg-red-100 text-red-500 rounded-xl text-sm font-bold hover:bg-red-200 transition"
                    >
                      🗑️
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 선택된 팜 상세 */}
        {selectedFarm && (
          <div>
            <h2 className="text-2xl font-black text-gray-800 mb-6">
              {selectedFarm.location} 기록
            </h2>

            {historyLoading ? (
              <div className="text-center py-10 text-gray-400">데이터 불러오는 중...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-10 text-gray-400">기록이 없습니다</div>
            ) : (
              <>
                {/* 최신 현재값 */}
                <div className="bg-white rounded-2xl shadow p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">현재 상태</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "온도", value: `${history[history.length-1]?.temperature?.toFixed(1)}°C`, color: "text-orange-500" },
                      { label: "습도", value: `${history[history.length-1]?.humidity?.toFixed(1)}%`, color: "text-blue-500" },
                      { label: "CO₂", value: `${history[history.length-1]?.co2_level?.toFixed(0)}ppm`, color: "text-green-600" },
                      { label: "잎 면적", value: `${history[history.length-1]?.plant_area?.toFixed(0) ?? "-"}px²`, color: "text-purple-500" },
                    ].map(c => (
                      <div key={c.label} className="bg-gray-50 rounded-xl p-4 text-center">
                        <div className="text-sm text-gray-400 mb-1">{c.label}</div>
                        <div className={`text-xl font-bold ${c.color}`}>{c.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 제어 목록 */}
                <div className="bg-white rounded-2xl shadow p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">제어 목록</h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {[...history].reverse().map((h, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-700">{getActionLabel(h)}</span>
                        </div>
                        <span className="text-xs text-gray-400">{new Date(h.created_at).toLocaleString("ko-KR")}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => router.push(`/monitor?device_id=${selectedFarm.device_id}&location=${selectedFarm.location}`)}
                    className="w-full mt-4 bg-green-500 text-white py-2 rounded-xl text-sm font-bold hover:bg-green-600 transition"
                  >
                    상세 모니터링 보기 →
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}