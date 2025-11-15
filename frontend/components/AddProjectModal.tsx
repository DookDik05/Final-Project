'use client'

import React, { useState, useEffect } from 'react'
import { api } from '@/lib/api'

type AddProjectModalProps = {
  isOpen: boolean
  onClose: () => void
  onCreated: (project: { id: string; name: string; description?: string }) => void
}

export default function AddProjectModal({ isOpen, onClose, onCreated }: AddProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, saving, onClose])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('กรุณากรอกชื่อโปรเจค')
      return
    }
    setSaving(true)
    setError('')
    try {
      const { data } = await api.post('/projects', { name, description })
      // clear and close
      setName('')
      setDescription('')
      onClose()
      onCreated(data)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Create project failed')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (!saving) onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
        role="presentation"
      />

      <div className="relative z-10 w-full max-w-sm card p-5 bg-zinc-800/90 backdrop-blur-xl border border-zinc-700 shadow-2xl shadow-black/60 rounded-xl">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="text-zinc-100 font-semibold text-base leading-none tracking-[-0.03em]">
                New Project
              </div>
              <div className="text-muted text-xs">สร้างโปรเจคใหม่เพื่อเริ่มจัดการงาน</div>
            </div>
            <button
              type="button"
              className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
              onClick={handleClose}
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm text-zinc-200">Project name</label>
            <input
              className="input"
              placeholder="เช่น 'Website Redesign Q4'"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-zinc-200">Description</label>
            <textarea
              className="input min-h-[70px] resize-none"
              placeholder="รายละเอียดโปรเจคสั้น ๆ"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={saving}
              className="btn text-zinc-300"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

