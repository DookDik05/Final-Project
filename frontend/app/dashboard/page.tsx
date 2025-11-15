// frontend/app/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import {
  Folder,
  PlusCircle,
  ArrowRight,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Clock,
  Users,
  BarChart3,
  Activity,
} from 'lucide-react'

type Project = {
  id: string
  name: string
  description?: string
  color?: string
  tasksCount?: number
  taskCount?: number
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

  // Calculate statistics
  const totalProjects = projects.length
  const totalTasks = projects.reduce(
    (sum, p: any) => sum + (p.tasksCount ?? p.taskCount ?? 0),
    0
  )

  // Simulate completed tasks (in real app, would come from backend)
  const completedTasks = Math.floor(totalTasks * 0.35)
  const activeProjects = Math.max(1, Math.floor(totalProjects * 0.7))
  
  // Task distribution by priority (simulated)
  const highPriorityTasks = Math.floor(totalTasks * 0.2)
  const mediumPriorityTasks = Math.floor(totalTasks * 0.5)
  const lowPriorityTasks = totalTasks - highPriorityTasks - mediumPriorityTasks

  const recentProjects = [...projects].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime()
    const dateB = new Date(b.createdAt || 0).getTime()
    return dateB - dateA
  }).slice(0, 5)

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

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
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-900 to-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              สวัสดี, <span className="bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent">{user?.name || 'User'}</span>
            </h1>
            <p className="mt-2 text-lg text-zinc-400">
              ภาพรวมโครงการและงานของคุณ
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push('/projects')}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 transition-all"
            >
              <Folder size={18} />
              ดูทุกโปรเจค
            </button>
            <button
              onClick={() => router.push('/projects')}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-2 text-sm font-medium text-white hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-500/30"
            >
              <PlusCircle size={18} />
              สร้างโปรเจคใหม่
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3 text-red-400">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Projects */}
          <div className="rounded-xl border border-zinc-700/50 bg-gradient-to-br from-zinc-800/50 to-zinc-900 p-6 shadow-lg hover:border-indigo-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                โปรเจค
              </p>
              <div className="rounded-lg bg-indigo-500/20 p-2">
                <Folder className="text-indigo-400" size={18} />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">
              {loading ? '—' : totalProjects}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              {activeProjects} โปรเจคที่ใช้งานอยู่
            </p>
          </div>

          {/* Total Tasks */}
          <div className="rounded-xl border border-zinc-700/50 bg-gradient-to-br from-zinc-800/50 to-zinc-900 p-6 shadow-lg hover:border-blue-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                งานทั้งหมด
              </p>
              <div className="rounded-lg bg-blue-500/20 p-2">
                <Activity className="text-blue-400" size={18} />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">
              {loading ? '—' : totalTasks}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              ทั้งโปรเจค
            </p>
          </div>

          {/* Completed Tasks */}
          <div className="rounded-xl border border-zinc-700/50 bg-gradient-to-br from-zinc-800/50 to-zinc-900 p-6 shadow-lg hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                เสร็จสิ้น
              </p>
              <div className="rounded-lg bg-emerald-500/20 p-2">
                <CheckCircle2 className="text-emerald-400" size={18} />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">
              {loading ? '—' : completedTasks}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              {completionRate}% เสร็จแล้ว
            </p>
          </div>

          {/* Completion Rate */}
          <div className="rounded-xl border border-zinc-700/50 bg-gradient-to-br from-zinc-800/50 to-zinc-900 p-6 shadow-lg hover:border-violet-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                ความคืบหน้า
              </p>
              <div className="rounded-lg bg-violet-500/20 p-2">
                <TrendingUp className="text-violet-400" size={18} />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">
              {loading ? '—' : `${completionRate}%`}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              ของงานทั้งหมด
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Task Distribution by Priority */}
          <div className="rounded-xl border border-zinc-700/50 bg-gradient-to-br from-zinc-800/50 to-zinc-900 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <BarChart3 size={20} className="text-indigo-400" />
                งานตามลำดับความสำคัญ
              </h2>
            </div>

            <div className="space-y-4">
              {/* High Priority */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-zinc-300">🔴 สูง</span>
                  <span className="text-xs text-zinc-400">{highPriorityTasks}</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-300"
                    style={{
                      width: totalTasks > 0 ? `${(highPriorityTasks / totalTasks) * 100}%` : '0%',
                    }}
                  />
                </div>
              </div>

              {/* Medium Priority */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-zinc-300">🟡 ปานกลาง</span>
                  <span className="text-xs text-zinc-400">{mediumPriorityTasks}</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-full transition-all duration-300"
                    style={{
                      width: totalTasks > 0 ? `${(mediumPriorityTasks / totalTasks) * 100}%` : '0%',
                    }}
                  />
                </div>
              </div>

              {/* Low Priority */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-zinc-300">🟢 ต่ำ</span>
                  <span className="text-xs text-zinc-400">{lowPriorityTasks}</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-600 to-green-500 rounded-full transition-all duration-300"
                    style={{
                      width: totalTasks > 0 ? `${(lowPriorityTasks / totalTasks) * 100}%` : '0%',
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-700 text-xs text-zinc-500">
              จำหน่ายงานตามลำดับความสำคัญ
            </div>
          </div>

          {/* Progress Visualization */}
          <div className="rounded-xl border border-zinc-700/50 bg-gradient-to-br from-zinc-800/50 to-zinc-900 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <TrendingUp size={20} className="text-emerald-400" />
                ความคืบหน้าทั่วไป
              </h2>
            </div>

            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative w-32 h-32 mb-6">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  {/* Background circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#3f3f46"
                    strokeWidth="8"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="8"
                    strokeDasharray={`${(completionRate / 100) * 314} 314`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{completionRate}%</p>
                    <p className="text-xs text-zinc-400">เสร็จสิ้น</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-zinc-300 mb-2">
                  {completedTasks} ของ {totalTasks} งาน
                </p>
                <p className="text-xs text-zinc-500">
                  ยังเหลือ {totalTasks - completedTasks} งานในการดำเนินการ
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Projects Section */}
        <div className="rounded-xl border border-zinc-700/50 bg-gradient-to-br from-zinc-800/50 to-zinc-900 p-6 shadow-lg">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Clock size={20} className="text-amber-400" />
              โปรเจคล่าสุด
            </h2>
            <button
              onClick={() => router.push('/projects')}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              ดูทั้งหมด →
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-zinc-700/40 animate-pulse" />
              ))}
            </div>
          ) : recentProjects.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Folder size={32} className="text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">ยังไม่มีโปรเจค</p>
                <p className="text-xs text-zinc-600 mt-1">สร้างโปรเจคแรกของคุณเพื่อเริ่มต้น</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {recentProjects.map((p) => {
                const taskCount = (p as any).tasksCount ?? (p as any).taskCount ?? 0
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-700/30 bg-zinc-800/30 p-4 hover:bg-zinc-800/50 transition-all group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: p.color || '#6366f1' }}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white group-hover:text-indigo-400 transition-colors">
                            {p.name}
                          </p>
                          {p.description && (
                            <p className="truncate text-xs text-zinc-500">{p.description}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="ml-4 flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Activity size={14} className="text-zinc-500" />
                        <span className="text-sm font-medium text-white">{taskCount}</span>
                      </div>
                      <button
                        onClick={() => router.push(`/projects/${p.id}`)}
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-600 bg-zinc-800/50 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-indigo-600 hover:border-indigo-500 transition-all"
                      >
                        เปิด
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
