// frontend/app/profile/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import {
  User,
  Mail,
  Save,
  Key,
  Trash2,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react'

export default function ProfilePage() {
  const { user, loading, refreshUser, logout } = useAuth()
  const router = useRouter()

  const [name, setName] = useState(user?.name ?? '')
  const [email] = useState(user?.email ?? '') // ตอนนี้ backend /me ไม่ให้แก้ email
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  // Change password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-zinc-100 flex items-center justify-center">
        <div className="animate-pulse text-sm text-zinc-400">กำลังโหลด...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-900 text-zinc-100 flex flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold">โปรดเข้าสู่ระบบเพื่อดูข้อมูลโปรไฟล์</p>
        <button
          onClick={() => router.push('/login')}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 transition"
        >
          ไปหน้า Login
        </button>
      </div>
    )
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setProfileError('โปรดกรอกชื่อ')
      return
    }

    try {
      setSavingProfile(true)
      setProfileError(null)
      setProfileMessage(null)

      await api.patch(`/users/${user.id}`, { name })

      await refreshUser()
      setProfileMessage('บันทึกข้อมูลโปรไฟล์สำเร็จ')
    } catch (err: any) {
      console.error(err)
      setProfileError(
        err?.response?.data?.error || 'ไม่สามารถบันทึกข้อมูลโปรไฟล์ได้'
      )
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage(null)
    setPasswordError(null)

    if (!currentPassword || !newPassword) {
      setPasswordError('กรุณากรอกรหัสผ่านให้ครบ')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน')
      return
    }

    try {
      setSavingPassword(true)

      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      })

      setPasswordMessage('เปลี่ยนรหัสผ่านสำเร็จ')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      console.error(err)
      setPasswordError(
        err?.response?.data?.error ||
          'ไม่สามารถเปลี่ยนรหัสผ่านได้'
      )
    } finally {
      setSavingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    const ok = window.confirm(
      'คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีถาวร? ข้อมูลทั้งหมดจะหายไปและไม่สามารถกู้คืนได้'
    )
    if (!ok) return

    try {
      setDeleting(true)
      setDeleteError(null)

      await api.delete(`/users/${user.id}`)

      logout()
      router.push('/register')
    } catch (err: any) {
      console.error(err)
      setDeleteError(
        err?.response?.data?.error ||
          'ไม่สามารถลบบัญชีได้'
      )
    } finally {
      setDeleting(false)
    }
  }

  const initials =
    user.name
      ?.split(' ')
      .map((p) => p[0])
      .join('')
      .toUpperCase() || 'U'

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200"
        >
          <ArrowLeft size={14} />
          กลับ
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">โปรไฟล์ผู้ใช้</h1>
          <p className="text-sm text-zinc-400">
            จัดการข้อมูลบัญชีของคุณ ชื่อ อีเมล รหัสผ่าน และการลบบัญชี
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[260px,1fr]">
          {/* Left: Basic info card */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5">
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-lg font-semibold">
                {initials}
              </div>
              <p className="text-sm font-medium text-zinc-50">{user.name}</p>
              <p className="text-xs text-zinc-400">{user.email}</p>
              <div className="mt-3 inline-flex items-center rounded-full bg-zinc-800/80 px-3 py-1 text-[11px] text-zinc-300">
                <User size={12} className="mr-1" />
                Role: {(user as any).role ?? 'MEMBER'}
              </div>
            </div>
          </div>

          {/* Right: Forms */}
          <div className="space-y-6">
            {/* Profile form */}
            <form
              onSubmit={handleSaveProfile}
              className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4"
            >
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">ข้อมูลพื้นฐาน</h2>
                <p className="text-xs text-zinc-500">
                  แก้ไขชื่อที่ใช้แสดงใน Sidebar และส่วนต่าง ๆ ของระบบ
                </p>
              </div>

              {profileError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  <AlertTriangle size={14} />
                  <span>{profileError}</span>
                </div>
              )}

              {profileMessage && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                  <Save size={14} />
                  <span>{profileMessage}</span>
                </div>
              )}

              <div className="space-y-3">
                <label className="block text-xs font-medium text-zinc-300">
                  ชื่อแสดงผล
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus-within:border-indigo-500">
                  <User size={16} className="text-zinc-500" />
                  <input
                    type="text"
                    className="flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
                    placeholder="โปรดกรอกชื่อของคุณ"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <label className="mt-2 block text-xs font-medium text-zinc-300">
                  อีเมล (อ่านอย่างเดียว)
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm">
                  <Mail size={16} className="text-zinc-500" />
                  <input
                    type="email"
                    className="flex-1 bg-transparent text-sm text-zinc-400 outline-none"
                    value={email}
                    disabled
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  <Save size={14} />
                  {savingProfile ? 'กำลังบันทึก...' : 'บันทึกโปรไฟล์'}
                </button>
              </div>
            </form>

            {/* Change password form */}
            <form
              onSubmit={handleChangePassword}
              className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4"
            >
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">เปลี่ยนรหัสผ่าน</h2>
                <p className="text-xs text-zinc-500">
                  เพื่อความปลอดภัย แนะนำให้เปลี่ยนรหัสผ่านเป็นระยะ ๆ
                </p>
              </div>

              {passwordError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  <AlertTriangle size={14} />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordMessage && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                  <Key size={14} />
                  <span>{passwordMessage}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300">
                    รหัสผ่านปัจจุบัน
                  </label>
                  <input
                    type="password"
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                    placeholder="โปรดกรอกรหัสผ่านปัจจุบัน"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300">
                    รหัสผ่านใหม่
                  </label>
                  <input
                    type="password"
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                    placeholder="โปรดกรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300">
                    ยืนยันรหัสผ่านใหม่
                  </label>
                  <input
                    type="password"
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                    placeholder="โปรดยืนยันรหัสผ่านใหม่อีกครั้ง"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-100 hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  <Key size={14} />
                  {savingPassword ? 'กำลังเปลี่ยนรหัส...' : 'เปลี่ยนรหัสผ่าน'}
                </button>
              </div>
            </form>

            {/* Danger zone */}
            <div className="rounded-xl border border-red-900/60 bg-red-950/60 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-red-400" size={16} />
                <h2 className="text-sm font-semibold text-red-100">Danger Zone</h2>
              </div>
              <p className="text-xs text-red-200/80">
                การลบบัญชีจะลบข้อมูลของคุณทั้งหมดจากระบบ โปรดระวังและตรวจสอบให้แน่ใจ
              </p>

              {deleteError && (
                <p className="text-xs text-red-200 mt-1">{deleteError}</p>
              )}

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                <Trash2 size={14} />
                {deleting ? 'กำลังลบบัญชี...' : 'ลบบัญชีถาวร'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
