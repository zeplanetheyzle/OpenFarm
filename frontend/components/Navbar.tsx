"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

export default function Navbar() {
  const [search, setSearch] = useState("")
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const savedUser = localStorage.getItem("user")
    if (savedUser) setUser(JSON.parse(savedUser))
  }, [])

  return (
    <div className="w-full bg-green-100 px-4">
      <div className="flex items-center justify-between h-16 flex-wrap gap-2">

        {/* 로고 */}
        <Link href="/">
          <div className="text-xl font-bold text-green-700 cursor-pointer">
            OpenFarm
          </div>
        </Link>

        {/* 메뉴 */}
        <div className="flex gap-4 text-green-700 font-semibold text-base">
          <Link href="/introduction">
            <button className="cursor-pointer hover:text-green-500 transition">INTRODUCTION</button>
          </Link>
          <Link href="/dataset">
            <button className="cursor-pointer hover:text-green-500 transition">DATASET</button>
          </Link>
          {user && (
            <Link href="/monitor">
              <button className="cursor-pointer hover:text-green-500 transition">MONITOR</button>
            </Link>
          )}
          {user && (
            <div className="relative group">
              <button className="cursor-pointer hover:text-green-500 transition">MYPAGE</button>
              <div className="absolute top-full left-0 hidden group-hover:block bg-white shadow-xl rounded-xl py-2 min-w-[160px] z-50 border">
                <Link href="/mypage">
                  <div className="px-5 py-3 hover:bg-green-50 text-gray-700 text-sm font-medium cursor-pointer">⚙️ Setting</div>
                </Link>
                <Link href="/mysmartfarm">
                  <div className="px-5 py-3 hover:bg-green-50 text-gray-700 text-sm font-medium cursor-pointer">🌿 My SmartFarm</div>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* 오른쪽 */}
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && search.trim() !== "") {
                window.location.href = `/crop/${search.trim()}`
              }
            }}
            placeholder="Search"
            className="border-2 rounded-full px-3 py-1.5 text-black placeholder-black text-sm w-32"
            style={{ borderColor: "#000000" }}
          />
          {user ? (
            <button
              onClick={() => { localStorage.removeItem("user"); setUser(null); location.reload() }}
              className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm"
            >
              Logout
            </button>
          ) : (
            <div className="flex gap-2">
              <Link href="/login">
                <button className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm">Login</button>
              </Link>
              <Link href="/signup">
                <button className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm">Sign Up</button>
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}