'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import PageHeader from '@/components/PageHeader'

type Project = {
  id: string
  name: string
  description?: string
  taskCount?: number
  updatedAt?: string
}

export default function ProjectsPage() {
  // ===== data state =====
  const [items, setItems] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ===== modal: create project =====
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [createErr, setCreateErr] = useState('')

  // ===== modal: edit project =====
  const [showEditModal, setShowEditModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editErr, setEditErr] = useState('')

  // ===== modal: delete confirm =====
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteName, setDeleteName] = useState('') // ไว้โชว์ชื่อใน confirm
  const [deleteErr, setDeleteErr] = useState('')

  // โหลดรายการโปรเจกต์ครั้งแรก
  useEffect(() => {
  let cancelled = false

  const load = async () => {
    try {
      // 1) โหลด list โปรเจกต์ก่อน
      const res = await api.get('/projects')
      const base: Project[] = Array.isArray(res.data) ? res.data : []
      if (!cancelled) {
        setItems(base)
      }

      // 2) โหลด detail ของแต่ละโปรเจกต์เพื่อดู tasks.length
      const withCounts = await Promise.all(
        base.map(async (p) => {
          try {
            const detailRes = await api.get(`/projects/${p.id}`)
            const tasks = detailRes.data?.tasks ?? []
            const count = Array.isArray(tasks) ? tasks.length : 0
            return { ...p, taskCount: count }
          } catch (err) {
            console.log('LOAD TASK COUNT ERROR:', err)
            return { ...p, taskCount: 0 }
          }
        })
      )

      if (!cancelled) {
        setItems(withCounts)
      }
    } catch (err: any) {
      console.log('LOAD PROJECTS ERROR:', err?.response || err)
      if (!cancelled) {
        setError(err?.response?.data?.error || 'Failed to load projects')
      }
    } finally {
      if (!cancelled) setLoading(false)
    }
  }

  load()

  return () => {
    cancelled = true
  }
}, [])


  // ---------- CREATE PROJECT ----------
  const handleCreate = async () => {
    if (!newName.trim()) {
      setCreateErr('Please enter a project name.')
      return
    }

    try {
      const { data } = await api.post('/projects', {
        name: newName,
        description: newDesc,
      })

      // เพิ่มโปรเจกต์ใหม่เข้า state ด้านบนสุด
      setItems(prev => [data, ...prev])

      // reset form
      setShowCreateModal(false)
      setNewName('')
      setNewDesc('')
      setCreateErr('')
    } catch (err: any) {
      console.log('CREATE PROJECT ERROR:', err?.response || err)
      setCreateErr(err?.response?.data?.error || 'Could not create project')
    }
  }

  // ---------- OPEN EDIT MODAL ----------
  const openEdit = (p: Project) => {
    setEditId(p.id)
    setEditName(p.name)
    setEditDesc(p.description || '')
    setEditErr('')
    setShowEditModal(true)
  }

  // ---------- SAVE EDIT PROJECT (PATCH) ----------
  const handleSaveEdit = async () => {
    if (!editId) return
    if (!editName.trim()) {
      setEditErr('Please enter a project name.')
      return
    }

    try {
      // เรียก backend ให้แก้ไข
      await api.patch(`/projects/${editId}`, {
        name: editName,
        description: editDesc,
      })

      // อัปเดต state frontend
      setItems(prev =>
        prev.map(p =>
          p.id === editId
            ? { ...p, name: editName, description: editDesc }
            : p
        )
      )

      // ปิด modal + reset
      setShowEditModal(false)
      setEditId(null)
      setEditName('')
      setEditDesc('')
      setEditErr('')
    } catch (err: any) {
      console.log('EDIT PROJECT ERROR:', err?.response || err)
      setEditErr(err?.response?.data?.error || 'Could not update project')
    }
  }

  // ---------- OPEN DELETE CONFIRM ----------
  const openDelete = (p: Project) => {
    setDeleteId(p.id)
    setDeleteName(p.name)
    setDeleteErr('')
    setShowDeleteModal(true)
  }

  // ---------- CONFIRM DELETE ----------
  const handleConfirmDelete = async () => {
    if (!deleteId) return

    try {
      // เรียก backend ลบจริง
      await api.delete(`/projects/${deleteId}`)

      // เอาออกจาก state
      setItems(prev => prev.filter(p => p.id !== deleteId))

      // ปิด modal + reset
      setShowDeleteModal(false)
      setDeleteId(null)
      setDeleteName('')
      setDeleteErr('')
    } catch (err: any) {
      console.log('DELETE PROJECT ERROR:', err?.response || err)
      setDeleteErr(err?.response?.data?.error || 'Could not delete project')
    }
  }

  // ===== UI =====
  return (
    <div className="space-y-6">

      {/* ส่วนหัวของหน้า */}
      <PageHeader
        title="Your Projects"
        subtitle="All projects in your workspace."
        showBack={false}
        actions={
          <button
            className="
              bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium
              px-4 py-2 rounded-lg shadow-lg shadow-indigo-900/40
              border border-indigo-400/30
              transition
            "
            onClick={() => setShowCreateModal(true)}
          >
            + New Project
          </button>
        }
      />

      {/* Loading */}
      {loading && (
        <div className="text-zinc-500 text-sm">
          Loading projects...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-sm text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2">
          {error === 'missing token' || error === 'invalid token'
            ? 'Session expired. Please sign in again.'
            : error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && (items?.length ?? 0) === 0 && (
        <div className="text-zinc-500 text-sm">
          You don't have any projects yet. Create your first project to get started.
        </div>
      )}

      {/* Projects grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(items ?? []).map(p => (
          <div
          key={p.id}
          className="
            relative
            rounded-xl bg-zinc-800 border border-zinc-700
            p-4 shadow-[0_30px_120px_rgba(0,0,0,0.8)]
            hover:bg-zinc-700/60 hover:border-zinc-600
            transition
          "
        >
          {/* ปุ่มเมนู ⋯ */}
          <div className="absolute top-3 right-3">
            <ProjectCardMenu
              onEdit={() => openEdit(p)}
              onDelete={() => openDelete(p)}
            />
          </div>

          {/* เนื้อหาโปรเจกต์ - คลิกเข้า board */}
          <Link
            href={`/projects/${p.id}`}
            className="block pr-10"
          >
            <div className="font-medium text-zinc-100 flex items-start justify-between">
              <span>{p.name}</span>
            </div>

            <div className="text-zinc-400 text-sm">
              {p.description || 'No description'}
            </div>

            {/* meta: แสดงจำนวน tasks */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400 mt-3">
              {/* จำนวน tasks */}
              <span className="
                inline-flex items-center gap-1
                bg-zinc-900 border border-zinc-700
                rounded px-2 py-[2px]
                text-zinc-300
              ">
                <span className="text-[10px] leading-none">📌</span>
                <span>{p.taskCount ?? 0} tasks</span>
              </span>

              {/* updatedAt */}
              {p.updatedAt && (
                <span className="text-zinc-500">
                  Last update: {p.updatedAt}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-[11px] text-zinc-500"></span>
              <Link
                href={`/projects/${p.id}/report`}
                className="text-[12px] text-indigo-400 hover:text-indigo-300 underline"
              >
                Report →
              </Link>
            </div>
          </Link>
        </div>
        ))}
      </div>

      {/* ========== MODAL: CREATE PROJECT ========== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">
              Create new project
            </h3>

            {createErr && (
              <div className="mb-3 text-red-400 bg-red-950/40 border border-red-800/50 rounded px-3 py-2 text-sm">
                {createErr}
              </div>
            )}

            <label className="block text-sm text-zinc-300 mb-1">
              Project name
            </label>
            <input
              className="input mb-3"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g. Website Redesign"
            />

            <label className="block text-sm text-zinc-300 mb-1">
              Description (optional)
            </label>
            <textarea
              className="input h-24 mb-4"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Short summary of this project..."
            />

            <div className="flex justify-end gap-2">
              <button
                className="btn"
                onClick={() => {
                  setShowCreateModal(false)
                  setNewName('')
                  setNewDesc('')
                  setCreateErr('')
                }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleCreate}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL: EDIT PROJECT ========== */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">
              Edit project
            </h3>

            {editErr && (
              <div className="mb-3 text-red-400 bg-red-950/40 border border-red-800/50 rounded px-3 py-2 text-sm">
                {editErr}
              </div>
            )}

            <label className="block text-sm text-zinc-300 mb-1">
              Project name
            </label>
            <input
              className="input mb-3"
              value={editName}
              onChange={e => setEditName(e.target.value)}
            />

            <label className="block text-sm text-zinc-300 mb-1">
              Description (optional)
            </label>
            <textarea
              className="input h-24 mb-4"
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <button
                className="btn"
                onClick={() => {
                  setShowEditModal(false)
                  setEditId(null)
                  setEditName('')
                  setEditDesc('')
                  setEditErr('')
                }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveEdit}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL: DELETE CONFIRM ========== */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">
              Delete project
            </h3>

            {deleteErr && (
              <div className="mb-3 text-red-400 bg-red-950/40 border border-red-800/50 rounded px-3 py-2 text-sm">
                {deleteErr}
              </div>
            )}

            <p className="text-zinc-300 text-sm leading-relaxed mb-4">
              Are you sure you want to delete{' '}
              <span className="text-white font-medium">{deleteName}</span>?
              <br />
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2">
              <button
                className="btn"
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteId(null)
                  setDeleteName('')
                  setDeleteErr('')
                }}
              >
                Cancel
              </button>
              <button
                className="
                  bg-red-600 hover:bg-red-700 text-white text-sm font-medium
                  px-4 py-2 rounded-lg shadow-lg shadow-red-900/40
                  border border-red-500/40
                  transition
                "
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

/**
 * ปุ่มเมนู ⋯ ของการ์ดโปรเจกต์
 * เราจะไม่ใช้ lib ภายนอก ให้ทำ dropdown เองแบบง่าย ๆ
 */
function ProjectCardMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        className="
          h-8 w-8 flex items-center justify-center
          rounded-lg border border-zinc-600
          bg-zinc-900/60 text-zinc-200
          hover:bg-zinc-800 hover:border-zinc-500
          text-sm font-medium
        "
        onClick={() => setOpen(o => !o)}
        title="More actions"
      >
        ⋯
      </button>

      {open && (
        <div
          className="
            absolute right-0 mt-2 w-32
            rounded-lg border border-zinc-700 bg-zinc-800
            shadow-xl shadow-black/60
            text-[13px] text-zinc-200
            z-10
          "
        >
          <button
            className="
              w-full text-left px-3 py-2 hover:bg-zinc-700/60
              hover:text-white rounded-t-lg
            "
            onClick={() => { setOpen(false); onEdit() }}
          >
            Edit
          </button>

          <button
            className="
              w-full text-left px-3 py-2 text-red-400 hover:bg-red-950/40
              hover:text-red-300 rounded-b-lg
            "
            onClick={() => { setOpen(false); onDelete() }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
