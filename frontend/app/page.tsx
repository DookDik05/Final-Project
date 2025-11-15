'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // ถ้า user login แล้ว → ไปหน้า dashboard
      if (user) {
        router.push('/dashboard')
      } else {
        // ถ้ายังไม่ login → ไปหน้า login
        router.push('/auth/login')
      }
    }
  }, [user, loading, router])

  // แสดง loading state ขณะตรวจสอบ
  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
      <div className="text-zinc-400">กำลังตรวจสอบการเข้าสู่ระบบ...</div>
    </div>
  )
}
