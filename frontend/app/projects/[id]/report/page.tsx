'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import PageHeader from '@/components/PageHeader'
import { Download } from 'lucide-react'

type Column = { id: string; name: string; position?: number }
type Task = {
  id: string
  title: string
  description?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH'
  columnId: string
}
type ProjectDetailResponse = {
  project: { id: string; name: string; description?: string }
  board: { id: string; name: string } | null
  columns: Column[]
  tasks: Task[]
}

export default function ProjectReportPage() {
  const params = useParams()
  const rawId: any = (params as any)?.id
  const projectId = Array.isArray(rawId) ? rawId[0] : (rawId ?? '')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState<ProjectDetailResponse | null>(null)

  const reload = async () => {
    try {
      const res = await api.get(`/projects/${projectId}`)
      setData(res.data)
      setError('')
    } catch (err: any) {
      console.log('LOAD REPORT ERROR:', err?.response || err)
      setError(err?.response?.data?.error || 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  // map columnId -> columnName
  const colMap = useMemo(() => {
    const m: Record<string, string> = {}
    data?.columns?.forEach(c => (m[c.id] = c.name))
    return m
  }, [data?.columns])

  // สรุปจำนวน task ต่อคอลัมน์
  const byColumn = useMemo(() => {
    const agg: Record<string, number> = {}
    data?.tasks?.forEach(t => {
      const key = colMap[t.columnId] ?? 'Unknown'
      agg[key] = (agg[key] || 0) + 1
    })
    return agg
  }, [data?.tasks, colMap])

  // สรุปจำนวน task ต่อ priority
  const byPriority = useMemo(() => {
    const agg: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0 }
    data?.tasks?.forEach(t => {
      const p = (t.priority || 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH'
      agg[p] = (agg[p] || 0) + 1
    })
    return agg
  }, [data?.tasks])

  const totalTasks = data?.tasks?.length || 0

  // สร้าง CSV จาก tasks
  const downloadCSV = () => {
    if (!data) return
    const rows = [
      ['Project', data.project?.name || ''],
      ['Board', data.board?.name || '—'],
      [],
      ['#', 'Task Title', 'Column', 'Priority', 'Description'],
    ]

    data.tasks.forEach((t, idx) => {
      const colName = colMap[t.columnId] ?? 'Unknown'
      const pri = t.priority || 'MEDIUM'
      const desc = (t.description || '').replace(/\r?\n/g, ' ')
      rows.push([String(idx + 1), t.title, colName, pri, desc])
    })

    // escape CSV
    const escape = (s: string) =>
      `"${(s ?? '').replace(/"/g, '""')}"`

    const csv = rows.map(r => r.map(escape).join(',')).join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(data.project?.name || 'project')}-report.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!projectId) {
    return <div className="text-zinc-500 text-sm">Project not found.</div>
  }
  if (loading) {
    return <div className="text-zinc-500 text-sm">Generating report...</div>
  }
  if (error) {
    return (
      <div className="text-sm text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2">
        {error}
      </div>
    )
  }
  if (!data) {
    return <div className="text-zinc-500 text-sm">No data.</div>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        showBack
        backFallbackHref={`/projects/${projectId}`}
        title={`Report — ${data.project?.name || 'Project'}`}
        subtitle="Overview of tasks by column and priority. ดาวน์โหลดสรุปผลเป็น CSV ได้ทันที"
        actions={
          <button
            onClick={downloadCSV}
            className="
              bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium
              px-4 py-2 rounded-lg shadow-lg shadow-indigo-900/40
              border border-indigo-400/30
              transition
              inline-flex items-center gap-2
            "
            title="ดาวน์โหลด CSV"
          >
            <Download size={16} />
            Export CSV
          </button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-4">
          <div className="text-zinc-400 text-xs">Total tasks</div>
          <div className="text-zinc-100 text-2xl font-semibold">{totalTasks}</div>
        </div>
        <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-4">
          <div className="text-zinc-400 text-xs">By priority (HIGH)</div>
          <div className="text-zinc-100 text-2xl font-semibold">{byPriority.HIGH || 0}</div>
        </div>
        <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-4">
          <div className="text-zinc-400 text-xs">By priority (LOW)</div>
          <div className="text-zinc-100 text-2xl font-semibold">{byPriority.LOW || 0}</div>
        </div>
      </div>

      {/* Distribution by columns */}
      <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-4">
        <div className="text-zinc-100 font-medium mb-3">Tasks by column</div>
        {Object.keys(byColumn).length === 0 ? (
          <div className="text-zinc-500 text-sm">No columns / No tasks.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(byColumn).map(([colName, cnt]) => (
              <div
                key={colName}
                className="flex items-center justify-between rounded-lg bg-zinc-900 border border-zinc-700 p-3"
              >
                <span className="text-zinc-200 text-sm">{colName}</span>
                <span className="text-zinc-100 font-semibold">{cnt}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tasks table */}
      <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-4">
        <div className="text-zinc-100 font-medium mb-3">All tasks</div>
        {data.tasks.length === 0 ? (
          <div className="text-zinc-500 text-sm">No tasks yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-400 border-b border-zinc-700">
                  <th className="py-2 pr-4">#</th>
                  <th className="py-2 pr-4">Task title</th>
                  <th className="py-2 pr-4">Column</th>
                  <th className="py-2 pr-4">Priority</th>
                  <th className="py-2 pr-4">Description</th>
                </tr>
              </thead>
              <tbody>
                {data.tasks.map((t, i) => (
                  <tr key={t.id} className="border-b border-zinc-800 hover:bg-zinc-900/40">
                    <td className="py-2 pr-4 text-zinc-400">{i + 1}</td>
                    <td className="py-2 pr-4 text-zinc-100">{t.title}</td>
                    <td className="py-2 pr-4 text-zinc-300">{colMap[t.columnId] ?? '—'}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={
                          "text-[11px] rounded px-2 py-[2px] border " +
                          ((t.priority || 'MEDIUM') === 'HIGH'
                            ? "bg-red-500/20 border-red-500/40 text-red-300"
                            : (t.priority || 'MEDIUM') === 'LOW'
                            ? "bg-zinc-700/40 border-zinc-600 text-zinc-300"
                            : "bg-indigo-500/20 border-indigo-500/40 text-indigo-300")
                        }
                      >
                        {t.priority || 'MEDIUM'}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-zinc-400 max-w-[480px]">
                      <span className="line-clamp-2">{t.description || '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
