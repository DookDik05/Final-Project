'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import LandingPage from './landing/page'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // ถ้า user login แล้ว + loading เสร็จแล้ว → ไปหน้า dashboard
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  // ขณะ loading ให้แสดง loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-zinc-400">กำลังตรวจสอบการเข้าสู่ระบบ...</div>
      </div>
    )
  }

  // ถ้า login แล้ว อย่าแสดง landing page เลย (รอให้ redirect เสร็จ)
  if (user) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-zinc-400">กำลังไปหน้า Dashboard...</div>
      </div>
    )
  }

  // ถ้ายังไม่ login ก็แสดง landing page ปกติ
  return <LandingPage />
}
