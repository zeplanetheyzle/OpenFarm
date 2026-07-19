"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function Signup() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const signup = async () => {
    if (!email || !password || !confirm) { setError("모든 항목을 입력해주세요."); return }
    if (password !== confirm) { setError("비밀번호가 일치하지 않습니다."); return }
    setLoading(true)
    setError("")

    const response = await fetch(`${API_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
    const data = await response.json()
    setLoading(false)

    if (data.message === "Signup successful") {
      alert("회원가입이 완료됐어요! 로그인해주세요.")
      router.push("/login")
    } else if (data.message === "User already exists") {
      setError("이미 사용 중인 이메일입니다.")
    } else {
      setError("회원가입에 실패했습니다. 다시 시도해주세요.")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") signup()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-xl p-12 w-full max-w-md">

        {/* 로고 */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-green-700 mb-2">🌿 OpenFarm</h1>
          <p className="text-gray-400 text-sm">새 계정 만들기</p>
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
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">비밀번호 확인</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="비밀번호 재입력"
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
          onClick={signup}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 mb-4"
        >
          {loading ? "가입 중..." : "회원가입"}
        </button>

        <p className="text-center text-sm text-gray-400">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="text-green-600 font-medium hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}