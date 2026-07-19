"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return { ref, visible }
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useInView()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`
      }}
    >
      {children}
    </div>
  )
}

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const { ref, visible } = useInView()
  useEffect(() => {
    if (!visible) return
    let start = 0
    const step = target / 50
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 30)
    return () => clearInterval(timer)
  }, [visible, target])
  return <span ref={ref}>{count}{suffix}</span>
}

const features = [
  { icon: "📡", title: "실시간 데이터 수집 및 열람", desc: "아두이노 센서(SHT4x, MH-Z19)와 라즈베리파이 카메라로 온습도·CO₂·식물 이미지를 자동 수집하고 그래프와 테이블로 열람합니다.", color: "from-blue-50 to-blue-100", border: "border-blue-200", iconBg: "bg-blue-100" },
  { icon: "🤖", title: "KNN AI 환경 추천", desc: "과거 성장 데이터에서 현재 식물과 가장 유사한 사례 5개를 찾아 성장률이 가장 높았던 환경을 추천합니다.", color: "from-purple-50 to-purple-100", border: "border-purple-200", iconBg: "bg-purple-100" },
  { icon: "🖥️", title: "실시간 모니터링", desc: "등록된 제어형 스마트팜의 현재 상태, 추천값, 성장 단계를 실시간으로 확인하고 그래프로 변화 추이를 파악합니다.", color: "from-cyan-50 to-cyan-100", border: "border-cyan-200", iconBg: "bg-cyan-100" },
  { icon: "⚙️", title: "자동 환경 제어", desc: "AI 추천값을 기반으로 펠티어소자·열선·환풍구를 자동 제어해 최적 재배 환경을 실현합니다.", color: "from-red-50 to-red-100", border: "border-red-200", iconBg: "bg-red-100" },
  { icon: "📊", title: "AI Growth Report", desc: "현재 환경·KNN 추천·성장 단계·제어 기록을 포함한 PDF 리포트를 자동 생성합니다.", color: "from-green-50 to-green-100", border: "border-green-200", iconBg: "bg-green-100" },
  { icon: "🔔", title: "이상 감지 알림", desc: "온습도·CO₂가 허용 범위를 벗어나면 즉시 브라우저 알림으로 사용자에게 알려줍니다.", color: "from-yellow-50 to-yellow-100", border: "border-yellow-200", iconBg: "bg-yellow-100" },
  { icon: "🌱", title: "데이터 플라이휠", desc: "사용자가 플랫폼을 이용할수록 데이터가 쌓이고 AI 추천 정확도가 지속적으로 향상됩니다.", color: "from-emerald-50 to-emerald-100", border: "border-emerald-200", iconBg: "bg-emerald-100" },
  { icon: "⭐", title: "사용자 선호도", desc: "그래프·테이블 클릭 수를 분석해 사용자가 자주 보는 항목을 먼저 보여주는 맞춤형 레이아웃을 제공합니다.", color: "from-orange-50 to-orange-100", border: "border-orange-200", iconBg: "bg-orange-100" },
]

const flow = [
  { label: "아두이노 센서", emoji: "📡", color: "bg-blue-500" },
  { label: "라즈베리파이", emoji: "🖥️", color: "bg-purple-500" },
  { label: "Supabase DB",  emoji: "💾", color: "bg-green-500" },
  { label: "KNN 모델",     emoji: "🤖", color: "bg-yellow-500" },
  { label: "환경 제어",    emoji: "⚙️", color: "bg-red-500" },
]

const stack = ["Next.js", "FastAPI", "Supabase", "Python", "Arduino", "Raspberry Pi", "KNN", "Tailwind CSS", "TypeScript"]

export default function IntroductionPage() {
  const [activeFeature, setActiveFeature] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* 히어로 섹션 */}
      <div className="relative bg-gradient-to-br from-green-600 via-green-500 to-emerald-400 text-white px-4 lg:px-20 py-32 overflow-hidden">
        {/* 배경 원 장식 */}
        <div className="absolute top-[-80px] right-[-80px] w-96 h-96 rounded-full bg-white opacity-5" />
        <div className="absolute bottom-[-60px] left-[-60px] w-72 h-72 rounded-full bg-white opacity-5" />

        <div className="max-w-4xl relative z-10">
          <div
            style={{ animation: "fadeDown 0.8s ease both" }}
          >
            <span className="bg-white bg-opacity-20 text-white text-sm font-medium px-4 py-2 rounded-full mb-6 inline-block">
              🌿 AI 기반 스마트팜 플랫폼
            </span>
            <h1 className="text-4xl lg:text-7xl font-black mb-6 leading-tight tracking-tight">
              Open<span className="text-green-200">Farm</span>
            </h1>
            <p className="text-2xl text-green-100 leading-relaxed max-w-2xl mb-10">
              식물 성장 데이터를 자동 수집·축적하고<br />
              AI Agent가 최적 재배 환경을 추천·제어하는<br />
              사용자 맞춤형 스마트팜 플랫폼
            </p>
            <Link href="/dataset">
              <button className="bg-white text-green-700 font-bold px-8 py-4 rounded-2xl hover:scale-105 transition-transform shadow-lg">
                데이터셋 보러가기 →
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* 숫자 통계 */}
      <div className="bg-gray-50 py-16 px-20 border-b">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 text-center">
        {[
        {
            label: "수집 센서 종류",
            target: 4,
            suffix: "개",
            detail: "온습도 (SHT4x) · CO₂ (MH-Z19)\n온도 센서 2개 · 카메라"        },
        {
            label: "KNN 탐색 이웃 수",
            target: 5,
            suffix: "개",
            detail: "데이터가 적을 때도 안정적으로 동작하면서\n과적합을 방지하는 최적 이웃 수"
        },
        {
            label: "자동 제어 장치",
            target: 3,
            suffix: "개",
            detail: "펠티어소자 (냉각)\n열선 (가열) · 환풍구 (환기)"
        },
        ].map((s, i) => (
        <FadeIn key={s.label} delay={i * 0.15}>
            <div className="p-6">
            <div className="text-2xl lg:text-5xl font-black text-green-600 mb-2">
                <Counter target={s.target} suffix={s.suffix} />
            </div>
            <div className="text-gray-700 font-bold mb-2">{s.label}</div>
            <div className="text-gray-400 text-sm leading-6 whitespace-pre-line">{s.detail}</div>
            </div>
        </FadeIn>
        ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 lg:px-20 py-20">

        {/* 서비스 소개 */}
        <FadeIn className="mb-20">
          <h2 className="text-4xl font-black text-green-600 mb-6">서비스 소개</h2>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-3xl p-10">
            <p className="text-xl leading-10 text-gray-700 text-center">
              OpenFarm은 스마트팜의 <strong className="text-green-700">온도·습도·CO₂ 농도</strong> 등 환경 데이터를 실시간으로 수집하고,<br />
              <strong className="text-green-700"> KNN 알고리즘</strong>을 활용해 식물 성장에 최적화된 환경을 자동으로 추천·제어하는<br />
              <strong className="text-green-700">AI Agent</strong> 기반 농업 플랫폼입니다.<br /><br />
              사용자가 플랫폼을 이용할수록 <strong className="text-green-700">데이터가 쌓이고</strong> <br />
              AI가 더 정확해지는 구조를 갖추고 있어, 처음엔 단순한 모니터링 도구로 시작하지만<br />
              시간이 지날수록 사용자 맞춤형 스마트팜 환경을 제공하는 플랫폼으로 발전합니다.<br /><br />
            </p>
          </div>
        </FadeIn>

        {/* 핵심 기능 */}
        <FadeIn className="mb-20">
          <h2 className="text-4xl font-black text-green-600 mb-8">핵심 기능</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {features.map((f, i) => (
              <div
                key={f.title}
                onClick={() => setActiveFeature(activeFeature === i ? null : i)}
                className={`bg-gradient-to-br ${f.color} border ${f.border} rounded-2xl p-6 cursor-pointer transition-all duration-300 ${activeFeature === i ? "scale-105 shadow-xl" : "hover:scale-102 hover:shadow-md"}`}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className={`${f.iconBg} rounded-xl p-3 text-2xl`}>{f.icon}</div>
                  <h3 className="text-lg font-bold text-gray-800">{f.title}</h3>
                </div>
                <div
                  style={{
                    maxHeight: activeFeature === i ? "200px" : "0",
                    overflow: "hidden",
                    transition: "max-height 0.4s ease"
                  }}
                >
                  <p className="text-gray-600 text-sm leading-6 pt-2">{f.desc}</p>
                </div>
                {activeFeature !== i && (
                  <p className="text-gray-400 text-xs mt-1">클릭해서 자세히 보기 ▼</p>
                )}
              </div>
            ))}
          </div>
        </FadeIn>

        {/* 시스템 흐름 */}
        <FadeIn className="mb-20">
          <h2 className="text-4xl font-black text-green-600 mb-8">시스템 흐름</h2>

          {/* 수집형 */}
          <div className="mb-6">
            <div className="flex items-center gap-3 flex-wrap justify-center mb-4">
              <span className="bg-blue-100 text-blue-700 text-sm font-bold px-3 py-1 rounded-full">수집형 스마트팜</span>
            </div>
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 flex justify-center">
              <div className="flex items-center gap-3 flex-wrap justify-center">
                {[
                  { emoji: "📡", label: "아두이노 센서", desc: "온습도·CO₂" },
                  { emoji: "📷", label: "라즈베리파이", desc: "카메라·전송" },
                  { emoji: "💾", label: "Supabase DB", desc: "sensor_logs" },
                  { emoji: "🤖", label: "YOLO + KNN", desc: "면적 계산·추천" },
                ].map((s, i) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <div className="bg-white rounded-xl px-4 py-3 text-center shadow-sm border border-blue-100 min-w-[90px]">
                      <div className="text-2xl mb-1">{s.emoji}</div>
                      <div className="text-xs font-bold text-gray-700">{s.label}</div>
                      <div className="text-xs text-gray-400 mt-1">{s.desc}</div>
                    </div>
                    {i < 3 && <span className="text-blue-300 text-xl font-light">→</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 연결 화살표 */}
          <div className="flex items-center justify-center my-4 gap-4">
            <div className="flex-1 border-t border-dashed border-gray-300" />
            <div className="bg-green-100 text-green-700 text-sm font-bold px-4 py-2 rounded-full text-center">
              📊 KNN 추천값<br/>
              <span className="text-xs font-normal">유사 k=5 사례 → 최적 환경 도출</span>
            </div>
            <div className="flex-1 border-t border-dashed border-gray-300" />
          </div>

          {/* 제어형 */}
          <div className="mb-6">
            <div className="flex items-center gap-3 flex-wrap justify-center mb-4">
              <span className="bg-green-100 text-green-700 text-sm font-bold px-3 py-1 rounded-full">제어형 스마트팜</span>
            </div>
            <div className="bg-green-50 rounded-2xl p-6 border border-green-100 flex justify-center">
              <div className="flex items-center gap-3 flex-wrap">
                {[
                  { emoji: "💡", label: "추천값 수신", desc: "온도·습도" },
                  { emoji: "⚙️", label: "환경 제어", desc: "펠티어·열선·환풍" },
                  { emoji: "💾", label: "Supabase DB", desc: "recommend_logs" },
                  { emoji: "🌐", label: "웹 모니터링", desc: "실시간 확인" },
                ].map((s, i) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <div className="bg-white rounded-xl px-4 py-3 text-center shadow-sm border border-green-100 min-w-[90px]">
                      <div className="text-2xl mb-1">{s.emoji}</div>
                      <div className="text-xs font-bold text-gray-700">{s.label}</div>
                      <div className="text-xs text-gray-400 mt-1">{s.desc}</div>
                    </div>
                    {i < 3 && <span className="text-green-300 text-xl font-light">→</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 폐루프 설명 */}
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
            <p className="text-green-700 text-sm font-medium">
              ↺ 제어형 스마트팜의 데이터가 쌓일수록 KNN 정확도가 향상되는 구조
            </p>
          </div>
        </FadeIn>

        {/* 개발 환경 */}
        <FadeIn className="mb-20">
          <h2 className="text-4xl font-black text-green-600 mb-6">개발 환경</h2>
          <div className="flex flex-wrap gap-3">
            {stack.map((t, i) => (
              <span
                key={t}
                className="bg-black text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-green-700 transition-colors cursor-default"
                style={{
                  animation: `fadeUp 0.4s ease ${i * 0.05}s both`
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </FadeIn>

        {/* CTA */}
        <FadeIn>
          <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-3xl p-12 text-white text-center">
            <h2 className="text-3xl font-black mb-4">지금 바로 시작해보세요</h2>
            <p className="text-green-100 mb-8 text-lg">데이터셋을 탐색하고 AI 환경 추천을 경험해보세요</p>
            <div className="flex gap-4 justify-center">
              <Link href="/dataset">
                <button className="bg-white text-green-700 font-bold px-8 py-3 rounded-xl hover:scale-105 transition-transform shadow">
                  데이터셋 보기
                </button>
              </Link>
              <Link href="/monitor">
                <button className="bg-green-700 text-white font-bold px-8 py-3 rounded-xl hover:scale-105 transition-transform border border-green-400">
                  모니터링 보기
                </button>
              </Link>
            </div>
          </div>
        </FadeIn>

      </div>

      <style jsx global>{`
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

    </div>
    )
}