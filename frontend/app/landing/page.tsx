'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { CheckCircle2, Zap, BarChart3, Users, ArrowRight, Star } from 'lucide-react'
import Logo from '@/components/Logo'

export default function LandingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // ถ้า user login แล้ว ให้ไปหน้า dashboard เลย
  React.useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 backdrop-blur-md border-b border-zinc-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-bold text-lg text-white">TaskMgr</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-zinc-300 hover:text-white transition"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-medium"
            >
              สมัครสมาชิก
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            จัดการงานอย่างชาญฉลาด
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            ระบบจัดการโปรเจคและงานที่มีประสิทธิภาพ สร้างให้คุณและทีมของคุณประสบความสำเร็จ
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition inline-flex items-center gap-2 shadow-lg shadow-indigo-900/40"
            >
              เริ่มใช้งานฟรี
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 border border-zinc-600 hover:border-zinc-500 text-white rounded-lg font-medium transition inline-flex items-center gap-2"
            >
              ดูสาธารณะ
            </Link>
          </div>
        </div>

        {/* Hero Image */}
        <div className="mt-16 rounded-2xl border border-zinc-700/50 bg-gradient-to-br from-zinc-800 to-zinc-900 p-8 shadow-2xl">
          <div className="aspect-video bg-zinc-800/50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <CheckCircle2 className="mx-auto mb-4 text-indigo-500" size={48} />
              <p className="text-zinc-400">ภาพตัวอย่างแดชบอร์ด</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">ฟีเจอร์หลัก</h2>
          <p className="text-zinc-400">ทุกสิ่งที่คุณต้องการเพื่อให้โปรเจคประสบความสำเร็จ</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="rounded-xl bg-zinc-800/50 border border-zinc-700 p-8 hover:border-indigo-500/50 transition">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle2 className="text-indigo-400" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">จัดการงาน</h3>
            <p className="text-zinc-400 text-sm">
              สร้าง แก้ไข และติดตามงานอย่างง่ายดาย พร้อมกำหนดความสำคัญและกำหนดเวลา
            </p>
          </div>

          {/* Feature 2 */}
          <div className="rounded-xl bg-zinc-800/50 border border-zinc-700 p-8 hover:border-purple-500/50 transition">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="text-purple-400" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">ข้อมูลเชิงลึก</h3>
            <p className="text-zinc-400 text-sm">
              ดูการแสดงภาพแดชบอร์ดที่ให้ข้อมูลเชิงลึกเกี่ยวกับความคืบหน้าของโปรเจคของคุณ
            </p>
          </div>

          {/* Feature 3 */}
          <div className="rounded-xl bg-zinc-800/50 border border-zinc-700 p-8 hover:border-pink-500/50 transition">
            <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
              <Users className="text-pink-400" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">ทำงานเป็นทีม</h3>
            <p className="text-zinc-400 text-sm">
              ร่วมมือกับทีมของคุณในเวลาจริง และติดตามความคืบหน้าอย่างเรียลไทม์
            </p>
          </div>

          {/* Feature 4 */}
          <div className="rounded-xl bg-zinc-800/50 border border-zinc-700 p-8 hover:border-green-500/50 transition">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
              <Zap className="text-green-400" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">รวดเร็วและเบา</h3>
            <p className="text-zinc-400 text-sm">
              การตอบสนองรวดเร็ว ระบบงานที่เบา และประสบการณ์ผู้ใช้ที่นุ่มนวล
            </p>
          </div>

          {/* Feature 5 */}
          <div className="rounded-xl bg-zinc-800/50 border border-zinc-700 p-8 hover:border-blue-500/50 transition">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <Star className="text-blue-400" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">ออกแบบสวยงาม</h3>
            <p className="text-zinc-400 text-sm">
              ส่วนต่อประสานที่สวยงามและเข้าใจง่าย ด้วยธีมที่ทันสมัย
            </p>
          </div>

          {/* Feature 6 */}
          <div className="rounded-xl bg-zinc-800/50 border border-zinc-700 p-8 hover:border-orange-500/50 transition">
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
              <Zap className="text-orange-400" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">ใช้งานง่าย</h3>
            <p className="text-zinc-400 text-sm">
              ไม่จำเป็นต้องมีการฝึกอบรม เพียงลงชื่อเข้า แล้วเริ่มจัดการงาน
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-indigo-400 mb-2">10K+</div>
            <p className="text-zinc-400">ผู้ใช้ที่มีความสุข</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-400 mb-2">50K+</div>
            <p className="text-zinc-400">งานที่เสร็จสิ้น</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-pink-400 mb-2">1K+</div>
            <p className="text-zinc-400">ทีมที่ใช้งาน</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-400 mb-2">99.9%</div>
            <p className="text-zinc-400">อัปไทม์</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="rounded-2xl bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            พร้อมที่จะเริ่มต้นหรือยัง?
          </h2>
          <p className="text-zinc-300 mb-8 max-w-2xl mx-auto">
            เข้าร่วมผู้ใช้นับพันคนที่ใช้ TaskMgr เพื่อจัดการโปรเจคของพวกเขา
          </p>
          <Link
            href="/register"
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition inline-flex items-center gap-2 shadow-lg shadow-indigo-900/40"
          >
            สร้างบัญชีฟรี
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-700/50 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-zinc-500 text-sm">
          <p>&copy; 2025 TaskMgr. สงวนลิขสิทธิ์ทั้งหมด</p>
        </div>
      </footer>
    </div>
  )
}
