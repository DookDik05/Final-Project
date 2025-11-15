'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Plus, CheckCircle2, MoreVertical, Edit, Trash2, AlertCircle, Folder } from 'lucide-react'

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
  const [deleteName, setDeleteName] = useState('')
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
      setCreateErr('โปรดใส่ชื่อโปรเจค')
      return
    }

    try {
      const { data } = await api.post('/projects', {
        name: newName,
        description: newDesc,
      })

      setItems(prev => [data, ...prev])
      setShowCreateModal(false)
      setNewName('')
      setNewDesc('')
      setCreateErr('')
    } catch (err: any) {
      console.log('CREATE PROJECT ERROR:', err?.response || err)
      setCreateErr(err?.response?.data?.error || 'ไม่สามารถสร้างโปรเจคได้')
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

  // ---------- SAVE EDIT PROJECT ----------
  const handleSaveEdit = async () => {
    if (!editId) return
    if (!editName.trim()) {
      setEditErr('โปรดใส่ชื่อโปรเจค')
      return
    }

    try {
      await api.patch(`/projects/${editId}`, {
        name: editName,
        description: editDesc,
      })

      setItems(prev =>
        prev.map(p =>
          p.id === editId
            ? { ...p, name: editName, description: editDesc }
            : p
        )
      )

      setShowEditModal(false)
      setEditId(null)
      setEditName('')
      setEditDesc('')
      setEditErr('')
    } catch (err: any) {
      console.log('EDIT PROJECT ERROR:', err?.response || err)
      setEditErr(err?.response?.data?.error || 'ไม่สามารถแก้ไขโปรเจคได้')
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
      await api.delete(`/projects/${deleteId}`)
      setItems(prev => prev.filter(p => p.id !== deleteId))
      setShowDeleteModal(false)
      setDeleteId(null)
      setDeleteName('')
      setDeleteErr('')
    } catch (err: any) {
      console.log('DELETE PROJECT ERROR:', err?.response || err)
      setDeleteErr(err?.response?.data?.error || 'ไม่สามารถลบโปรเจคได้')
    }
  }

  // ===== UI =====
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">โปรเจคของคุณ</h1>
          <p className="mt-2 text-lg text-zinc-400">
            โปรเจคทั้งหมดในพื้นที่ทำงานของคุณ
          </p>
        </div>

        <button
          className="
            inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 
            px-4 py-2 text-sm font-medium text-white hover:from-indigo-700 hover:to-indigo-800 
            transition-all shadow-lg shadow-indigo-500/30
          "
          onClick={() => setShowCreateModal(true)}
          title="สร้างโปรเจคใหม่"
        >
          <Plus size={16} />
          โปรเจคใหม่
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8 text-zinc-500 text-sm">
          กำลังโหลด...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle size={18} className="flex-shrink-0" />
          {error === 'missing token' || error === 'invalid token'
            ? 'Session expired. Please sign in again.'
            : error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && (items?.length ?? 0) === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Folder size={32} className="text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">ยังไม่มีโปรเจค</p>
            <p className="text-xs text-zinc-600 mt-1">สร้างโปรเจคแรกของคุณเพื่อเริ่มต้น</p>
          </div>
        </div>
      )}

      {/* Projects grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {(items ?? []).map(p => (
          <div
          key={p.id}
          className="
            relative
            rounded-xl border border-zinc-700/50 bg-gradient-to-br from-zinc-800/50 to-zinc-900
            p-6 shadow-lg hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/10
            transition-all duration-200 group
          "
        >
          {/* ปุ่มเมนู ⋯ */}
          <div className="absolute top-4 right-4">
            <ProjectCardMenu
              onEdit={() => openEdit(p)}
              onDelete={() => openDelete(p)}
            />
          </div>

          {/* เนื้อหาโปรเจคต์ - คลิกเข้า board */}
          <Link
            href={`/projects/${p.id}`}
            className="block"
          >
            <div className="pr-10">
              <div className="font-semibold text-zinc-100 text-lg group-hover:text-indigo-400 transition-colors">
                {p.name}
              </div>

              <div className="text-zinc-400 text-sm mt-2 line-clamp-2">
                {p.description || 'ไม่มีคำอธิบาย'}
              </div>

              {/* meta: แสดงจำนวน tasks */}
              <div className="flex flex-wrap items-center gap-3 text-[12px] text-zinc-400 mt-4 pt-4 border-t border-zinc-700/30">
                <span className="
                  inline-flex items-center gap-1.5
                  bg-zinc-900/60 border border-zinc-700/50
                  rounded-lg px-3 py-1.5
                  text-zinc-300 font-medium
                ">
                  <CheckCircle2 size={14} />
                  <span>{p.taskCount ?? 0} tasks</span>
                </span>
              </div>
            </div>
          </Link>
        </div>
        ))}
      </div>

      {/* MODAL: CREATE PROJECT */}
      {showCreateModal && (
        <ModalOverlay
          onClose={() => {
            setShowCreateModal(false)
            setNewName('')
            setNewDesc('')
            setCreateErr('')
          }}
        >
          <div className="border border-zinc-700/50 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">
              สร้างโปรเจคใหม่
            </h3>

            {createErr && (
              <div className="mb-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 text-sm">
                {createErr}
              </div>
            )}

            <label className="block text-sm font-medium text-zinc-300 mb-2">
              ชื่อโปรเจค
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-700 bg-zinc-800/50 text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition-colors mb-4"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="เช่น Website Redesign"
              title="Project name"
            />

            <label className="block text-sm font-medium text-zinc-300 mb-2">
              คำอธิบาย (ตัวเลือก)
            </label>
            <textarea
              className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800/50 text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition-colors h-24 mb-4"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="สรุป ฯลฯ ของโปรเจคนี้..."
              title="Project description"
            />

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors text-sm font-medium"
                onClick={() => {
                  setShowCreateModal(false)
                  setNewName('')
                  setNewDesc('')
                  setCreateErr('')
                }}
              >
                ยกเลิก
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors text-sm font-medium shadow-lg shadow-indigo-900/40"
                onClick={handleCreate}
              >
                สร้าง
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* MODAL: EDIT PROJECT */}
      {showEditModal && (
        <ModalOverlay
          onClose={() => {
            setShowEditModal(false)
            setEditId(null)
            setEditName('')
            setEditDesc('')
            setEditErr('')
          }}
        >
          <div className="border border-zinc-700/50 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">
              แก้ไขโปรเจค
            </h3>

            {editErr && (
              <div className="mb-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 text-sm">
                {editErr}
              </div>
            )}

            <label className="block text-sm font-medium text-zinc-300 mb-2">
              ชื่อโปรเจค
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-700 bg-zinc-800/50 text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition-colors mb-4"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              title="Project name"
            />

            <label className="block text-sm font-medium text-zinc-300 mb-2">
              คำอธิบาย (ตัวเลือก)
            </label>
            <textarea
              className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800/50 text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition-colors h-24 mb-4"
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              title="Project description"
            />

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors text-sm font-medium"
                onClick={() => {
                  setShowEditModal(false)
                  setEditId(null)
                  setEditName('')
                  setEditDesc('')
                  setEditErr('')
                }}
              >
                ยกเลิก
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors text-sm font-medium shadow-lg shadow-indigo-900/40"
                onClick={handleSaveEdit}
              >
                บันทึก
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* MODAL: DELETE CONFIRM */}
      {showDeleteModal && (
        <ModalOverlay
          onClose={() => {
            setShowDeleteModal(false)
            setDeleteId(null)
            setDeleteName('')
            setDeleteErr('')
          }}
        >
          <div className="border border-zinc-700/50 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">
              ลบโปรเจค
            </h3>

            {deleteErr && (
              <div className="mb-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 text-sm">
                {deleteErr}
              </div>
            )}

            <p className="text-zinc-300 text-sm leading-relaxed mb-4">
              คุณต้องการลบ <span className="text-white font-medium">{deleteName}</span> ใช่หรือไม่?
              <br />
              การกระทำนี้ไม่สามารถเลิกทำได้
            </p>

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors text-sm font-medium"
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteId(null)
                  setDeleteName('')
                  setDeleteErr('')
                }}
              >
                ยกเลิก
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors text-sm font-medium shadow-lg shadow-red-900/40"
                onClick={handleConfirmDelete}
              >
                ลบ
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}

function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose: () => void
}) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        role="presentation"
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

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
          rounded-lg border border-zinc-700/50
          bg-zinc-900/60 text-zinc-400
          hover:bg-zinc-800 hover:border-zinc-600 hover:text-zinc-200
          text-sm font-medium transition-colors
        "
        onClick={() => setOpen(o => !o)}
        title="More actions"
      >
        <MoreVertical size={14} />
      </button>

      {open && (
        <div
          className="
            absolute right-0 mt-2 w-32
            rounded-lg border border-zinc-700/50 bg-zinc-800
            shadow-xl shadow-black/60
            text-[13px] text-zinc-200
            z-10
          "
        >
          <button
            className="
              w-full text-left px-3 py-2 hover:bg-indigo-600/20
              hover:text-indigo-300 rounded-t-lg inline-flex items-center gap-2
              transition-colors
            "
            onClick={() => { setOpen(false); onEdit() }}
          >
            <Edit size={14} />
            แก้ไข
          </button>

          <button
            className="
              w-full text-left px-3 py-2 text-red-400 hover:bg-red-950/40
              hover:text-red-300 rounded-b-lg inline-flex items-center gap-2
              transition-colors
            "
            onClick={() => { setOpen(false); onDelete() }}
          >
            <Trash2 size={14} />
            ลบ
          </button>
        </div>
      )}
    </div>
  )
}
