"use client"

import { useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface FarmInfo {
  device_id: string
  location: string
  crop_type: string
  size: string
}

interface SensorData {
  temperature: number
  humidity: number
  co2_level: number
  plant_area?: number
  recommended_temp?: number
  recommended_hum?: number
  created_at: string
}

interface ControlLog {
  created_at: string
  temperature: number
  humidity: number
  co2_level: number
  plant_area?: number
  recommended_temp?: number
  recommended_hum?: number
}

interface Props {
  data: SensorData
  controlHistory: ControlLog[]
  farmInfo: FarmInfo | null
  onClose?: () => void
}

const THRESHOLDS = {
  temperature: { min: 18, max: 25 },
  humidity:    { min: 50, max: 70 },
  co2:         { min: 400, max: 1000 },
}

function getGrowthStage(area?: number) {
  if (!area) return { stage: "측정 불가", desc: "식물 면적 데이터가 없습니다.", color: "#6b7280" }
  if (area < 3000) return { stage: "정식기 (초기)", desc: `잎 면적 ${area.toFixed(0)}px² — 초기 생육 단계입니다.`, color: "#2563eb" }
  if (area < 8000) return { stage: "생육기 (중기)", desc: `잎 면적 ${area.toFixed(0)}px² — 활발한 성장 단계입니다.`, color: "#16a34a" }
  return { stage: "수확기 (후기)", desc: `잎 면적 ${area.toFixed(0)}px² — 수확 시기가 가까워졌습니다.`, color: "#ca8a04" }
}

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
  if (h.co2_level > THRESHOLDS.co2.max) actions.push("💨 환기")
  return actions.length > 0 ? actions.join(", ") : "✅ 정상"
}

function getSectionNumber(sections: any, currentKey: string): number {
  const order = ["farmInfo", "currentEnv", "recommendation", "currentControl", "growthStage", "plantAreaChart", "knnChart", "controlLog"]
  let num = 0
  for (const key of order) {
    if (sections[key]) num++
    if (key === currentKey) return num
  }
  return num
}

function getCurrentActions(data: SensorData): string[] {
  const actions: string[] = []
  if (data.recommended_temp !== undefined) {
    if (data.temperature > data.recommended_temp + 1) actions.push("❄️ 펠티어소자 가동 (냉각 필요)")
    else if (data.temperature < data.recommended_temp - 1) actions.push("🔥 열선 가동 (가열 필요)")
  }
  if (data.recommended_hum !== undefined) {
    if (data.humidity > data.recommended_hum + 5) actions.push("💨 환풍구 개방 (제습 필요)")
    else if (data.humidity < data.recommended_hum - 5) actions.push("💧 가습 필요")
  }
  if (data.co2_level > THRESHOLDS.co2.max) actions.push("💨 환풍구 개방 (CO₂ 과다)")
  return actions.length > 0 ? actions : ["✅ 정상 범위 유지 중"]
}

export default function AIReport({ data, controlHistory, farmInfo, onClose }: Props) {
  const [sections, setSections] = useState({
    farmInfo: true,
    currentEnv: true,
    recommendation: true,
    currentControl: true,
    growthStage: true,
    plantAreaChart: true,
    knnChart: true,
    controlLog: true,
  })

  const growth = getGrowthStage(data?.plant_area)
  const currentActions = getCurrentActions(data)

  const chartData = controlHistory.map(h => ({
    time: new Date(h.created_at).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "numeric" }),
    잎면적: h.plant_area ?? null,
    추천온도: h.recommended_temp ? Number(h.recommended_temp.toFixed(1)) : null,
    추천습도: h.recommended_hum ? Number(h.recommended_hum.toFixed(1)) : null,
  }))

  const dangerWarnings: string[] = []
  const cautionWarnings: string[] = []

  if (data) {
    if (data.temperature > THRESHOLDS.temperature.max) dangerWarnings.push(`온도 과다 (${data.temperature.toFixed(1)}°C)`)
    if (data.temperature < THRESHOLDS.temperature.min) cautionWarnings.push(`온도 낮음 (${data.temperature.toFixed(1)}°C)`)
    if (data.humidity > THRESHOLDS.humidity.max) cautionWarnings.push(`습도 과다 (${data.humidity.toFixed(1)}%)`)
    if (data.humidity < THRESHOLDS.humidity.min) cautionWarnings.push(`습도 부족 (${data.humidity.toFixed(1)}%)`)
    if (data.co2_level > THRESHOLDS.co2.max) dangerWarnings.push(`CO₂ 과다 (${data.co2_level.toFixed(0)}ppm)`)
  }

  const downloadPDF = async () => {
    const html2canvas = (await import("html2canvas")).default
    const jsPDF = (await import("jspdf")).default

    const pdf = new jsPDF("p", "mm", "a4")
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const sectionIds = ["report-s0", "report-s1", "report-s2", "report-s3", "report-s4", "report-s5", "report-sg1", "report-sg2", "report-s6"]

    let currentY = 0
    for (const sid of sectionIds) {
      const el = document.getElementById(sid)
      if (!el) continue
      const canvas = await html2canvas(el, {
        scale: 2, useCORS: true, logging: false,
        onclone: (_doc: Document, cloned: HTMLElement) => {
          cloned.querySelectorAll("*").forEach((node) => {
            const htmlEl = node as HTMLElement
            try {
              const computed = window.getComputedStyle(htmlEl)
              if (computed.backgroundColor?.includes("lab") || computed.backgroundColor?.includes("oklch"))
                htmlEl.style.backgroundColor = "#ffffff"
              if (computed.color?.includes("lab") || computed.color?.includes("oklch"))
                htmlEl.style.color = "#000000"
            } catch {}
          })
        }
      })
      const imgData = canvas.toDataURL("image/png")
      const imgHeight = (canvas.height * pdfWidth) / canvas.width
      if (currentY + imgHeight > pageHeight && currentY > 0) { pdf.addPage(); currentY = 0 }
      pdf.addImage(imgData, "PNG", 0, currentY, pdfWidth, imgHeight)
      currentY += imgHeight
    }
    pdf.save(`OpenFarm_Report_${farmInfo?.device_id || "farm"}.pdf`)
  }

  const sec = (key: string) => String(getSectionNumber(sections, key)).padStart(2, "0")

  return (
    <div style={{ backgroundColor: "#ffffff", width: "794px", borderRadius: "12px", padding: "32px 40px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>

      {/* 헤더 */}
      <div id="report-s0" style={{ borderBottom: "3px solid #16a34a", paddingBottom: "14px", marginBottom: "16px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "bold", color: "#15803d" }}>OpenFarm AI Growth Report</h1>
        <p style={{ color: "#9ca3af", fontSize: "11px", marginTop: "4px" }}>
          {farmInfo?.location} · {farmInfo?.crop_type} · Generated: {new Date().toLocaleString("ko-KR")}
        </p>
      </div>

      {/* 섹션 선택 */}
      <div style={{ backgroundColor: "#f9fafb", borderRadius: "8px", padding: "10px 12px", marginBottom: "16px", display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
        <span style={{ fontSize: "11px", fontWeight: "bold", color: "#374151" }}>포함할 섹션:</span>
        {[
          { key: "farmInfo", label: "팜 정보" },
          { key: "currentEnv", label: "현재 상태" },
          { key: "recommendation", label: "추천 상태" },
          { key: "currentControl", label: "현재 제어" },
          { key: "growthStage", label: "성장 단계" },
          { key: "plantAreaChart", label: "잎 면적 그래프" },
          { key: "knnChart", label: "KNN 추천 그래프" },
          { key: "controlLog", label: "제어 기록" },
        ].map(s => (
          <label key={s.key} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#374151", cursor: "pointer" }}>
            <input type="checkbox" checked={(sections as any)[s.key]}
              onChange={() => setSections(prev => ({ ...prev, [s.key]: !(prev as any)[s.key] }))} />
            {s.label}
          </label>
        ))}
      </div>

      {/* 경고 배너 */}
      {dangerWarnings.length === 0 && cautionWarnings.length === 0 ? (
        <div style={{ backgroundColor: "#f0fdf4", borderLeft: "3px solid #16a34a", padding: "10px", borderRadius: "8px", marginBottom: "16px", color: "#15803d", fontWeight: "500", fontSize: "12px" }}>
          ✅ 모든 환경 지표가 정상 범위입니다
        </div>
      ) : (
        <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {dangerWarnings.map((w, i) => (
            <div key={i} style={{ backgroundColor: "#fef2f2", borderLeft: "3px solid #ef4444", padding: "10px", borderRadius: "8px" }}>
              <p style={{ color: "#b91c1c", fontWeight: "bold", fontSize: "12px" }}>🚨 {w}</p>
            </div>
          ))}
          {cautionWarnings.map((w, i) => (
            <div key={i} style={{ backgroundColor: "#fefce8", borderLeft: "3px solid #eab308", padding: "10px", borderRadius: "8px" }}>
              <p style={{ color: "#854d0e", fontWeight: "bold", fontSize: "12px" }}>⚠️ {w}</p>
            </div>
          ))}
        </div>
      )}      

      {/* 1. 팜 정보 */}
      {sections.farmInfo && (
        <section id="report-s1" style={{ marginBottom: "16px" }}>
          <h2 style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "8px", color: "#1f2937" }}>
            <span style={{ color: "#16a34a" }}>{sec("farmInfo")}</span> 팜 정보
          </h2>
          <div style={{ backgroundColor: "#f9fafb", borderRadius: "8px", padding: "12px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px" }}>
            {[
              { label: "위치", value: farmInfo?.location || "-" },
              { label: "기기 ID", value: farmInfo?.device_id || "-" },
              { label: "작물", value: farmInfo?.crop_type || "-" },
              { label: "크기", value: farmInfo?.size || "-" },
            ].map(f => (
              <div key={f.label}>
                <div style={{ fontSize: "10px", color: "#9ca3af" }}>{f.label}</div>
                <div style={{ fontWeight: "bold", color: "#1f2937", marginTop: "2px", fontSize: "12px" }}>{f.value}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2. 현재 상태 */}
      {sections.currentEnv && (
        <section id="report-s2" style={{ marginBottom: "16px" }}>
          <h2 style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "8px", color: "#1f2937" }}>
            <span style={{ color: "#16a34a" }}>{sec("currentEnv")}</span> 현재 상태
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
            {[
              { label: "온도", value: `${data?.temperature?.toFixed(1) ?? "-"}°C`, color: "#f97316", ok: data?.temperature >= THRESHOLDS.temperature.min && data?.temperature <= THRESHOLDS.temperature.max },
              { label: "습도", value: `${data?.humidity?.toFixed(1) ?? "-"}%`, color: "#3b82f6", ok: data?.humidity >= THRESHOLDS.humidity.min && data?.humidity <= THRESHOLDS.humidity.max },
              { label: "CO₂", value: `${data?.co2_level?.toFixed(0) ?? "-"}ppm`, color: "#10b981", ok: data?.co2_level >= THRESHOLDS.co2.min && data?.co2_level <= THRESHOLDS.co2.max },
              { label: "잎 면적", value: `${data?.plant_area?.toFixed(0) ?? "-"}px²`, color: "#6366f1", ok: true },
            ].map(c => (
              <div key={c.label} style={{ padding: "10px", borderRadius: "8px", border: `2px solid ${c.ok ? "#bbf7d0" : "#fca5a5"}`, backgroundColor: c.ok ? "#ffffff" : "#fef2f2" }}>
                <div style={{ fontSize: "10px", color: "#9ca3af" }}>{c.label}</div>
                <div style={{ fontSize: "15px", fontWeight: "bold", marginTop: "2px", color: c.color }}>{c.value}</div>
                {!c.ok && <div style={{ fontSize: "9px", color: "#ef4444", marginTop: "2px" }}>범위 이탈</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. 추천 상태 */}
      {sections.recommendation && (
        <section id="report-s3" style={{ marginBottom: "16px" }}>
          <h2 style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "8px", color: "#1f2937" }}>
            <span style={{ color: "#16a34a" }}>{sec("recommendation")}</span> 추천 상태
            <span style={{ fontSize: "10px", fontWeight: "normal", color: "#9ca3af", marginLeft: "6px" }}>KNN k=5 기반</span>
          </h2>
          <div style={{ backgroundColor: "#f0fdf4", borderLeft: "4px solid #16a34a", padding: "12px", borderRadius: "8px" }}>
            <p style={{ fontSize: "10px", color: "#6b7280", marginBottom: "10px" }}>
              🤖 hey DB에서 현재 잎 크기와 가장 비슷한 <strong>k=5 사례</strong> 중 성장률이 가장 높은 환경을 추천했습니다
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {[
                { label: "추천 온도", value: `${data?.recommended_temp?.toFixed(1) ?? "-"}°C`, current: `현재 ${data?.temperature?.toFixed(1)}°C` },
                { label: "추천 습도", value: `${data?.recommended_hum?.toFixed(1) ?? "-"}%`, current: `현재 ${data?.humidity?.toFixed(1)}%` },
              ].map(r => (
                <div key={r.label} style={{ backgroundColor: "#ffffff", borderRadius: "8px", padding: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                  <div style={{ fontSize: "10px", color: "#9ca3af" }}>{r.label}</div>
                  <div style={{ fontSize: "16px", fontWeight: "bold", color: "#15803d", marginTop: "2px" }}>{r.value}</div>
                  <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "2px" }}>{r.current}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. 현재 제어 상태 */}
      {sections.currentControl && (
        <section id="report-s4" style={{ marginBottom: "16px" }}>
          <h2 style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "8px", color: "#1f2937" }}>
            <span style={{ color: "#16a34a" }}>{sec("currentControl")}</span> 현재 제어 상태
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {currentActions.map((a, i) => (
              <div key={i} style={{ padding: "8px 12px", borderRadius: "8px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <span style={{ fontSize: "12px", fontWeight: "500", color: "#15803d" }}>{a}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: "10px", color: "#9ca3af", marginTop: "6px" }}>* 현재값과 KNN 추천값 비교 기반 · {new Date(data.created_at).toLocaleString("ko-KR")}</p>
        </section>
      )}

      {/* 5. 성장 단계 */}
      {sections.growthStage && (
        <section id="report-s5" style={{ marginBottom: "16px" }}>
          <h2 style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "8px", color: "#1f2937" }}>
            <span style={{ color: "#16a34a" }}>{sec("growthStage")}</span> 성장 단계
          </h2>
          <div style={{ backgroundColor: "#f9fafb", padding: "12px", borderRadius: "8px", border: "1px solid #f3f4f6" }}>
            <p style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "4px", color: growth.color }}>{growth.stage}</p>
            <p style={{ color: "#4b5563", fontSize: "11px" }}>{growth.desc}</p>
          </div>
        </section>
      )}

      {/* 잎 면적 그래프 */}
      {sections.plantAreaChart && controlHistory.length > 0 && (
        <section id="report-sg1" style={{ marginBottom: "16px" }}>
          <h2 style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "8px", color: "#1f2937" }}>
            <span style={{ color: "#16a34a" }}>{sec("plantAreaChart")}</span> 잎 면적 변화
          </h2>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip />
              <Line type="monotone" dataKey="잎면적" stroke="#6366f1" strokeWidth={2} dot={false} name="잎 면적(px²)" />
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}

      {/* KNN 추천값 그래프 */}
      {sections.knnChart && controlHistory.length > 0 && (
        <section id="report-sg2" style={{ marginBottom: "16px" }}>
          <h2 style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "8px", color: "#1f2937" }}>
            <span style={{ color: "#16a34a" }}>{sec("knnChart")}</span> KNN 추천값 변화
          </h2>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
              <Line type="monotone" dataKey="추천온도" stroke="#f97316" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey="추천습도" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}

      {/* 제어 기록 */}
      {sections.controlLog && controlHistory.length > 0 && (
        <section id="report-s6" style={{ marginBottom: "16px" }}>
          <h2 style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "8px", color: "#1f2937" }}>
            <span style={{ color: "#16a34a" }}>{sec("controlLog")}</span> 시간대별 제어 기록
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: "10px", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  {["시간", "온도", "습도", "CO₂", "잎 면적", "추천온도", "추천습도", "제어 상태"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "6px 8px", color: "#6b7280", fontWeight: "500" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...controlHistory].reverse().map((h, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: i % 2 === 0 ? "#ffffff" : "#f9fafb" }}>
                    <td style={{ padding: "5px 8px", color: "#9ca3af" }}>{new Date(h.created_at).toLocaleString("ko-KR")}</td>
                    <td style={{ padding: "5px 8px", color: "#f97316", fontWeight: "500" }}>{h.temperature?.toFixed(1)}°C</td>
                    <td style={{ padding: "5px 8px", color: "#3b82f6", fontWeight: "500" }}>{h.humidity?.toFixed(1)}%</td>
                    <td style={{ padding: "5px 8px", color: "#10b981", fontWeight: "500" }}>{h.co2_level?.toFixed(0)}ppm</td>
                    <td style={{ padding: "5px 8px", color: "#6366f1", fontWeight: "500" }}>{h.plant_area?.toFixed(0) ?? "-"}px²</td>
                    <td style={{ padding: "5px 8px", color: "#374151" }}>{h.recommended_temp?.toFixed(1)}°C</td>
                    <td style={{ padding: "5px 8px", color: "#374151" }}>{h.recommended_hum?.toFixed(1)}%</td>
                    <td style={{ padding: "5px 8px", color: "#374151" }}>{getActionLabel(h)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 푸터 */}
      <div style={{ marginTop: "20px", paddingTop: "12px", borderTop: "1px solid #e5e7eb", textAlign: "center", color: "#9ca3af", fontSize: "11px" }}>
        OpenFarm Smart Agriculture Platform
      </div>

      {/* 버튼 */}
      <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
        <button onClick={downloadPDF}
          style={{ flex: 1, backgroundColor: "#3b82f6", color: "#ffffff", fontWeight: "bold", padding: "10px", borderRadius: "8px", cursor: "pointer", border: "none", fontSize: "13px" }}>
          📄 PDF 다운로드
        </button>
        {onClose && (
          <button onClick={onClose}
            style={{ flex: 1, backgroundColor: "#ef4444", color: "#ffffff", fontWeight: "bold", padding: "10px", borderRadius: "8px", cursor: "pointer", border: "none", fontSize: "13px" }}>
            닫기
          </button>
        )}
      </div>
    </div>
  )
}