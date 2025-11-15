"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    try {
      const token = localStorage.getItem('accessToken')
      if (token) {
        router.replace('/projects')
      }
    } catch {}
  }, [router])

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold mb-2">Welcome</h2>
      <p>เข้าสู่ระบบเพื่อดูโปรเจคของคุณ</p>
    </div>
  )
}
