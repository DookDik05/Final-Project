'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { BackLink, PageHeader } from '@/components'
import {
  Pencil,
  Users,
  AlertTriangle,
  Check,
  X,
  Loader,
  Copy,
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react'

interface Project {
  _id: string
  name: string
  slug: string
  description: string
  color: string
  visibility: 'public' | 'private'
  owner: string
  members: Array<{ userId: string; role: 'admin' | 'member' }>
  createdAt: string
}

type TabType = 'edit' | 'members' | 'danger'

export default function ProjectSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [activeTab, setActiveTab] = useState<TabType>('edit')
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    visibility: 'private' as 'public' | 'private',
  })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')
  const [editSuccess, setEditSuccess] = useState('')

  // Members state
  const [members, setMembers] = useState<any[]>([])
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [addMemberLoading, setAddMemberLoading] = useState(false)
  const [removingMemberId, setRemovingMemberId] = useState('')

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Fetch project details
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await api.get(`/projects/${projectId}`)
        setProject(response.data.data)
        setMembers(response.data.data.members || [])

        // Populate edit form with current values
        setEditForm({
          name: response.data.data.name,
          description: response.data.data.description || '',
          color: response.data.data.color || '#6366f1',
          visibility: response.data.data.visibility || 'private',
        })
      } catch (err: any) {
        setError(
          err?.response?.data?.error || 'ไม่สามารถโหลดข้อมูลโปรเจคได้'
        )
      } finally {
        setLoading(false)
      }
    }

    if (projectId) fetchProject()
  }, [projectId])

  // Handle edit form submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditLoading(true)
    setEditError('')
    setEditSuccess('')

    try {
      await api.patch(`/projects/${projectId}`, {
        name: editForm.name,
        description: editForm.description,
        color: editForm.color,
        visibility: editForm.visibility,
      })

      setEditSuccess('บันทึกการตั้งค่าสำเร็จ!')
      setProject((prev) =>
        prev
          ? {
              ...prev,
              ...editForm,
            }
          : null
      )

      setTimeout(() => setEditSuccess(''), 3000)
    } catch (err: any) {
      setEditError(
        err?.response?.data?.error || 'ไม่สามารถบันทึกการตั้งค่าได้'
      )
    } finally {
      setEditLoading(false)
    }
  }

  // Handle delete project
  const handleDeleteProject = async () => {
    if (deleteConfirm !== project?.name) {
      setError('กรุณาพิมพ์ชื่อโปรเจคให้ถูกต้อง')
      return
    }

    setDeleteLoading(true)
    setError('')

    try {
      await api.delete(`/projects/${projectId}`)
      setSuccess('ลบโปรเจคสำเร็จ กำลังพาคุณกลับ...')
      setTimeout(() => router.push('/projects'), 2000)
    } catch (err: any) {
      setError(
        err?.response?.data?.error || 'ไม่สามารถลบโปรเจคได้'
      )
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-gray-400">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-500">{error || 'ไม่พบโปรเจค'}</p>
          <BackLink href="/projects" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-900 to-black">
      <BackLink href={`/projects/${projectId}`} />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title={`ตั้งค่า: ${project.name}`}
          subtitle="จัดการการตั้งค่าโปรเจคและสมาชิก"
        />

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {error}
            </div>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-400">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              {success}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8 flex gap-2 border-b border-zinc-700">
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 transition-colors ${
              activeTab === 'edit'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <Pencil className="h-4 w-4" />
            แก้ไข
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 transition-colors ${
              activeTab === 'members'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <Users className="h-4 w-4" />
            สมาชิก
          </button>

          <button
            onClick={() => setActiveTab('danger')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 transition-colors ${
              activeTab === 'danger'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            ความเสี่ยง
          </button>
        </div>

        {/* Edit Tab */}
        {activeTab === 'edit' && (
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-6">
            <h2 className="mb-6 text-xl font-semibold text-white">
              แก้ไขข้อมูลโปรเจค
            </h2>

            <form onSubmit={handleEditSubmit} className="space-y-6">
              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ชื่อโปรเจค
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-700/50 px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  required
                  minLength={2}
                  placeholder="ชื่อโปรเจค"
                  title="ชื่อโปรเจค"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  คำอธิบาย
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-700/50 px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  rows={4}
                  placeholder="ใส่คำอธิบายเกี่ยวกับโปรเจคของคุณ..."
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  สี
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={editForm.color}
                    onChange={(e) =>
                      setEditForm({ ...editForm, color: e.target.value })
                    }
                    className="h-12 w-32 cursor-pointer rounded-lg border border-zinc-600"
                    title="เลือกสี"
                    placeholder="เลือกสี"
                  />
                  <span className="text-sm text-gray-400">{editForm.color}</span>
                </div>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ความเป็นส่วนตัว
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="private"
                      checked={editForm.visibility === 'private'}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          visibility: e.target.value as 'private' | 'public',
                        })
                      }
                      className="h-4 w-4"
                      title="ส่วนตัว"
                    />
                    <EyeOff className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">ส่วนตัว</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="public"
                      checked={editForm.visibility === 'public'}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          visibility: e.target.value as 'private' | 'public',
                        })
                      }
                      className="h-4 w-4"
                      title="สาธารณะ"
                    />
                    <Eye className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">สาธารณะ</span>
                  </label>
                </div>
              </div>

              {/* Edit Success/Error */}
              {editError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                  {editError}
                </div>
              )}

              {editSuccess && (
                <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400 flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  {editSuccess}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={editLoading}
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {editLoading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    บันทึก...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    บันทึกการตั้งค่า
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-6">
            <h2 className="mb-6 text-xl font-semibold text-white">
              จัดการสมาชิก
            </h2>

            {/* Members List */}
            <div className="mb-8 space-y-4">
              {members.length > 0 ? (
                members.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-700/30 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                        {member.email?.[0]?.toUpperCase() || 'M'}
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {member.email || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-400">
                          {member.role === 'admin' ? '✨ ผู้ดูแล' : '👤 สมาชิก'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setRemovingMemberId(member.userId)}
                      disabled={
                        removingMemberId === member.userId ||
                        member.role === 'admin'
                      }
                      className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                      title="ผู้ดูแลไม่สามารถลบได้"
                    >
                      {removingMemberId === member.userId ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">ยังไม่มีสมาชิก</p>
              )}
            </div>

            {/* Add Member Form - PLACEHOLDER */}
            <div className="rounded-lg border border-zinc-700 bg-zinc-700/30 p-4">
              <p className="text-sm text-gray-400">
                ✋ ฟีเจอร์เพิ่มสมาชิกจะเพิ่มในเวอร์ชันถัดไป
              </p>
            </div>
          </div>
        )}

        {/* Danger Zone Tab */}
        {activeTab === 'danger' && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6">
            <h2 className="mb-6 text-xl font-semibold text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </h2>

            <div className="space-y-6">
              {/* Delete Project */}
              <div className="rounded-lg border border-red-500/50 bg-red-900/20 p-6">
                <h3 className="mb-2 text-lg font-semibold text-red-400">
                  ลบโปรเจค
                </h3>
                <p className="mb-4 text-sm text-gray-300">
                  การกระทำนี้จะลบโปรเจคและข้อมูลทั้งหมดอย่างถาวร ไม่สามารถยกเลิกได้
                </p>

                <div className="mb-4 space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    ยืนยันการลบ: พิมพ์ชื่อโปรเจค "{project.name}" ด้านล่าง
                  </label>
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder={`พิมพ์ "${project.name}" เพื่อยืนยัน`}
                    className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleDeleteProject}
                  disabled={
                    deleteLoading ||
                    deleteConfirm !== project.name
                  }
                  className="flex items-center justify-center gap-2 w-full rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deleteLoading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      กำลังลบ...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      ลบโปรเจคนี้อย่างถาวร
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
