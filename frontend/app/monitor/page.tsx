"use client"

import { useEffect, useState, useCallback, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import AIReport from "@/components/AIReport"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const THRESHOLDS = {
  temperature: { min: 18, max: 25 },
  humidity:    { min: 50, max: 70 },
  co2:         { min: 400, max: 1000 },
}

type SensorData = {
  created_at: string
  device_id: string
  temperature: number
  humidity: number
  co2_level: number
  plant_area?: number
  recommended_temp?: number
  recommended_hum?: number
}

type ControlData = {
  recommended_temp: number
  recommended_hum: number
  plant_area?: number
}

type Farm = {
  id: number
  device_id: string
  location: string
  crop_type: string
  size: string
}

type Alert = { id: number; message: string; level: "danger" | "warning" }

function getAlerts(d: SensorData): Alert[] {
  const alerts: Alert[] = []
  let id = 0
  if (d.temperature > THRESHOLDS.temperature.max)
    alerts.push({ id: id++, message: `온도 과다 — 현재 ${d.temperature.toFixed(1)}°C`, level: "danger" })
  else if (d.temperature < THRESHOLDS.temperature.min)
    alerts.push({ id: id++, message: `온도 낮음 — 현재 ${d.temperature.toFixed(1)}°C`, level: "warning" })
  if (d.humidity > THRESHOLDS.humidity.max)
    alerts.push({ id: id++, message: `습도 과다 — 현재 ${d.humidity.toFixed(1)}%`, level: "warning" })
  else if (d.humidity < THRESHOLDS.humidity.min)
    alerts.push({ id: id++, message: `습도 부족 — 현재 ${d.humidity.toFixed(1)}%`, level: "warning" })
  if (d.co2_level > THRESHOLDS.co2.max)
    alerts.push({ id: id++, message: `CO₂ 과다 — 현재 ${d.co2_level.toFixed(0)}ppm`, level: "danger" })
  return alerts
}

function getActionFromData(current: SensorData, recommended: ControlData): string[] {
  const actions: string[] = []
  if (current.temperature > (recommended.recommended_temp + 1))
    actions.push("❄️ 펠티어소자 가동 (냉각 필요)")
  else if (current.temperature < (recommended.recommended_temp - 1))
    actions.push("🔥 열선 가동 (가열 필요)")
  if (current.humidity < (recommended.recommended_hum - 5))
    actions.push("💧 가습 필요")
  else if (current.humidity > (recommended.recommended_hum + 5))
    actions.push("💨 환풍구 개방 (제습 필요)")
  if (current.co2_level > THRESHOLDS.co2.max)
    actions.push("💨 환풍구 개방 (CO₂ 과다)")
  return actions.length > 0 ? actions : ["✅ 정상 범위 유지 중"]
}

function getHistoryActions(h: any, prevH: any): string[] {
  if (!prevH) return ["데이터 수집 시작"]
  const actions: string[] = []
  if (h.temperature > (h.recommended_temp + 1))
    actions.push("❄️ 펠티어소자 가동")
  else if (h.temperature < (h.recommended_temp - 1))
    actions.push("🔥 열선 가동")
  if (h.humidity < (h.recommended_hum - 5))
    actions.push("💧 가습")
  else if (h.humidity > (h.recommended_hum + 5))
    actions.push("💨 환풍구 개방")
  if (h.co2_level > THRESHOLDS.co2.max)
    actions.push("💨 환풍구 (CO₂)")
  return actions.length > 0 ? actions : ["✅ 정상 유지"]
}

function sendBrowserNotification(message: string) {
  if (Notification.permission === "granted") {
    new Notification("OpenFarm 이상 감지", { body: message, icon: "/favicon.ico" })
  }
}

function MonitorContent() {
  const searchParams = useSearchParams()
  const initDeviceId = searchParams.get("device_id") || ""
  const initLocation = searchParams.get("location") || ""

  const [farms, setFarms] = useState<Farm[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState(initDeviceId)
  const [selectedLocation, setSelectedLocation] = useState(initLocation)
  const [selectedFarmInfo, setSelectedFarmInfo] = useState<Farm | null>(null)
  const [data, setData] = useState<SensorData | null>(null)
  const [controlData, setControlData] = useState<ControlData | null>(null)
  const [controlHistory, setControlHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState("")
  const [notifGranted, setNotifGranted] = useState(false)
  const [toasts, setToasts] = useState<Alert[]>([])
  const [showNotifPanel, setShowNotifPanel] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [notifHistory, setNotifHistory] = useState<Array<{
    id: number; message: string; level: "danger" | "warning"; time: string
  }>>([])
  const notifIdRef = useRef(0)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    if (!user.email) { window.location.href = "/login"; return }

    fetch(`${API_URL}/smartfarms?email=${user.email}`)
      .then(res => res.json())
      .then((farmData: Farm[]) => {
        setFarms(farmData)
        if (!initDeviceId && farmData.length > 0) {
          setSelectedDeviceId(farmData[0].device_id)
          setSelectedLocation(farmData[0].location)
          setSelectedFarmInfo(farmData[0])
        } else {
          const found = farmData.find(f => f.device_id === initDeviceId)
          if (found) setSelectedFarmInfo(found)
        }
      })
      .catch(e => console.error(e))
  }, [])

  const fetchHistory = useCallback(async (deviceId: string) => {
    try {
      const res = await fetch(`${API_URL}/control/history?device_id=${deviceId}`)
      const histData = await res.json()
      setControlHistory(histData)
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    if (selectedDeviceId) fetchHistory(selectedDeviceId)
  }, [selectedDeviceId, fetchHistory])

  const dismissToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const fetchData = useCallback(async () => {
    if (!selectedDeviceId) return
    try {
      const endpoint = `${API_URL}/control/latest?device_id=${selectedDeviceId}`
      const res = await fetch(endpoint)
      const json = await res.json()
      if (json.error || !res.ok) {
        console.log("데이터 없음:", json.error)
        setData(null)
        setLoading(false)
        return
      }
      setData(json)
      setControlData(json)
      setLastUpdated(new Date().toLocaleTimeString("ko-KR"))

      const alerts = getAlerts(json)
      if (alerts.length > 0) {
        const time = new Date().toLocaleTimeString("ko-KR")
        setNotifHistory(prev => [
          ...alerts.map(a => ({
            id: notifIdRef.current++,
            message: a.message,
            level: a.level,
            time
          })),
          ...prev
        ])
        if (notifGranted) {
          setToasts(alerts)
          alerts.filter(a => a.level === "danger").forEach(a => sendBrowserNotification(a.message))
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [notifGranted, selectedDeviceId])

  useEffect(() => {
    setLoading(true)
    fetchData()
    const timer = setInterval(fetchData, 30000)
    return () => clearInterval(timer)
  }, [fetchData])

  const requestNotification = async () => {
    const result = await Notification.requestPermission()
    setNotifGranted(result === "granted")
  }

  if (loading) return <div className="p-10 text-center text-gray-500">데이터 불러오는 중...</div>

  const alerts = data ? getAlerts(data) : []
  const currentActions = data && controlData ? getActionFromData(data, controlData) : []

  // 그래프 데이터
  const chartData = controlHistory.map(h => ({
    time: new Date(h.created_at).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "numeric" }),
    plant_area: h.plant_area,
    온도: h.temperature,
    습도: h.humidity,
    CO2: h.co2_level,
    추천온도: h.recommended_temp ? Number(h.recommended_temp.toFixed(1)) : null,
    추천습도: h.recommended_hum ? Number(h.recommended_hum.toFixed(1)) : null,
  }))

  return (
    <div className="min-h-screen bg-gray-50 p-8">

      {/* 토스트 알림 */}
      <div className="fixed top-4 right-4 z-50 space-y-2 w-80">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-start justify-between gap-2 p-4 rounded-xl shadow-lg text-sm font-medium ${t.level === "danger" ? "bg-red-500 text-white" : "bg-yellow-400 text-yellow-900"}`}>
            <span>{t.level === "danger" ? "🚨 " : "⚠️ "}{t.message}</span>
            <button onClick={() => dismissToast(t.id)} className={`flex-shrink-0 text-lg leading-none font-bold hover:opacity-70 ${t.level === "danger" ? "text-white" : "text-yellow-900"}`}>×</button>
          </div>
        ))}
      </div>

      {/* AI Report 팝업 */}
      {showReport && data && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-[794px] max-h-[90vh] overflow-y-auto rounded-xl">
            <AIReport data={data} controlHistory={controlHistory} farmInfo={selectedFarmInfo} onClose={() => setShowReport(false)} />
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">환경 제어 모니터링</h1>
            <p className="text-sm text-gray-400 mt-1">{selectedLocation || selectedDeviceId}</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>마지막 갱신: {lastUpdated}</span>
            <button onClick={fetchData} className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600">새로고침</button>
            {data && (
              <button onClick={() => setShowReport(true)} className="px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium">
                📄 리포트
              </button>
            )}
            {notifGranted ? (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button onClick={() => setShowNotifPanel(p => !p)} className="relative px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200 text-lg">
                    🔔
                    {notifHistory.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {notifHistory.length > 9 ? "9+" : notifHistory.length}
                      </span>
                    )}
                  </button>
                  {showNotifPanel && (
                    <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-xl border z-50 max-h-96 overflow-y-auto">
                      <div className="p-3 border-b flex items-center justify-between">
                        <span className="font-medium text-sm text-gray-800">알림 기록</span>
                        <button onClick={() => setNotifHistory([])} className="text-xs text-gray-400 hover:text-red-500">전체 삭제</button>
                      </div>
                      {notifHistory.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-400">알림 없음</div>
                      ) : (
                        notifHistory.map(n => (
                          <div key={n.id} className={`flex items-start justify-between p-3 border-b text-sm ${n.level === "danger" ? "bg-red-50" : "bg-yellow-50"}`}>
                            <div>
                              <div className={`font-medium ${n.level === "danger" ? "text-red-600" : "text-yellow-700"}`}>
                                {n.level === "danger" ? "🚨 " : "⚠️ "}{n.message}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">{n.time}</div>
                            </div>
                            <button onClick={() => setNotifHistory(prev => prev.filter(h => h.id !== n.id))} className="text-gray-400 hover:text-red-500 ml-2 text-lg leading-none">×</button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div> 

                <button
                  onClick={() => {
                    setNotifGranted(false)
                    setToasts([])
                    setNotifHistory([])
                  }}
                  className="px-3 py-1 bg-red-100 text-red-500 rounded-lg hover:bg-red-200 text-xs font-medium"
                >
                  🔕 알림 끄기
                </button>
              </div> 
            ) : (
              <button onClick={requestNotification} className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600">🔔 알림 허용</button>
            )}
          </div>
        </div>

        {/* 알림 색상 기준 설명 */}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
            🚨 즉각 조치 (온도 과다, CO₂ 과다)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
            ⚠️ 주의 (온도 낮음, 습도 이상)
          </span>
        </div>

        {/* 팜 선택 탭 */}
        {farms.length > 0 ? (
          <div className="flex gap-2 mb-6 flex-wrap">
            {farms.map(farm => (
              <button
                key={farm.device_id}
                onClick={() => {
                  setSelectedDeviceId(farm.device_id)
                  setSelectedLocation(farm.location)
                  setSelectedFarmInfo(farm)
                  setData(null)
                  setLoading(true)
                  fetchHistory(farm.device_id)
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  selectedDeviceId === farm.device_id
                    ? "bg-green-500 text-white shadow"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-green-400"
                }`}
              >
                🌿 {farm.location}
                <span className="ml-1 text-xs opacity-70">({farm.crop_type})</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mb-6 p-4 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm">
            등록된 스마트팜이 없습니다.{" "}
            <Link href="/mysmartfarm" className="underline font-medium">스마트팜 등록하기 →</Link>
          </div>
        )}

        {!data ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-2xl lg:text-5xl mb-4">🌱</div>
            <p className="text-lg font-medium">아직 수집된 데이터가 없습니다</p>
            <p className="text-sm mt-2">스마트팜 기기가 연결되면 데이터가 자동으로 표시됩니다</p>
          </div>
        ) : (
          <>
            {/* 1. 알림 배너 */}
            {alerts.length === 0 ? (
              <div className="mb-6 p-4 rounded-xl bg-green-100 text-green-700 border border-green-200 font-medium">
                ✅ 모든 환경 지표가 정상 범위입니다
              </div>
            ) : (
              <div className="mb-6 space-y-2">
                {alerts.map(a => (
                  <div key={a.id} className={`p-4 rounded-xl font-medium ${a.level === "danger" ? "bg-red-100 text-red-700 border border-red-200" : "bg-yellow-100 text-yellow-700 border border-yellow-200"}`}>
                    {a.level === "danger" ? "🚨 " : "⚠️ "}{a.message}
                  </div>
                ))}
              </div>
            )}

            {/* 2. 현재 상태 */}
            <div className="bg-white rounded-2xl shadow p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">현재 상태</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "온도", value: `${data.temperature?.toFixed(1)}°C`, ok: data.temperature >= THRESHOLDS.temperature.min && data.temperature <= THRESHOLDS.temperature.max, color: "text-orange-500" },
                  { label: "습도", value: `${data.humidity?.toFixed(1)}%`, ok: data.humidity >= THRESHOLDS.humidity.min && data.humidity <= THRESHOLDS.humidity.max, color: "text-blue-500" },
                  { label: "CO₂", value: `${data.co2_level?.toFixed(0)}ppm`, ok: data.co2_level >= THRESHOLDS.co2.min && data.co2_level <= THRESHOLDS.co2.max, color: "text-green-600" },
                  { label: "잎 면적", value: `${data.plant_area?.toFixed(0) ?? "-"}px²`, ok: true, color: "text-purple-500" },
                ].map(c => (
                  <div key={c.label} className={`rounded-2xl p-5 shadow border-l-4 ${c.ok ? "border-green-400 bg-white" : "border-red-400 bg-red-50"}`}>
                    <div className="text-sm text-gray-500 mb-1">{c.label}</div>
                    <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
                    <div className={`text-xs mt-1 font-medium ${c.ok ? "text-green-600" : "text-red-500"}`}>
                      {c.ok ? "정상" : "범위 이탈"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. 추천 상태 */}
            {controlData && (
              <div className="bg-white rounded-2xl shadow p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">추천 상태 <span className="text-sm font-normal text-gray-400">(KNN k=5 기반)</span></h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-xl p-4 bg-blue-50 border border-blue-200">
                    <div className="text-sm text-gray-500 mb-1">추천 온도</div>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-bold text-blue-600">{controlData.recommended_temp?.toFixed(1)}°C</span>
                      <span className={`text-sm mb-1 ${data.temperature > controlData.recommended_temp + 1 ? "text-red-500" : data.temperature < controlData.recommended_temp - 1 ? "text-blue-500" : "text-green-500"}`}>
                        현재 {data.temperature?.toFixed(1)}°C
                      </span>
                    </div>
                  </div>
                  <div className="rounded-xl p-4 bg-blue-50 border border-blue-200">
                    <div className="text-sm text-gray-500 mb-1">추천 습도</div>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-bold text-blue-600">{controlData.recommended_hum?.toFixed(1)}%</span>
                      <span className={`text-sm mb-1 ${data.humidity > controlData.recommended_hum + 5 ? "text-red-500" : data.humidity < controlData.recommended_hum - 5 ? "text-blue-500" : "text-green-500"}`}>
                        현재 {data.humidity?.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. 현재 제어 상태 */}
            <div className="bg-white rounded-2xl shadow p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">현재 제어 상태</h2>
              <div className="space-y-2">
                {currentActions.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
                    <span className="font-medium text-green-700">{a}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">* 현재값과 KNN 추천값 비교 기반 · {new Date(data.created_at).toLocaleString("ko-KR")}</p>
            </div>

            {/* 5. 성장 단계 */}
            {data.plant_area !== undefined && (
              <div className="bg-white rounded-2xl shadow p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">🌱 성장 단계</h2>
                {(() => {
                  const area = data.plant_area ?? 0
                  let stage = ""
                  let desc = ""
                  let color = ""
                  if (!area) {
                    stage = "측정 불가"; desc = "식물 면적 데이터가 없습니다."; color = "text-gray-500"
                  } else if (area < 3000) {
                    stage = "정식기 (초기)"; desc = `잎 면적 ${area.toFixed(0)}px² — 초기 생육 단계입니다. 온습도를 안정적으로 유지해주세요.`; color = "text-blue-600"
                  } else if (area < 8000) {
                    stage = "생육기 (중기)"; desc = `잎 면적 ${area.toFixed(0)}px² — 활발한 성장 단계입니다. KNN 추천 환경을 유지하세요.`; color = "text-green-600"
                  } else {
                    stage = "수확기 (후기)"; desc = `잎 면적 ${area.toFixed(0)}px² — 수확 시기가 가까워졌습니다.`; color = "text-yellow-600"
                  }
                  return (
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                      <p className={`text-xl font-bold mb-2 ${color}`}>{stage}</p>
                      <p className="text-gray-600 text-sm">{desc}</p>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* 6. 제어 목록 — 그래프 + 표 */}
            {controlHistory.length > 0 && (
              <div className="bg-white rounded-2xl shadow p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">제어 목록</h2>

                {/* 잎 면적 변화 그래프 */}
                <h3 className="text-base font-bold text-gray-600 mb-3">🌱 잎 면적 변화</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="plant_area" stroke="#16a34a" strokeWidth={2} dot={false} name="잎 면적(px²)" />
                  </LineChart>
                </ResponsiveContainer>

                {/* 환경값 변화 그래프 */}
                <h3 className="text-base font-bold text-gray-600 mt-6 mb-3">📊 환경값 변화</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="온도" stroke="#f97316" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="습도" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="CO2" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>

                {/* KNN 추천값 변화 그래프 */}
                <h3 className="text-base font-bold text-gray-600 mt-6 mb-3">🤖 KNN 추천값 변화</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="추천온도" stroke="#f97316" strokeWidth={2} strokeDasharray="5 5" dot={false} name="추천온도" />
                    <Line type="monotone" dataKey="추천습도" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} name="추천습도" />
                  </LineChart>
                </ResponsiveContainer>

                {/* 시간대별 제어 기록 표 */}
                <h3 className="text-base font-bold text-gray-600 mt-6 mb-3">⚙️ 시간대별 제어 기록</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-gray-500 bg-gray-50">
                        <th className="text-left py-2 px-3 font-medium">시간</th>
                        <th className="text-left py-2 px-3 font-medium">온도</th>
                        <th className="text-left py-2 px-3 font-medium">습도</th>
                        <th className="text-left py-2 px-3 font-medium">CO₂</th>
                        <th className="text-left py-2 px-3 font-medium">잎 면적</th>
                        <th className="text-left py-2 px-3 font-medium">추천온도</th>
                        <th className="text-left py-2 px-3 font-medium">추천습도</th>
                        <th className="text-left py-2 px-3 font-medium">제어 상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...controlHistory].reverse().map((h, i) => {
                        const prev = controlHistory[controlHistory.length - 2 - i]
                        const actions = getHistoryActions(h, prev)
                        return (
                          <tr key={i} className={`border-b ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                            <td className="py-2 px-3 text-gray-400 text-xs">{new Date(h.created_at).toLocaleString("ko-KR")}</td>
                            <td className="py-2 px-3 font-medium text-orange-500">{h.temperature?.toFixed(1)}°C</td>
                            <td className="py-2 px-3 font-medium text-blue-500">{h.humidity?.toFixed(1)}%</td>
                            <td className="py-2 px-3 font-medium text-green-600">{h.co2_level?.toFixed(0)}ppm</td>
                            <td className="py-2 px-3 font-medium text-purple-500">{h.plant_area?.toFixed(0) ?? "-"}px²</td>
                            <td className="py-2 px-3 text-gray-600">{h.recommended_temp?.toFixed(1)}°C</td>
                            <td className="py-2 px-3 text-gray-600">{h.recommended_hum?.toFixed(1)}%</td>
                            <td className="py-2 px-3 text-xs text-gray-600">{actions.join(", ")}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function MonitorPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-gray-500">로딩 중...</div>}>
      <MonitorContent />
    </Suspense>
  )
}