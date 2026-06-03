"use client"

import DownloadButton from "@/components/DownloadButton"
import GraphChart from "@/components/GraphChart"
import Navbar from "@/components/Navbar"
import DataTable from "@/components/DataTable"
import CropSelection from "@/components/CropSelection"
import AIReport from "@/components/AIReport"

import { use, useEffect, useState } from "react"

//URL parameter 타입 정의
interface Props {

    params: Promise<{
        id: string
    }>
}

export default function CropDetailPage({
    params
}: Props) {

    //URL의 crop id 가져오기
    const { id } = use(params)

    //작물 이름 한글 변환
    const cropNameMap: any = {

        tomato: "토마토",

        carrot: "당근",

        lettuce: "상추",

        potato: "감자",

        greenonion: "대파",

        rucola: "로꼴라"
    }

    //작물 선택 여부 상태 저장
    const [selected, setSelected] =
    useState(false)

    //선택된 device 저장
    const [selectedDevice, setSelectedDevice] =
    useState("")

    //센서 데이터 상태 저장
    const [sensorData, setSensorData] =
    useState<any[]>([])

    //추천 UI 상태 저장
    const [recommendedOrder, setRecommendedOrder] =
    useState<string[]>([])

    //AI Report 표시 여부
    const [showAnalysis, setShowAnalysis] =
    useState(false)

    const [showDeviceStatus, setShowDeviceStatus]=
    useState(false)
    
    const [deviceStatus, setDeviceStatus]=
    useState<any>(null)

    const [recommendation, setRecommendation]=
    useState<any[]>([])

    const [sortOrder, setSortOrder] =
    useState("DESC")
     
    const [rowsPerPage, setRowsPerPage] =
    useState(10)

    const [pinMode, setPinMode] =
    useState(false)

    const [first, setFirst] =
    useState("Graph")  

    const [second, setSecond] =
    useState("Report")  

    const [third, setThird] =
    useState("Table")

    const [selectedMetrics, setSelectedMetrics] =
    useState({

        temperature: true,

        temperature2: true,

        humidity: true,

        co2: true
    })

    //Backend API에서 센서 데이터 가져오기
    useEffect(() => {

        //API 요청용 작물 이름 변환
        const cropAPIMAP: any = {

            lettuce: "상추",

            tomato: "토마토",

            carrot: "당근",

            potato: "감자",

            greenonion: "대파",

            rucola: "로꼴라"
        }

        fetch(
            `http://127.0.0.1:8000/sensor-data/${
                cropAPIMAP[id] || id
            }`
        )

            .then((res) => res.json())

            .then((data) => {

                //가져온 데이터를 state에 저장
                setSensorData(data)
            })

            .catch((error) => {

                console.log(error)
            })

    }, [id])

    //추천 UI 데이터 가져오기
    useEffect(() => {
        const user=JSON.parse(
            localStorage.getItem("user") || "{}"
        )   

        fetch(
            `http://127.0.0.1:8000/preference?email=${user.email}`
        )

            .then((res) => res.json())

            .then((data) => {

                //추천 UI 저장
                setRecommendedOrder(
                    data.recommended_order
                )
                setPinMode(
                    data.pin_mode || false
                )

                setFirst(
                    data.first_section || "GRAPH"
                )

                setSecond(
                    data.second_section || "REPORT"
                )

                setThird(
                    data.third_section || "TABLE"
                )
            })

            .catch((error) => {

                console.log(error)

                setRecommendedOrder(["GRAPH", "REPORT", "TABLE"])
            })

    }, [])
    useEffect(() => {

        if(!selectedDevice) return

        fetch(
            `http://127.0.0.1:8000/device-status/${selectedDevice}`
        )

            .then((res) => res.json())

            .then((data) => {

                setDeviceStatus(data)
            })

    }, [selectedDevice])

    useEffect(() => {

        if(!selectedDevice) return

        fetch(
            `http://127.0.0.1:8000/recommendation/${selectedDevice}`
        )

            .then((res) => res.json())

            .then((data) => {

                console.log(
                    "recommendation data=",
                    data
                )

                setRecommendation(
                    data
                )
            })

    }, [selectedDevice])

    //선택된 device 데이터만 필터링
    // Graph 전용 데이터
    const graphData = sensorData

        .filter(

            (item) =>

                item.device_id === selectedDevice
        )

    // Table 전용 데이터
    const tableData = [...graphData]

        .sort((a,b) => {

            const dateA =
            new Date(a.created_at).getTime()

            const dateB =
            new Date(b.created_at).getTime()

            return sortOrder === "DESC"

            ?

            dateB - dateA

            :

            dateA - dateB
        })

        const graphSection = (

            <div
                className="mb-16"
            

                onClick={() => {

                    const user=JSON.parse(
                        localStorage.getItem("user") || "{}"
                    )

                    console.log(
                        "EMAIL =",
                        user.email
                    )

                    fetch(

                        `http://127.0.0.1:8000/click/graph?email=${user.email}`,

                        {
                            method: "POST"
                        }
                    )
                    .then(
                        (res) => {
                            console.log(
                                "STATUS",
                                res.status
                            )
                            return res.json()
                        }
                    )
                    .then (
                        (data) => {
                            console.log(
                                "DATA",
                                data
                            )
                        }
                    )
                    .catch(
                        (err) => {
                            console.error(
                                "FETCH ERROT",
                                err
                            )
                        }
                    )
                }}
            >
                <div className="flex gap-6 mb-6 flex-wrap">
                                
                    <label style={{ color: "#f97316" }}>

                        <input

                            type="checkbox"

                            checked={
                                selectedMetrics.temperature
                            }

                            onChange={() =>

                                setSelectedMetrics({

                                    ...selectedMetrics,

                                    temperature:
                                    !selectedMetrics.temperature
                                })
                            }
                        />

                        Temperature

                    </label>

                    <label style={{ color: "#a855f7" }}>

                        <input

                            type="checkbox"

                            checked={
                                selectedMetrics.temperature2
                            }

                            onChange={() =>

                                setSelectedMetrics({

                                    ...selectedMetrics,

                                    temperature2:
                                    !selectedMetrics.temperature2
                                })
                            }
                        />

                        Temperature2

                    </label>

                    <label style={{ color: "#3b82f6" }}>

                        <input

                            type="checkbox"

                            checked={
                                selectedMetrics.humidity
                            }

                            onChange={() =>

                                setSelectedMetrics({

                                    ...selectedMetrics,

                                    humidity:
                                    !selectedMetrics.humidity
                                })
                            }
                        />

                        Humidity

                    </label>

                    <label style={{ color: "#10b981" }}>

                        <input

                            type="checkbox"

                            checked={
                                selectedMetrics.co2
                            }

                            onChange={() =>

                                setSelectedMetrics({

                                    ...selectedMetrics,

                                    co2:
                                    !selectedMetrics.co2
                                })
                            }
                        />

                        CO2

                    </label>

                </div>
                <GraphChart
                    data={graphData}

                    selectedMetrics={
                        selectedMetrics
                    }
                />

            </div>
        )
    const reportSection = (
        <div className="mb-16">
            <button
                onClick={()=>{

                    const user=JSON.parse(
                        localStorage.getItem("user") || "{}"
                    )
                    
                    fetch(
                        `http://127.0.0.1:8000/click/report?email=${user.email}`,
                        {
                            method: "POST",
                        }
                    )
                    setShowAnalysis(
                        !showAnalysis
                    )
                }}
                
                className="
                    bg-green-500
                    hover:bg-green-600
                    text-white
                    px-10
                    py-5
                    rounded-3xl
                    text-2xl
                    font-bold
                    "
                >
                    Summary Report
            </button>
        </div>
    )

    const tableSection = (
        <>
            <select

                value={rowsPerPage}

                onChange={(e) =>

                    setRowsPerPage(
                        Number(e.target.value)
                    )
                }

                className="
                    bg-green-500   
                    text-white 
                    px-4
                    py-2
                    rounded-xl
                    font-bold
                    border-none
                    cursor-pointer'
                "
            >
                <option value={5}>
                    5 rows
                </option>

                <option value={10}>
                    10 rows
                </option>

                <option value={20}>
                    20 rows
                </option>

                <option value={50}>
                    50 rows
                </option>

                <option value={100}>
                    100 rows
                </option>

            </select>

            <div 
                className="mb-16"

                onClick={() => {

                    const user=JSON.parse(
                        localStorage.getItem("user") || "{}"
                    )

                    fetch(  
                        `http://127.0.0.1:8000/click/table?email=${user.email}`,
                        {
                            method: "POST",
                        }
                    )
                }}
            >
                <div 
                    className="
                        flex
                        justify-end
                        gap-4
                        mb-6
                    "
                >

                    <button

                        onClick={() =>{
                            fetch(
                                "http://127.0.0.1:8000/click/table",
                                {
                                    method: "POST",
                                }
                            )
                        
                        setSortOrder("DESC")
                        }}

                        className={`
                            px-6
                            py-3
                            rounded-2xl
                            font-bold
                            text-white

                            ${
                                sortOrder === "DESC"
                                ?
                                "bg-blue-700"
                                :
                                "bg-blue-500 hover:bg-blue-600"
                            }
                        `}
                    >

                        ↓ Newest First

                    </button>

                    <button

                        onClick={() =>{
                            fetch(
                                "http://127.0.0.1:8000/click/table",
                                {
                                    method: "POST",
                                }
                            )
                        
                            setSortOrder("ASC")
                        }}

                        className={`
                            px-6
                            py-3
                            rounded-2xl
                            font-bold
                            text-white

                            ${
                                sortOrder === "ASC"
                                ?
                                "bg-purple-700"
                                :
                                "bg-purple-500 hover:bg-purple-600"
                            }
                        `}
                    >

                        ↑ Oldest First

                    </button>

                </div>

            <DataTable
                data={tableData.slice(0, rowsPerPage)}
            />

        </div>
        </>
    )

    return (

        <div className="min-h-screen bg-gray-50">

            <Navbar />

            {/* 상단 배경 */}
            <div
                className="
                    w-full
                    h-[350px]
                    bg-cover
                    bg-center
                    flex
                    flex-col
                    justify-center
                    px-20
                "
                style={{
                    backgroundImage:
                    `url(/images/${id}.jpg)`
                }}
            >

                <div className="
                    bg-white/70
                    p-10
                    rounded-3xl
                    w-fit
                ">

                    <h1 className="
                        text-7xl
                        font-bold
                        text-orange-400
                    ">

                        {
                            cropNameMap[id]
                            ||
                            id
                        }

                    </h1>

                    <p className="
                        text-2xl
                        mt-5
                        text-gray-700
                    ">

                        Smart Farm Environment Data

                    </p>

                    {
                        selected &&
                        <div
                            className="
                                flex
                                gap-6
                                mt-6
                                text-xl
                                font-semibold
                                text-gray-700
                                flex-wrap
                            "
                        >

                            <p>

                                #
                                {
                                    selectedDevice.replace(
                                        "openfarm",
                                        "OpenFarm"
                                    )
                                }

                            </p>

                            <p>

                                #
                                {
                                    new Date(
                                        sensorData[0]?.created_at
                                    ).getFullYear()
                                }

                            </p>

                            <p>

                                #
                                {
                                    selectedDevice === "openfarm1"
                                    ?
                                    "형남공학관 5층 과방"

                                    :

                                    selectedDevice === "openfarm2"
                                    ?
                                    "창신관 3층"

                                    :

                                    "정보과학관 B1"
                                }

                            </p>

                            <p>

                                #
                                {
                                    selectedDevice === "openfarm1"
                                    ?
                                    "Small"

                                    :

                                    selectedDevice === "openfarm2"
                                    ?
                                    "Small"

                                    :

                                    "Small"
                                }

                            </p>

                        </div>
                    }

                </div>

            </div>

            <div className="p-20">

                {
                    !selected
                    ?

                    //작물 선택 화면
                    <CropSelection

                        cropType={
                            cropNameMap[id]
                            ||
                            id
                        }

                        createdAt={
                            sensorData[0]?.created_at
                        }

                        deviceId={
                            sensorData[0]?.device_id
                        }

                        onSelect={(deviceID) => {

                            setSelectedDevice(deviceID)

                            setSelected(true)
                        }}
                    />

                    :

                    //상세 데이터 화면
                    <>

                        {/* 버튼 + 이미지 */}
                        <div className="
                            flex
                            gap-10
                            items-start
                            mb-16
                        ">

                            {/* BACK */}
                            <div className="
                                flex
                                gap-6
                                mb-10
                                flex-wrap
                            ">

                                <button

                                    onClick={() => {

                                        setSelected(false)

                                        setSelectedDevice("")
                                    }}

                                    className="
                                        bg-orange-400
                                        hover:bg-orange-500
                                        text-white
                                        px-8
                                        py-3
                                        rounded-2xl
                                        text-xl
                                        font-bold
                                    "
                                >

                                    ← Back

                                </button>
                                    
                                {/* DOWNLOAD */}
                                <DownloadButton
                                    data={tableData}
                                />

                                {/* DEVICE STATUS */}
                                <button
                                    onClick={() =>
                                        setShowDeviceStatus(true)
                                    }
                                    className="
                                        bg-blue-500
                                        hover:bg-blue-600
                                        text-white
                                        px-8
                                        py-3
                                        rounded-2xl
                                        text-xl
                                        font-bold
                                    "
                                >

                                    Check Device Status

                                </button>

                            </div>

                        </div>

                        {/* AI Report Popup */}
                        {
                            showAnalysis
                            &&
                            <div
                                className="
                                    fixed
                                    inset-0
                                    bg-black/50
                                    flex
                                    items-center
                                    justify-center
                                    z-50
                                "
                            >

                                <div
                                    className="
                                        w-[900px]
                                        max-h-[80vh]
                                        overflow-y-auto
                                    "
                                >

                                    <AIReport
                                        data={tableData}
                                        recommendation={recommendation}
                                    />

                                    <button

                                        onClick={() =>
                                            setShowAnalysis(false)
                                        }

                                        className="
                                            mt-6
                                            bg-red-500
                                            hover:bg-red-600
                                            text-white
                                            px-8
                                            py-3
                                            rounded-2xl
                                            text-xl
                                            font-bold
                                        "
                                    >

                                        Close

                                    </button>

                                </div>

                            </div>
                        }

                        {
                            showDeviceStatus
                            &&
                            <div
                                className="
                                    fixed
                                    inset-0
                                    bg-black/50
                                    flex
                                    items-center
                                    justify-center
                                    z-50
                                "
                            >
                                <div
                                    className="
                                        bg-white
                                        p-12
                                        rounded-3xl
                                        w-[700px]
                                        max-h-[80vh]
                                        overflow-y-auto
                                    "
                                >
                                    <h1
                                        className="
                                            text-4xl
                                            font-bold
                                            text-blue-600
                                            mb-8
                                        "
                                    >
                                        Device Status
                                    </h1>
                                    
                                    <div
                                        className="
                                            text-2xl
                                            leading-[60px]
                                            text-gray-700
                                        "
                                    >

                                        <p>
                                            • Temperature Sensor:
                                            <span
                                                className={
                                                    deviceStatus?.temperature_sensor
                                                    === "WARNING"

                                                    ?

                                                    "text-red-500"

                                                    :

                                                    "text-green-500"
                                                }
                                            >
                                                {
                                                    deviceStatus?.temperature_sensor
                                                }
                                            </span>
                                        </p>

                                        <p>
                                            • Temperature2 Sensor:
                                            <span
                                                className={
                                                    deviceStatus?.temperature2_sensor
                                                    === "WARNING"

                                                    ?

                                                    "text-red-500"

                                                    :

                                                    "text-green-500"
                                                }
                                            >
                                                {
                                                    deviceStatus?.temperature2_sensor
                                                }
                                            </span>
                                        </p>

                                        <p>
                                            • Humidity Sensor:
                                            <span
                                                className={
                                                    deviceStatus?.humidity_sensor
                                                    === "WARNING"

                                                    ?

                                                    "text-red-500"

                                                    :

                                                    "text-blue-500"
                                                }  
                                            >                                          
                                                {
                                                    deviceStatus?.humidity_sensor
                                                }
                                            </span>
                                        </p>

                                        <p>
                                            • CO2 Sensor:
                                            <span
                                                className={
                                                    deviceStatus?.co2_sensor
                                                    === "WARNING"

                                                    ?

                                                    "text-red-500"

                                                    :

                                                    "text-green-500"
                                                }
                                            >                                            
                                                {
                                                    deviceStatus?.co2_sensor
                                                }
                                            </span>
                                        </p>

                                        <p>
                                            • Device Connection:
                                            {
                                                deviceStatus?.device_connection
                                            }
                                        </p>

                                        <p>
                                            • Last Update:
                                            {
                                                deviceStatus?.last_update
                                            }
                                        </p>

                                    </div>

                                    <button

                                        onClick={() =>
                                            setShowDeviceStatus(false)
                                        }

                                        className="
                                            mt-10
                                            bg-red-500
                                            hover:bg-red-600
                                            text-white
                                            px-8
                                            py-3
                                            rounded-2xl
                                            text-xl
                                            font-bold
                                        "
                                    >

                                        Close

                                    </button>

                                </div>

                            </div>
                        }
                        
                        {
                            (() => {

                                const sectionMap:any = {

                                    GRAPH:
                                    graphSection,

                                    REPORT:
                                    reportSection,

                                    TABLE:
                                    tableSection
                                }

                                let orderedSections

                                if(pinMode){

                                    orderedSections = [

                                        first,

                                        second,

                                        third
                                    ]
                                }

                                else{

                                    orderedSections =
                                    recommendedOrder
                                }

                                return orderedSections.map(

                                    (item:string) => (

                                        <div
                                            key={item}
                                        >

                                            {
                                                sectionMap[item]
                                            }

                                        </div>
                                    )
                                )

                            })()
                        }
                    </>                  
                }

            </div>

        </div>
    )
}