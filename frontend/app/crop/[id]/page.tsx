"use client"

import DownloadButton from "@/components/DownloadButton"
import GraphChart from "@/components/GraphChart"
import DataTable from "@/components/DataTable"
import CropSelection from "@/components/CropSelection"
import { use, useEffect, useState } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface Props {
    params: Promise<{ id: string }>
}

export default function CropDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)

    const cropNameMap: any = {
        tomato: "토마토",
        carrot: "당근",
        lettuce: "상추",
        potato: "감자",
        onion: "양파",
        rucola: "로꼴라"
    }

    const [selected, setSelected] = useState(false)
    const [selectedDevice, setSelectedDevice] = useState("")
    const [sensorData, setSensorData] = useState<any[]>([])
    const [recommendedOrder, setRecommendedOrder] = useState<string[]>([])
    const [showDeviceStatus, setShowDeviceStatus] = useState(false)
    const [deviceStatus, setDeviceStatus] = useState<any>(null)
    const [sortOrder, setSortOrder] = useState("DESC")
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [pinMode, setPinMode] = useState(false)
    const [first, setFirst] = useState("Graph")
    const [second, setSecond] = useState("TABLE")
    const [selectedMetrics, setSelectedMetrics] = useState({
        temperature: true,
        temperature2: true,
        humidity: true,
        co2: true
    })
    const [devices, setDevices] = useState<any[]>([])

    // 방문 기록 저장
    useEffect(() => {
        if (!id) return 
        const history = JSON.parse(localStorage.getItem("cropHistory") || "[]")
        const newEntry = { id, visitedAt: new Date().toISOString() }
        const updated = [newEntry, ...history.filter((h: any) => h.id !== id)].slice(0, 10)
        localStorage.setItem("cropHistory", JSON.stringify(updated))
    }, [])

    // devices 목록 가져오기
    useEffect(() => {
        const cropAPIMAP: any = {
            lettuce: "상추", tomato: "토마토",
            carrot: "당근", potato: "감자",
            onion: "양파", rucola: "로꼴라"
        }
        fetch(`${API_URL}/devices/${encodeURIComponent(cropAPIMAP[id] || id)}`)
            .then(res => res.json())
            .then(data => setDevices(data))
            .catch(err => console.error(err))
    }, [id])

    // 센서 데이터 가져오기
    useEffect(() => {
        const cropAPIMAP: any = {
            lettuce: "상추", tomato: "토마토",
            carrot: "당근", potato: "감자",
            onion: "양파", rucola: "로꼴라"
        }
        fetch(`${API_URL}/sensor-logs/${encodeURIComponent(cropAPIMAP[id] || id)}`)
            .then(res => res.json())
            .then(data => setSensorData(data))
            .catch(err => console.log(err))
    }, [id])

    // 추천 UI 가져오기
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user") || "{}")
        fetch(`${API_URL}/preference?email=${user.email}`)
            .then(res => res.json())
            .then(data => {
                setRecommendedOrder(data.recommended_order || ["GRAPH", "TABLE"])
                setPinMode(data.pin_mode || false)
                setFirst(data.first_section || "GRAPH")
                setSecond(data.second_section || "TABLE")
            })
            .catch(() => setRecommendedOrder(["GRAPH", "TABLE"]))
    }, [])

    // device status 가져오기
    useEffect(() => {
        if (!selectedDevice) return
        fetch(`${API_URL}/device-status/${selectedDevice}`)
            .then(res => res.json())
            .then(data => setDeviceStatus(data))
    }, [selectedDevice])

    const graphData = sensorData.filter(item => item.device_id === selectedDevice)


    console.log("sensorData 개수:", sensorData.length)
    console.log("selectedDevice:", selectedDevice)
    console.log("graphData 개수:", graphData.length)
    console.log("recommendedOrder:", recommendedOrder)

    const tableData = [...graphData].sort((a, b) => {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return sortOrder === "DESC" ? dateB - dateA : dateA - dateB
    })

    // 선택된 device 정보
    const selectedDeviceInfo = devices.find(d => d.device_id === selectedDevice)

    const graphSection = (
        <div className="mb-16" onClick={() => {
            const user = JSON.parse(localStorage.getItem("user") || "{}")
            fetch(`${API_URL}/click/graph?email=${user.email}`, { method: "POST" })
        }}>
            <div className="flex gap-6 mb-6 flex-wrap">
                <label style={{ color: "#f97316" }}>
                    <input type="checkbox" checked={selectedMetrics.temperature}
                        onChange={() => setSelectedMetrics({ ...selectedMetrics, temperature: !selectedMetrics.temperature })} />
                    Temperature
                </label>
                <label style={{ color: "#a855f7" }}>
                    <input type="checkbox" checked={selectedMetrics.temperature2}
                        onChange={() => setSelectedMetrics({ ...selectedMetrics, temperature2: !selectedMetrics.temperature2 })} />
                    Temperature2
                </label>
                <label style={{ color: "#3b82f6" }}>
                    <input type="checkbox" checked={selectedMetrics.humidity}
                        onChange={() => setSelectedMetrics({ ...selectedMetrics, humidity: !selectedMetrics.humidity })} />
                    Humidity
                </label>
                <label style={{ color: "#10b981" }}>
                    <input type="checkbox" checked={selectedMetrics.co2}
                        onChange={() => setSelectedMetrics({ ...selectedMetrics, co2: !selectedMetrics.co2 })} />
                    CO2
                </label>
            </div>
            <GraphChart data={graphData} selectedMetrics={selectedMetrics} />
        </div>
    )

    const tableSection = (
        <>
            <select
                value={rowsPerPage}
                onChange={e => setRowsPerPage(Number(e.target.value))}
                className="bg-green-500 text-white px-4 py-2 rounded-xl font-bold border-none cursor-pointer"
            >
                <option value={5}>5 rows</option>
                <option value={10}>10 rows</option>
                <option value={20}>20 rows</option>
                <option value={50}>50 rows</option>
                <option value={100}>100 rows</option>
            </select>
            <div className="mb-16" onClick={() => {
                const user = JSON.parse(localStorage.getItem("user") || "{}")
                fetch(`${API_URL}/click/table?email=${user.email}`, { method: "POST" })
            }}>
                <div className="flex justify-end gap-4 mb-6">
                    <button
                        onClick={() => { fetch(`${API_URL}/click/table`, { method: "POST" }); setSortOrder("DESC") }}
                        className={`px-6 py-3 rounded-2xl font-bold text-white ${sortOrder === "DESC" ? "bg-blue-700" : "bg-blue-500 hover:bg-blue-600"}`}
                    >
                        ↓ Newest First
                    </button>
                    <button
                        onClick={() => { fetch(`${API_URL}/click/table`, { method: "POST" }); setSortOrder("ASC") }}
                        className={`px-6 py-3 rounded-2xl font-bold text-white ${sortOrder === "ASC" ? "bg-purple-700" : "bg-purple-500 hover:bg-purple-600"}`}
                    >
                        ↑ Oldest First
                    </button>
                </div>
                <DataTable data={tableData.slice(0, rowsPerPage)} />
            </div>
        </>
    )

    return (
        <div className="min-h-screen bg-gray-50">

            {/* 상단 배경 */}
            <div
                className="w-full h-[350px] bg-cover bg-center flex flex-col justify-center px-4 lg:px-20"
                style={{ backgroundImage: `url(/images/${id}.jpg)` }}
            >
                <div className="bg-white/70 p-10 rounded-3xl w-fit">
                    <h1 className="text-4xl lg:text-7xl font-bold text-orange-400">
                        {cropNameMap[id] || id}
                    </h1>
                    <p className="text-2xl mt-5 text-gray-700">Smart Farm Environment Data</p>

                    {selected && (
                        <div className="flex gap-6 mt-6 text-xl font-semibold text-gray-700 flex-wrap">
                            <p>#{selectedDevice}</p>
                            <p>#{new Date(sensorData[0]?.created_at).getFullYear()}</p>
                            <p>#{selectedDeviceInfo?.location || "위치 미등록"}</p>
                            <p>#{selectedDeviceInfo?.size || ""}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 lg:p-4 lg:p-20">
                {!selected ? (
                devices.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                    <div className="text-3xl lg:text-6xl mb-4">🌱</div>
                    <p className="text-xl font-medium text-gray-600 mb-2">아직 수집된 데이터가 없습니다</p>
                    <p className="text-sm text-gray-400">현재 {cropNameMap[id] || id} 재배 데이터가 수집되지 않았습니다</p>
                    </div>
                ) : (
                    <CropSelection
                    cropType={cropNameMap[id] || id}
                    devices={devices}
                    onSelect={(deviceID) => {
                        setSelectedDevice(deviceID)
                        setSelected(true)
                    }}
                    />
                )
                ) : (
                    <>
                        <div className="flex gap-10 items-start mb-16">
                            <div className="flex gap-6 mb-10 flex-wrap">
                                <button
                                    onClick={() => { setSelected(false); setSelectedDevice("") }}
                                    className="bg-orange-400 hover:bg-orange-500 text-white px-8 py-3 rounded-2xl text-xl font-bold"
                                >
                                    ← Back
                                </button>
                                <DownloadButton data={tableData} />
                                <button
                                    onClick={() => setShowDeviceStatus(true)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-2xl text-xl font-bold"
                                >
                                    Check Device Status
                                </button>
                            </div>
                        </div>

                        {/* Device Status Popup */}
                        {showDeviceStatus && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                <div className="bg-white p-12 rounded-3xl w-[700px] max-h-[80vh] overflow-y-auto">
                                    <h1 className="text-4xl font-bold text-blue-600 mb-8">Device Status</h1>
                                    <div className="text-2xl leading-[60px] text-gray-700">
                                        <p>• Temperature Sensor:
                                            <span className={deviceStatus?.temperature_sensor === "WARNING" ? "text-red-500" : "text-green-500"}>
                                                {deviceStatus?.temperature_sensor}
                                            </span>
                                        </p>
                                        <p>• Temperature2 Sensor:
                                            <span className={deviceStatus?.temperature2_sensor === "WARNING" ? "text-red-500" : "text-green-500"}>
                                                {deviceStatus?.temperature2_sensor}
                                            </span>
                                        </p>
                                        <p>• Humidity Sensor:
                                            <span className={deviceStatus?.humidity_sensor === "WARNING" ? "text-red-500" : "text-blue-500"}>
                                                {deviceStatus?.humidity_sensor}
                                            </span>
                                        </p>
                                        <p>• CO2 Sensor:
                                            <span className={deviceStatus?.co2_sensor === "WARNING" ? "text-red-500" : "text-green-500"}>
                                                {deviceStatus?.co2_sensor}
                                            </span>
                                        </p>
                                        <p>• Device Connection: {deviceStatus?.device_connection}</p>
                                        <p>• Last Update: {deviceStatus?.last_update}</p>
                                    </div>
                                    <button
                                        onClick={() => setShowDeviceStatus(false)}
                                        className="mt-10 bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-2xl text-xl font-bold"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}

                        {(() => {
                            const sectionMap: any = {
                                GRAPH: graphSection,
                                TABLE: tableSection
                            }
                            const validOrder = recommendedOrder?.filter(s => s && s.trim() !== "")
                            const orderedSections = (pinMode
                                ? [first, second]
                                : (validOrder?.length > 0 ? validOrder : ["GRAPH", "TABLE"])
                            ).map((s: string) => s?.toUpperCase())
                            return orderedSections.map((item: string) => (
                                <div key={item}>{sectionMap[item]}</div>
                            ))
                        })()}
                    </>
                )}
            </div>
        </div>
    )
}