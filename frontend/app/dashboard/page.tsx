// frontend/app/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Folder, PlusCircle, ArrowRight, AlertCircle } from 'lucide-react'

type Project = {
  id: string
  name: string
  description?: string
  // ใน backend มี list projects พร้อม task count อยู่แล้ว (จาก docs)
  // ถ้าชื่อ field ไม่ตรง (เช่น tasksCount / taskCount) ค่อยมาแก้ทีหลังได้
  tasksCount?: number
  createdAt?: string
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError('')
        const { data } = await api.get('/projects')
        setProjects(data || [])
      } catch (err: any) {
        console.error(err)
        setError(err?.response?.data?.error || 'ไม่สามารถโหลดข้อมูล Dashboard ได้')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const totalProjects = projects.length
  const totalTasks = projects.reduce(
    (sum, p: any) => sum + (p.tasksCount ?? p.taskCount ?? 0),
    0
  )

  const recentProjects = [...projects].slice(0, 5)

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-zinc-100 flex items-center justify-center">
        <div className="animate-pulse text-sm text-zinc-400">กำลังโหลด...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-900 text-zinc-100 flex flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold">กรุณาเข้าสู่ระบบก่อนใช้งาน Dashboard</p>
        <button
          onClick={() => router.push('/login')}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 transition"
        >
          ไปหน้า Login
          <ArrowRight size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      {/* Page container */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              สวัสดี, <span className="text-indigo-400">{user.name}</span>
            </h1>
            <p className="text-sm text-zinc-400">
              ภาพรวมโปรเจค และงานในระบบ Mini Task Manager
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push('/projects')}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 transition"
            >
              <Folder size={16} />
              ดูทุกโปรเจค
            </button>
            <button
              onClick={() => router.push('/projects')}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition"
            >
              <PlusCircle size={16} />
              สร้างโปรเจคใหม่
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Stats cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              จำนวนโปรเจคทั้งหมด
            </p>
            <p className="mt-3 text-3xl font-semibold text-zinc-50">
              {loading ? '—' : totalProjects}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              จำนวน Tasks โดยประมาณ
            </p>
            <p className="mt-3 text-3xl font-semibold text-zinc-50">
              {loading ? '—' : totalTasks}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">
              *คำนวณจาก task count ในแต่ละโปรเจค
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              สถานะ
            </p>
            <p className="mt-3 text-sm text-zinc-300">
              ระบบพร้อมใช้งานหลัก ๆ แล้ว เหลือปรับ backend edit/delete + permission
            </p>
          </div>
        </div>

        {/* Recent projects */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-100">โปรเจคล่าสุด</h2>
            <button
              onClick={() => router.push('/projects')}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              ดูทั้งหมด
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              <div className="h-10 rounded-md bg-zinc-800/80 animate-pulse" />
              <div className="h-10 rounded-md bg-zinc-800/80 animate-pulse" />
              <div className="h-10 rounded-md bg-zinc-800/80 animate-pulse" />
            </div>
          ) : recentProjects.length === 0 ? (
            <p className="text-sm text-zinc-500">
              ยังไม่มีโปรเจค ลองสร้างโปรเจคแรกของคุณเลย
            </p>
          ) : (
            <ul className="divide-y divide-zinc-800">
              {recentProjects.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-100">
                      {p.name}
                    </p>
                    {p.description && (
                      <p className="truncate text-xs text-zinc-500">{p.description}</p>
                    )}
                  </div>
                  <div className="ml-4 flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-zinc-400">Tasks</p>
                      <p className="text-sm font-medium text-zinc-100">
                        {(p as any).tasksCount ?? (p as any).taskCount ?? '—'}
                      </p>
                    </div>
                    <button
                      onClick={() => router.push(`/projects/${p.id}`)}
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-2 py-1 text-[11px] text-zinc-200 hover:bg-zinc-800 transition"
                    >
                      เปิดบอร์ด
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
