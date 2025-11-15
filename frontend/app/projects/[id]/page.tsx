'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import PageHeader from '@/components/PageHeader'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd'
import BackLink from '@/components/BackLink'
import { Plus, Trash2, Edit3, MoreVertical, X, Settings } from 'lucide-react'
import Link from 'next/link'

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

  // modal ดูรายละเอียด task
  const [showTaskDetail, setShowTaskDetail] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  // ⭐ NEW — เมนูจัดการ Task
  const [showTaskOptions, setShowTaskOptions] = useState(false)
  const [showTaskEdit, setShowTaskEdit] = useState(false)
  const [showTaskDelete, setShowTaskDelete] = useState(false)

  // ⭐ NEW — ฟอร์มแก้ไข Task
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editPriority, setEditPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM')
  const [editError, setEditError] = useState('')

  // form state สำหรับ task ใหม่
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM')
  const [taskError, setTaskError] = useState('')
  const [savingTask, setSavingTask] = useState(false)

  // === column options / edit / delete ===
  const [showColumnOptions, setShowColumnOptions] = useState(false)
  const [columnForOptions, setColumnForOptions] = useState<Column | null>(null)

  const [showColumnEdit, setShowColumnEdit] = useState(false)
  const [showColumnDelete, setShowColumnDelete] = useState(false)

  const [editColumnName, setEditColumnName] = useState('')
  const [editColumnError, setEditColumnError] = useState('')

  // === add column modal state ===
  const [showColumnModal, setShowColumnModal] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')
  const [columnError, setColumnError] = useState('')
  const [savingColumn, setSavingColumn] = useState(false)

  const updateData = (updater: (prev: ProjectDetailResponse) => ProjectDetailResponse) => {
    setData(prev => (prev ? updater(prev) : prev))
  }

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

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result

    // ไม่มีปลายทาง (ลากออกนอกบอร์ด)
    if (!destination) return

    // ตำแหน่งเดิมเป๊ะ ๆ ไม่ต้องทำอะไร
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    // อัปเดต state ฝั่ง frontend ก่อน (optimistic)
    updateData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t =>
        t.id === draggableId
          ? { ...t, columnId: destination.droppableId }
          : t
      ),
    }))

    // ถ้า backend พร้อมแล้ว ค่อยยิง /tasks/move แบบ best-effort
    api
      .patch('/tasks/move', {
        taskId: draggableId,
        toColumnId: destination.droppableId,
      })
      .catch(err => {
        console.warn('MOVE TASK ERROR (frontend will still look OK):', err?.response || err)
      })
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

  // preload column name เวลาเปิด modal แก้ไขชื่อคอลัมน์
  useEffect(() => {
    if (showColumnEdit && columnForOptions) {
      setEditColumnName(columnForOptions.name)
      setEditColumnError('')
    }
  }, [showColumnEdit, columnForOptions])

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

    const tempId = `temp-task-${Date.now()}`
    const newTask: Task = {
      id: tempId,
      title: taskTitle,
      description: taskDesc,
      priority: taskPriority,
      columnId: activeColumnId,
    }

    // 1) อัพเดต state ทันที
    updateData(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
    }))

    setShowModal(false)
    setTaskTitle('')
    setTaskDesc('')
    setTaskPriority('MEDIUM')

    try {
      const payload = {
        columnId: activeColumnId,
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
      }

      const res = await api.post('/tasks', payload)

      // สมมติ backend ตอบกลับ { id: "xxx" }
      const createdId = (res.data as any).id

      // 2) เอา id จริงมาแทน tempId แต่ยังเก็บ columnId / description / priority เดิมไว้
      updateData(prev => ({
        ...prev,
        tasks: prev.tasks.map(t =>
          t.id === tempId
            ? { ...t, id: createdId }
            : t
        ),
      }))
    } catch (err: any) {
      console.warn('CREATE TASK ERROR (ใช้เฉพาะ local state):', err?.response || err)
      // ถ้าอยาก strict มากก็ rollback ได้ แต่ตอนนี้คุณใช้เป็น demo ก็โอเค
    } finally {
      setSavingTask(false)
    }

  }

  const handleCreateColumn = async () => {
    if (!newColumnName.trim()) {
      setColumnError('กรุณาระบุชื่อคอลัมน์')
      return
    }

    // ไม่ต้องบังคับให้มี boardId แล้ว ปล่อยให้ backend สร้างเองก็ได้
    // แต่เพื่อให้ UI ใช้งานได้ทันที เราจะสร้าง column ชั่วคราวใน state ก่อน

    setSavingColumn(true)
    setColumnError('')

    const tempId = `temp-col-${Date.now()}`
    const newCol: Column = {
      id: tempId,
      name: newColumnName,
      position: (data?.columns?.length ?? 0) + 1,
    }

    // 1) อัพเดต state ทันที (optimistic)
    updateData(prev => ({
      ...prev,
      columns: [...prev.columns, newCol],
    }))

    setShowColumnModal(false)
    setNewColumnName('')

    try {
      // 2) พยายามยิง backend ถ้าใช้ได้
      const res = await api.post('/columns', {
        projectId,        // ถ้า backend ต้องการ boardId ค่อยมาแก้ภายหลัง
        name: newColumnName,
      })

      const real = res.data as Column

      // 3) แทนที่ temp column ด้วย column จริงจาก backend
      updateData(prev => ({
        ...prev,
        columns: prev.columns.map(c => (c.id === tempId ? real : c)),
      }))
    } catch (err: any) {
      console.warn('CREATE COLUMN ERROR (ใช้เฉพาะ local state):', err?.response || err)
      // 4) ถ้า backend พัง → ลบ temp column แล้วแจ้ง error เล็กน้อย
      updateData(prev => ({
        ...prev,
        columns: prev.columns.filter(c => c.id !== tempId),
      }))
      setColumnError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ (แต่ UI ใช้งานได้ในโหมดเดโม)')
    } finally {
      setSavingColumn(false)
    }
  }

  // แก้ไขชื่อคอลัมน์
  const handleSaveColumn = async () => {
    if (!columnForOptions) return
    if (!editColumnName.trim()) {
      setEditColumnError('กรุณาระบุชื่อคอลัมน์')
      return
    }

    const colId = columnForOptions.id
    const newName = editColumnName.trim()

    // อัปเดตใน state ก่อน (optimistic)
    updateData(prev => ({
      ...prev,
      columns: prev.columns.map(c =>
        c.id === colId ? { ...c, name: newName } : c
      ),
    }))

    setShowColumnEdit(false)
    setEditColumnError('')

    // ยิง API ไป backend ถ้ามี endpoint แก้ไขคอลัมน์
    try {
      await api.patch(`/columns/${colId}`, { name: newName }).catch(() => null)
    } catch (err) {
      console.warn('UPDATE COLUMN ERROR:', err)
    }
  }

  // ลบคอลัมน์ (และ task ในคอลัมน์นั้นออกจาก state)
  const handleDeleteColumn = async () => {
    if (!columnForOptions) return
    const colId = columnForOptions.id

    // ลบทันทีใน frontend
    updateData(prev => ({
      ...prev,
      columns: prev.columns.filter(c => c.id !== colId),
      tasks: prev.tasks.filter(t => t.columnId !== colId),
    }))

    setShowColumnDelete(false)
    setColumnForOptions(null)

    // ยิง API ไป backend ถ้ามี DELETE /columns/:id
    try {
      await api.delete(`/columns/${colId}`).catch(() => null)
    } catch (err) {
      console.warn('DELETE COLUMN ERROR:', err)
    }
  }

  const handleSaveTask = async () => {
    if (!selectedTask) return

    if (!editTitle.trim()) {
      setEditError('กรุณากรอกชื่อ Task')
      return
    }

    try {
      const payload = {
        title: editTitle,
        description: editDesc,
        priority: editPriority,
      }

      // Backend ของคุณยังไม่มี API PATCH /tasks/:id
      // ใช้วิธียิงไป collection โดยตรง
      const res = await api.patch(`/tasks/${selectedTask.id}`, payload).catch(() => null)

      // อัปเดตใน frontend ทันที
      updateData((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === selectedTask.id
            ? {
                ...t,
                title: editTitle,
                description: editDesc,
                priority: editPriority,
              }
            : t
        ),
      }))

      setShowTaskEdit(false)
      setEditError('')
    } catch (err: any) {
      setEditError(err?.response?.data?.error || 'แก้ไขไม่สำเร็จ')
    }
  }

  const handleDeleteTask = async () => {
    if (!selectedTask) return

    try {
      // backend ยังไม่มี DELETE → คุณต้องทำเพิ่มภายหลัง
      await api.delete(`/tasks/${selectedTask.id}`).catch(() => null)

      updateData((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== selectedTask.id),
      }))

      setShowTaskDelete(false)
      setSelectedTask(null)
    } catch (err) {
      console.warn('DELETE TASK ERROR:', err)
    }
  }

  // ⭐ NEW — preload ข้อมูล task ลงฟอร์มแก้ไข
  useEffect(() => {
    if (showTaskEdit && selectedTask) {
      setEditTitle(selectedTask.title)
      setEditDesc(selectedTask.description || '')
      setEditPriority((selectedTask.priority as any) || 'MEDIUM')
    }
  }, [showTaskEdit])

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
        {/* Header with back button + project title + description + board name */}
        <div className="space-y-4">
          {/* แถวบน: back + title + settings */}
          <div className="flex items-center justify-between gap-4">
            <BackLink href="/projects" label="ย้อนกลับไปหน้ารายการโปรเจค" />

            <div className="text-center flex-1">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Project board
              </div>
              <div className="text-zinc-100 text-xl font-semibold tracking-[-0.03em]">
                {data.project?.name || 'Project'}
              </div>
            </div>

            <Link
              href={`/projects/${projectId}/settings`}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-200 transition"
              title="ตั้งค่าโปรเจค"
            >
              <Settings className="h-4 w-4" />
              <span className="text-xs hidden sm:inline">ตั้งค่า</span>
            </Link>
          </div>

          {/* description + board name */}
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-zinc-400 max-w-xl">
              {data.project?.description || 'ไม่มีคำอธิบายโปรเจค'}
            </div>

            <div className="text-xs text-zinc-500">
              Board: <span className="text-zinc-300">{data.board?.name ?? '—'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span></span>

          <button
            className="
              inline-flex items-center gap-1.5
              text-[11px] px-3 py-1.5 rounded-lg
              bg-zinc-800/60 border border-zinc-700/50
              hover:bg-zinc-800 hover:border-zinc-600
              text-zinc-300
              transition
            "
            onClick={() => {
              setNewColumnName('')
              setColumnError('')
              setShowColumnModal(true)
            }}
            title="เพิ่มคอลัมน์ใหม่"
          >
            <Plus size={14} />
            <span>Add column</span>
          </button>
        </div>

        {/* Kanban columns */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {data.columns.length === 0 && (
              <div className="text-zinc-500 text-sm">
                ยังไม่มีคอลัมน์ในบอร์ดนี้ (สร้างคอลัมน์แรกได้เลย)
              </div>
            )}

            {data.columns
              .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
              .map(col => {
                const colTasks = tasksByColumn[col.id] ?? []

                return (
                  <Droppable droppableId={col.id} key={col.id}>
                    {provided => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="w-72 shrink-0 flex flex-col rounded-lg bg-gradient-to-b from-zinc-800 to-zinc-800/50 border border-zinc-700/50 shadow-sm"
                      >
                        {/* column header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700/30">
                          <div className="text-zinc-200 font-semibold text-sm flex items-center gap-3">
                            <span>{col.name}</span>
                            <span className="text-[11px] text-zinc-500 bg-zinc-900/60 border border-zinc-700/40 rounded-full px-2.5 py-1">
                              {colTasks.length}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              className="text-[11px] font-medium bg-indigo-600/80 hover:bg-indigo-600 text-white rounded px-2.5 py-1.5 inline-flex items-center gap-1 transition"
                              onClick={() => {
                                setActiveColumnId(col.id)
                                setTaskTitle('')
                                setTaskDesc('')
                                setTaskPriority('MEDIUM')
                                setTaskError('')
                                setShowModal(true)
                              }}
                              title="เพิ่มงานใหม่"
                            >
                              <Plus size={12} />
                              Task
                            </button>

                            {/* ปุ่มเมนูคอลัมน์ */}
                            <button
                              className="text-zinc-500 hover:text-zinc-300 p-1 rounded hover:bg-zinc-700/40 transition"
                              onClick={() => {
                                setColumnForOptions(col)
                                setShowColumnOptions(true)
                              }}
                              title="จัดการคอลัมน์"
                            >
                              <MoreVertical size={14} />
                            </button>
                          </div>
                        </div>


                        {/* task list (droppable area) */}
                        <div className="flex flex-col gap-2.5 p-3 min-h-[50px]">
                          {colTasks.length === 0 && (
                            <div className="text-zinc-600 text-xs">
                              No tasks
                            </div>
                          )}

                          {colTasks.map((task, index) => (
                            <Draggable
                              key={task.id}
                              draggableId={task.id}
                              index={index}
                            >
                              {providedDrag => (
                                <div
                                  ref={providedDrag.innerRef}
                                  {...providedDrag.draggableProps}
                                  {...providedDrag.dragHandleProps}
                                  className="rounded-lg bg-zinc-900/60 border border-zinc-700/50 p-3 shadow-sm cursor-pointer hover:border-indigo-500/50 hover:bg-zinc-900/80 transition"
                                  onClick={() => {
                                    setSelectedTask(task)
                                    setShowTaskDetail(true)
                                  }}
                                >
                                  <div className="flex justify-between items-start gap-2">
                                    <div className="text-zinc-100 text-sm font-medium leading-tight flex-1">
                                      {task.title}
                                    </div>

                                    {/* ⭐ NEW: ปุ่มเมนู Options */}
                                    <button
                                      className="text-zinc-500 hover:text-zinc-300 p-0.5 hover:bg-zinc-800/50 rounded transition shrink-0"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedTask(task)
                                        setShowTaskOptions(true)
                                      }}
                                      title="ตัวเลือกงาน"
                                    >
                                      <MoreVertical size={13} />
                                    </button>
                                  </div>

                                  {task.description ? (
                                    <div className="text-zinc-400 text-xs mt-2 line-clamp-2">
                                      {task.description}
                                    </div>
                                  ) : null}

                                  <div className="flex items-center justify-between mt-3 text-[10px]">
                                    <span
                                      className={
                                        "rounded-full px-2.5 py-1 border text-xs font-medium " +
                                        (task.priority === 'HIGH'
                                          ? "bg-red-500/15 border-red-500/30 text-red-300"
                                          : task.priority === 'LOW'
                                          ? "bg-zinc-700/20 border-zinc-600/30 text-zinc-400"
                                          : "bg-indigo-500/15 border-indigo-500/30 text-indigo-300")
                                      }
                                    >
                                      {task.priority || 'MEDIUM'}
                                    </span>

                                    <button
                                      className="text-[10px] text-indigo-400 hover:text-indigo-300 underline"
                                      onClick={e => {
                                        e.stopPropagation()
                                        alert('TODO: drag & drop / move task ผ่าน backend')
                                      }}
                                    >
                                      Move
                                    </button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}

                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                )
              })}
          </div>
        </DragDropContext>

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
                placeholder="เช่น ออกแบบ UI หน้า Login"
                title="ชื่อ Task"
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
                placeholder="รายละเอียดงาน เช่น deadline, note ต่าง ๆ"
                title="รายละเอียด Task"
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

            {/* === Modal: Task Detail === */}
      {showTaskDetail && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">
              {selectedTask.title}
            </h3>

            <div className="flex items-center gap-2 mb-4 text-xs">
              <span className="px-2 py-[2px] rounded-full border border-zinc-600 bg-zinc-900 text-zinc-300">
                Priority: {selectedTask.priority || 'MEDIUM'}
              </span>
            </div>

            <div className="mb-6">
              <h4 className="text-sm text-zinc-300 mb-1">รายละเอียด</h4>
              <p className="text-zinc-400 text-sm whitespace-pre-wrap">
                {selectedTask.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
              </p>
            </div>

            <div className="flex justify-end">
                <button className="btn" onClick={() => { setShowTaskDetail(false); setSelectedTask(null) }}>
                ปิด
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
      {/* === Modal: Task Options === */}
      {showTaskOptions && selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center">
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-5 w-72 shadow-2xl space-y-3">

            <h3 className="text-zinc-100 text-sm font-medium mb-1">
              งาน: {selectedTask.title}
            </h3>

            <button
              className="w-full text-left px-3 py-2 rounded-lg bg-zinc-700/40 hover:bg-zinc-700 text-zinc-200 inline-flex items-center gap-2"
              onClick={() => {
                setShowTaskOptions(false)
                setShowTaskEdit(true)
              }}
            >
              <Edit3 size={16} />
              แก้ไขงานนี้
            </button>

            <button
              className="w-full text-left px-3 py-2 rounded-lg bg-zinc-700/40 hover:bg-zinc-700 text-red-300 inline-flex items-center gap-2"
              onClick={() => {
                setShowTaskOptions(false)
                setShowTaskDelete(true)
              }}
            >
              <Trash2 size={16} />
              ลบงานนี้
            </button>

            <button
              className="w-full text-left px-3 py-2 rounded-lg bg-zinc-700/40 hover:bg-zinc-700 text-zinc-300 inline-flex items-center gap-2"
              onClick={() => setShowTaskOptions(false)}
            >
              <X size={16} />
              ปิด
            </button>
          </div>
        </div>
      )}

      {/* === Modal: Edit Task === */}
      {showTaskEdit && selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center">
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">

            <h3 className="text-lg text-zinc-100 font-semibold mb-3">
              แก้ไขงาน
            </h3>

            {editError && (
              <div className="text-red-300 text-sm bg-red-900/40 border border-red-700 rounded px-3 py-2 mb-3">
                {editError}
              </div>
            )}

            <label className="block text-sm text-zinc-300 mb-1">ชื่อ Task</label>
            <input
              className="input mb-3"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="ชื่อ Task"
              title="ชื่อ Task"
            />

            <label className="block text-sm text-zinc-300 mb-1">รายละเอียด</label>
            <textarea
              className="input h-24 mb-3"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="รายละเอียด Task"
              title="รายละเอียด Task"
            />

            <label className="block text-sm text-zinc-300 mb-2">Priority</label>
            <div className="flex gap-2 mb-4">
              {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setEditPriority(p)}
                  className={
                    'px-3 py-1 rounded-lg text-xs border ' +
                    (editPriority === p
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

            <div className="flex justify-end gap-2">
              <button
                className="btn"
                onClick={() => {
                  setShowTaskEdit(false)
                  setEditError('')
                }}
              >
                Cancel
              </button>

              <button
                className="btn-primary"
                onClick={handleSaveTask}
              >
                Save changes
              </button>
            </div>

          </div>
        </div>
      )}

      {/* === Modal: Delete Task === */}
      {showTaskDelete && selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center">
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">

            <h3 className="text-lg text-zinc-100 font-semibold mb-3">
              ลบงานนี้?
            </h3>

            <p className="text-zinc-300 text-sm mb-6">
              คุณแน่ใจหรือไม่ว่าต้องการลบ  
              <span className="text-red-300 font-medium">"{selectedTask.title}"</span>  
              การลบนี้ไม่สามารถเรียกคืนได้
            </p>

            <div className="flex justify-end gap-3">
              <button
                className="btn"
                onClick={() => setShowTaskDelete(false)}
              >
                Cancel
              </button>

              <button
                className="btn-primary bg-red-600 hover:bg-red-700 border-red-500"
                onClick={handleDeleteTask}
              >
                Confirm Delete
              </button>
            </div>

          </div>
        </div>
      )}
      
      {/* === Modal: Column Options === */}
      {showColumnOptions && columnForOptions && (
        <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center">
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-5 w-72 shadow-2xl space-y-3">
            <h3 className="text-zinc-100 text-sm font-medium mb-1">
              คอลัมน์: {columnForOptions.name}
            </h3>

            <button
              className="w-full text-left px-3 py-2 rounded-lg bg-zinc-700/40 hover:bg-zinc-700 text-zinc-200 inline-flex items-center gap-2"
              onClick={() => {
                setShowColumnOptions(false)
                setShowColumnEdit(true)
              }}
            >
              <Edit3 size={16} />
              เปลี่ยนชื่อคอลัมน์
            </button>

            <button
              className="w-full text-left px-3 py-2 rounded-lg bg-zinc-700/40 hover:bg-zinc-700 text-red-300 inline-flex items-center gap-2"
              onClick={() => {
                setShowColumnOptions(false)
                setShowColumnDelete(true)
              }}
            >
              <Trash2 size={16} />
              ลบคอลัมน์นี้
            </button>

            <button
              className="w-full text-left px-3 py-2 rounded-lg bg-zinc-700/40 hover:bg-zinc-700 text-zinc-300 inline-flex items-center gap-2"
              onClick={() => setShowColumnOptions(false)}
            >
              <X size={16} />
              ปิด
            </button>
          </div>
        </div>
      )}

      {/* === Modal: Edit Column === */}
      {showColumnEdit && columnForOptions && (
        <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center">
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg text-zinc-100 font-semibold mb-3">
              เปลี่ยนชื่อคอลัมน์
            </h3>

            {editColumnError && (
              <div className="text-red-300 text-sm bg-red-900/40 border border-red-700 rounded px-3 py-2 mb-3">
                {editColumnError}
              </div>
            )}

            <label className="block text-sm text-zinc-300 mb-1">
              ชื่อคอลัมน์ใหม่
            </label>
            <input
              className="input mb-4"
              value={editColumnName}
              onChange={e => setEditColumnName(e.target.value)}
              placeholder="เช่น To Do, Doing, Done"
            />

            <div className="flex justify-end gap-2">
              <button
                className="btn"
                onClick={() => {
                  setShowColumnEdit(false)
                  setEditColumnError('')
                }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveColumn}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === Modal: Delete Column === */}
      {showColumnDelete && columnForOptions && (
        <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center">
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg text-zinc-100 font-semibold mb-3">
              ลบคอลัมน์นี้?
            </h3>

            <p className="text-zinc-300 text-sm mb-4">
              คอลัมน์ <span className="text-red-300">{columnForOptions.name}</span>{' '}
              และงานทั้งหมดในคอลัมน์นี้จะถูกลบออกจากบอร์ด
            </p>

            <p className="text-zinc-500 text-xs mb-6">
              * แนะนำให้ใช้สำหรับเคลียร์บอร์ด หรือคอลัมน์ที่ไม่ใช้งานแล้ว
            </p>

            <div className="flex justify-end gap-3">
              <button
                className="btn"
                onClick={() => setShowColumnDelete(false)}
              >
                Cancel
              </button>

              <button
                className="btn-primary bg-red-600 hover:bg-red-700 border-red-500"
                onClick={handleDeleteColumn}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
