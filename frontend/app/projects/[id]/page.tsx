'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import PageHeader from '@/components/PageHeader'

type Column = {
  id: string
  name: string
  position?: number
}

type Task = {
  id: string
  title: string
  description?: string
  priority?: string
  columnId: string
}

type ProjectDetailResponse = {
  project: {
    id: string
    name: string
    description?: string
  }
  board: {
    id: string
    name: string
  } | null
  columns: Column[]
  tasks: Task[]
}

export default function ProjectBoardPage() {
  const params = useParams()
  const rawId: any = (params as any)?.id
  const projectId = Array.isArray(rawId) ? rawId[0] : (rawId ?? '')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState<ProjectDetailResponse | null>(null)

   // modal state (น่าจะมีอยู่แล้ว)
  const [showModal, setShowModal] = useState(false)
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null)

  // form state สำหรับ task ใหม่
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM')
  const [taskError, setTaskError] = useState('')
  const [savingTask, setSavingTask] = useState(false)

  // === add column modal state ===
  const [showColumnModal, setShowColumnModal] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')
  const [columnError, setColumnError] = useState('')
  const [savingColumn, setSavingColumn] = useState(false)

  const reloadBoard = async () => {
    try {
      const res = await api.get(`/projects/${projectId}`)
      setData(res.data)
      setError('')
    } catch (err: any) {
      console.log('LOAD BOARD ERROR:', err?.response || err)
      setError(err?.response?.data?.error || 'Failed to load board')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!projectId) return
    reloadBoard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  // group tasks by columnId
  const tasksByColumn: Record<string, Task[]> = {}
  if (data?.tasks) {
    for (const t of data.tasks) {
      if (!tasksByColumn[t.columnId]) tasksByColumn[t.columnId] = []
      tasksByColumn[t.columnId].push(t)
    }
  }

  const openTaskModal = (columnId: string) => {
    setActiveColumnId(columnId)
    setTaskTitle('')
    setTaskDesc('')
    setTaskPriority('MEDIUM')
    setTaskError('')
    setShowModal(true)
  }

    const handleCreateTask = async () => {
    if (!activeColumnId) {
      setTaskError('ไม่พบคอลัมน์ปลายทาง')
      return
    }
    if (!taskTitle.trim()) {
      setTaskError('กรุณาระบุชื่อ Task')
      return
    }

    setSavingTask(true)
    setTaskError('')

    try {
      const payload = {
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        columnId: activeColumnId,
        projectId, // ถ้า backend ไม่ใช้ ลบบรรทัดนี้ออกได้
      }

      await api.post('/tasks', payload)

      // โหลดบอร์ดใหม่ให้เห็น task ที่เพิ่งสร้าง
      await reloadBoard()

      // ปิด modal + ล้างค่า
      setShowModal(false)
      setTaskTitle('')
      setTaskDesc('')
      setTaskPriority('MEDIUM')
      setTaskError('')
    } catch (err: any) {
      console.log('CREATE TASK ERROR:', err?.response || err)
      setTaskError(err?.response?.data?.error || 'สร้างงานไม่สำเร็จ')
    } finally {
      setSavingTask(false)
    }
  }

      const handleCreateColumn = async () => {
    if (!projectId) {
      setColumnError('ไม่พบ Project ID')
      return
    }
    if (!data?.board?.id) {
      setColumnError('โปรเจกต์นี้ยังไม่มีบอร์ด (board) จึงไม่สามารถสร้างคอลัมน์ได้')
      return
    }
    if (!newColumnName.trim()) {
      setColumnError('กรุณาระบุชื่อคอลัมน์')
      return
    }

    setSavingColumn(true)
    setColumnError('')

    try {
      // ฝั่ง backend ต้องการ boardId + name
      await api.post('/columns', {
        boardId: data.board.id,
        name: newColumnName,
      })

      await reloadBoard()

      setShowColumnModal(false)
      setNewColumnName('')
      setColumnError('')
    } catch (err: any) {
      console.log('CREATE COLUMN ERROR:', err?.response || err)
      setColumnError(err?.response?.data?.error || 'สร้างคอลัมน์ไม่สำเร็จ')
    } finally {
      setSavingColumn(false)
    }
  }

  // --- render states ---
  if (!projectId) {
    return <div className="text-zinc-500 text-sm">Project not found.</div>
  }

  if (loading) {
    return <div className="text-zinc-500 text-sm">Loading board...</div>
  }

  if (error) {
    return (
      <div className="text-sm text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2">
        {error}
      </div>
    )
  }

  if (!data) {
    return <div className="text-zinc-500 text-sm">No project data.</div>
  }

  return (
    <>
      <div className="space-y-6">
        {/* Page header with back */}
        <PageHeader
          showBack={true}
          backFallbackHref="/projects"
          title={data.project?.name || 'Project'}
          subtitle={
            data.project?.description
              ? data.project.description
              : 'This board tracks tasks across columns (To Do, Doing, Done).'
          }
          actions={null}
        />

        {/* Board meta small line */}
        <div className="text-xs text-zinc-500">
          Board: {data.board?.name ?? '—'}
        </div>

              {/* project header */}
      <div className="space-y-2">
        <div className="text-zinc-100 text-xl font-semibold tracking-[-0.03em]">
          {data.project?.name || 'Project'}
        </div>

        {data.project?.description ? (
          <div className="text-muted">{data.project.description}</div>
        ) : (
          <div className="text-muted">No description</div>
        )}

        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Board: {data.board?.name ?? '—'}</span>

          <button
            className="
              inline-flex items-center gap-1
              text-[11px] px-3 py-1 rounded-lg
              bg-zinc-800 border border-zinc-700
              hover:bg-zinc-700 hover:border-zinc-600
              text-zinc-200
              transition
            "
            onClick={() => {
              setNewColumnName('')
              setColumnError('')
              setShowColumnModal(true)
            }}
          >
            <span>＋</span>
            <span>Add column</span>
          </button>
        </div>
      </div>

        {/* Kanban columns */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {data.columns.length === 0 && (
            <div className="text-zinc-500 text-sm">
              No columns yet. Create columns first (Backlog, Doing, Done).
            </div>
          )}

          {data.columns
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
            .map(col => {
              const colTasks = tasksByColumn[col.id] ?? []

              return (
                <div
                  key={col.id}
                  className="w-64 shrink-0 flex flex-col rounded-xl bg-zinc-800 border border-zinc-700 shadow-xl"
                >
                  {/* column header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
                    <div className="text-zinc-100 font-medium text-sm flex items-center gap-2">
                      <span>{col.name}</span>
                      <span className="text-[10px] text-zinc-400 bg-zinc-900 border border-zinc-700 rounded px-2 py-[2px]">
                        {colTasks.length}
                      </span>
                    </div>

                    <button
                      className="text-[11px] font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded px-2 py-1 shadow-lg shadow-indigo-900/50"
                      onClick={() => {
                        setActiveColumnId(col.id)
                        setShowModal(true)
                      }}
                    >
                      + Task
                    </button>
                  </div>

                  {/* tasks list */}
                  <div className="flex flex-col gap-2 p-4">
                    {colTasks.length === 0 && (
                      <div className="text-zinc-500 text-xs italic">
                        No tasks in this column.
                      </div>
                    )}

                    {colTasks.map(task => (
                      <div
                        key={task.id}
                        className="rounded-lg bg-zinc-900 border border-zinc-700/80 p-3 shadow-lg shadow-black/40"
                      >
                        <div className="text-zinc-100 text-sm font-medium leading-tight">
                          {task.title}
                        </div>

                        {task.description ? (
                          <div className="text-zinc-400 text-xs mt-1 line-clamp-3">
                            {task.description}
                          </div>
                        ) : null}

                        <div className="flex items-center justify-between mt-3 text-[10px]">
                          {/* priority badge */}
                          <span
                            className={
                              "rounded px-2 py-[2px] border " +
                              (task.priority === 'HIGH'
                                ? "bg-red-500/20 border-red-500/40 text-red-300"
                                : task.priority === 'LOW'
                                ? "bg-zinc-700/40 border-zinc-600 text-zinc-300"
                                : "bg-indigo-500/20 border-indigo-500/40 text-indigo-300")
                            }
                          >
                            {task.priority || 'MEDIUM'}
                          </span>

                          {/* placeholder for move/drag in future */}
                          <button
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 underline"
                            onClick={() => {
                              alert('TODO: Move task / drag & drop')
                            }}
                          >
                            Move
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      {/* === Modal: Create Task === */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-zinc-100 mb-1">
              เพิ่มงานใหม่
            </h3>
            <p className="text-zinc-400 text-sm mb-4">
              งานนี้จะถูกสร้างในคอลัมน์ที่คุณเลือก
            </p>

            {taskError && (
              <div className="mb-3 text-sm text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2">
                {taskError}
              </div>
            )}

            <div className="mb-3">
              <label className="block text-sm text-zinc-300 mb-1">
                ชื่อ Task
              </label>
              <input
                className="input"
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                placeholder="เช่น ออกแบบ UI หน้าล็อกอิน"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm text-zinc-300 mb-1">
                รายละเอียด (ไม่บังคับ)
              </label>
              <textarea
                className="input h-24"
                value={taskDesc}
                onChange={e => setTaskDesc(e.target.value)}
                placeholder="เพิ่มเติมรายละเอียดงาน เช่น deadline, note ต่าง ๆ"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-zinc-300 mb-2">
                Priority
              </label>
              <div className="flex gap-2">
                {(['LOW', 'MEDIUM', 'HIGH'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setTaskPriority(p)}
                    className={
                      'px-3 py-1 rounded-lg text-xs border transition ' +
                      (taskPriority === p
                        ? p === 'HIGH'
                          ? 'bg-red-500/20 border-red-500/60 text-red-200'
                          : p === 'LOW'
                            ? 'bg-zinc-700/50 border-zinc-500 text-zinc-100'
                            : 'bg-indigo-500/20 border-indigo-500/60 text-indigo-200'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800')
                    }
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  if (savingTask) return
                  setShowModal(false)
                  setTaskError('')
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={savingTask}
                onClick={handleCreateTask}
              >
                {savingTask ? 'Saving…' : 'Create task'}
              </button>
            </div>
          </div>
        </div>
      )}
            {/* === Modal: Create Column === */}
      {showColumnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-zinc-100 mb-1">
              เพิ่มคอลัมน์ใหม่
            </h3>
            <p className="text-zinc-400 text-sm mb-4">
              ใช้สำหรับจัดกลุ่มงาน เช่น To Do, Doing, Done
            </p>

            {columnError && (
              <div className="mb-3 text-sm text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2">
                {columnError}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm text-zinc-300 mb-1">
                ชื่อคอลัมน์
              </label>
              <input
                className="input"
                placeholder="เช่น To Do, In Progress, Done"
                value={newColumnName}
                onChange={e => setNewColumnName(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  if (savingColumn) return
                  setShowColumnModal(false)
                  setColumnError('')
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={savingColumn}
                onClick={handleCreateColumn}
              >
                {savingColumn ? 'Saving…' : 'Create column'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
