'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import React from 'react'

export default function LandingPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-8">
      {/* Hero / Welcome */}
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-[-0.04em]">
          {user
            ? `สวัสดี ${user.name}, พร้อมจัดการงานวันนี้ไหม?`
            : 'Mini Task Manager'}
        </h1>

        <p className="text-zinc-400 text-sm leading-relaxed max-w-xl">
          ระบบจัดการโปรเจคและงานแบบมินิมอล โฟกัสงานที่ต้องทำ
          ติดตามสถานะงานในคอลัมน์ (To Do / Doing / Done),
          และดูความคืบหน้าของทีมได้แบบเรียลไทม์
        </p>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/projects"
          className="
            rounded-xl bg-zinc-800 border border-zinc-700
            p-4 shadow-[0_30px_120px_rgba(0,0,0,0.8)]
            hover:bg-zinc-700/60 hover:border-zinc-600
            transition
          "
        >
          <div className="text-zinc-100 font-medium text-lg mb-1">
            ดูโปรเจคทั้งหมด
          </div>
          <div className="text-zinc-400 text-sm">
            เข้าถึงบอร์ด Kanban ของแต่ละโปรเจค เพิ่มงานใหม่ และอัปเดตสถานะ
          </div>
        </Link>

        <div
          className="
            rounded-xl bg-zinc-800 border border-zinc-700
            p-4 shadow-[0_30px_120px_rgba(0,0,0,0.8)]
          "
        >
          <div className="text-zinc-100 font-medium text-lg mb-1">
            สถานะโปรเจคล่าสุด
          </div>
          <div className="text-zinc-400 text-sm">
            สรุป high level: งานที่ยังไม่เริ่ม / กำลังทำ / เสร็จแล้ว
            (ส่วนนี้เราจะต่อยอดภายหลังด้วยการดึงข้อมูลจริง)
          </div>
        </div>

        <div
          className="
            rounded-xl bg-zinc-800 border border-zinc-700
            p-4 shadow-[0_30px_120px_rgba(0,0,0,0.8)]
          "
        >
          <div className="text-zinc-100 font-medium text-lg mb-1">
            Export รายงาน
          </div>
          <div className="text-zinc-400 text-sm">
            ดาวน์โหลดสรุปงานในรูปแบบเอกสารเพื่อส่งอาจารย์หรือหัวหน้า
            (เราจะเพิ่มหน้า /projects/[id]/report ต่อในสเต็ปถัดไป)
          </div>
        </div>
      </section>
    </div>
  )
}
