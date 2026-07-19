"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const login = async () => {
    if (!email || !password) { setError("이메일과 비밀번호를 입력해주세요."); return }
    setLoading(true)
    setError("")
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
    const data = await response.json()
    setLoading(false)
    if (data.message === "Login successful") {
      localStorage.setItem("user", JSON.stringify(data.user))
      window.location.href = "/"
    } else {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") login()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-xl p-12 w-full max-w-md">

        {/* 로고 */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-green-700 mb-2">🌿 OpenFarm</h1>
          <p className="text-gray-400 text-sm">AI 기반 스마트팜 플랫폼</p>
        </div>

        {/* 입력 */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">이메일</label>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="hello@example.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="비밀번호 입력"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
            />
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {/* 버튼 */}
        <button
          onClick={login}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 mb-4"
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>

        <p className="text-center text-sm text-gray-400">
          계정이 없으신가요?{" "}
          <Link href="/signup" className="text-green-600 font-medium hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}