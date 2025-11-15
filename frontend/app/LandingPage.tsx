'use client'

import Link from 'next/link'
import React from 'react'
import { useAuth } from '@/context/AuthContext'
import { FolderKanban, LayoutDashboard, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  const { user } = useAuth()

  const isLoggedIn = !!user

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-4 max-w-xl">
          <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">
            Mini Task Manager · Final Project
          </p>

          <h1 className="text-3xl md:text-4xl font-semibold text-zinc-100 tracking-[-0.05em]">
            {isLoggedIn
              ? `สวัสดี ${user?.name || ''} พร้อมจัดการโปรเจคของคุณไหม?`
              : 'จัดการโปรเจคและงานของทีมได้ในที่เดียว'}
          </h1>

          <p className="text-zinc-400 text-sm leading-relaxed">
            ระบบจัดการงานแบบ Kanban ที่ออกแบบมาให้เรียบง่าย ใช้งานไม่ซับซ้อน
            รองรับการสร้างโปรเจค, เพิ่มคอลัมน์, เพิ่ม Task,
            ลากย้ายงานระหว่างสถานะ และสรุปรายงานส่งอาจารย์ได้อย่างเป็นระบบ
          </p>

          {/* CTA: ปุ่มหลัก/รอง */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="
                    btn-primary inline-flex items-center gap-2
                    px-4 py-2 rounded-lg text-sm
                  "
                >
                  <LayoutDashboard size={16} />
                  <span>ไปที่ Dashboard</span>
                  <ArrowRight size={14} />
                </Link>

                <Link
                  href="/projects"
                  className="
                    inline-flex items-center gap-2 text-sm
                    px-3 py-2 rounded-lg
                    border border-zinc-700 bg-zinc-900/40
                    text-zinc-200 hover:bg-zinc-800
                  "
                >
                  <FolderKanban size={16} />
                  <span>ดูโปรเจคทั้งหมด</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="
                    btn-primary inline-flex items-center gap-2
                    px-4 py-2 rounded-lg text-sm
                  "
                >
                  <span>เริ่มใช้งาน (Login)</span>
                  <ArrowRight size={14} />
                </Link>

                <Link
                  href="/register"
                  className="
                    inline-flex items-center gap-2 text-sm
                    px-3 py-2 rounded-lg
                    border border-zinc-700 bg-zinc-900/40
                    text-zinc-200 hover:bg-zinc-800
                  "
                >
                  <span>สมัครสมาชิกใหม่</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* กล่องสรุปเล็ก ๆ ด้านขวา */}
        <div
          className="
            w-full md:w-72 rounded-2xl
            bg-zinc-900/70 border border-zinc-700
            shadow-[0_40px_140px_rgba(0,0,0,0.9)]
            p-4 space-y-3 text-sm
          "
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/60 flex items-center justify-center text-indigo-300 text-xs font-semibold">
              MT
            </div>
            <div>
              <div className="text-zinc-100 text-sm font-medium">
                Mini Task Manager
              </div>
              <div className="text-[11px] text-zinc-500">
                Final Project · Kanban · Web App
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-700/60 pt-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>ฟีเจอร์หลัก</span>
              <span className="text-zinc-300">Projects · Board · Report</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>เทคโนโลยี</span>
              <span className="text-zinc-300">Next.js · Go · MongoDB</span>
            </div>
          </div>

          <p className="text-[11px] text-zinc-500 pt-1">
            หน้า Landing นี้ใช้สำหรับแนะนำระบบและอธิบายภาพรวมเวลา Present งานต่ออาจารย์
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.85)]">
          <div className="text-zinc-100 text-sm font-medium mb-1">
            1. จัดการโปรเจค
          </div>
          <p className="text-zinc-400 text-xs leading-relaxed">
            สร้างโปรเจคใหม่, เพิ่มคำอธิบาย, และเปิดดูบอร์ด Kanban เฉพาะโปรเจคนั้น
            เหมาะกับการแบ่งงานตามวิชา หรือหัวข้อโปรเจคย่อยในทีม
          </p>
        </div>

        <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.85)]">
          <div className="text-zinc-100 text-sm font-medium mb-1">
            2. บอร์ดงานแบบ Kanban
          </div>
          <p className="text-zinc-400 text-xs leading-relaxed">
            เพิ่มคอลัมน์ (เช่น To Do, Doing, Done),
            เพิ่ม Task แต่ละงาน, กำหนด Priority และลากงานข้ามคอลัมน์เพื่อติดตามความคืบหน้า
          </p>
        </div>

        <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.85)]">
          <div className="text-zinc-100 text-sm font-medium mb-1">
            3. ใช้เป็นหลักฐานส่งอาจารย์
          </div>
          <p className="text-zinc-400 text-xs leading-relaxed">
            สามารถใช้หน้า Dashboard, Projects และบอร์ดงาน
            เป็นหลักฐานแสดงการวางแผนและติดตามงานของโปรเจคจบ
            รวมถึงขยายต่อเป็นหน้า Export รายงานได้
          </p>
        </div>
      </section>
    </div>
  )
}
