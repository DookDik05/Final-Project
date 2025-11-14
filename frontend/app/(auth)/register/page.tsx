'use client'
import React, { useState } from 'react'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const nav = useRouter()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(''); setMsg('')
    try {
      await api.post('/auth/register', { name, email, password })
      setMsg('สมัครสำเร็จ! กำลังพาไปหน้าเข้าสู่ระบบ…')
      setTimeout(()=>nav.push('/login'), 800) // <-- เปลี่ยนตรงนี้
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Register failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid place-items-center min-h-[60vh]">
      <form
        onSubmit={onSubmit}
        className="card w-full max-w-sm p-6 space-y-4"
      >
        <div className="space-y-1">
          <h2 className="text-zinc-100 text-lg font-semibold">Create account</h2>
          <p className="text-muted">ตั้งบัญชีของคุณเพื่อเริ่มจัดการงาน</p>
        </div>

        {msg && (
          <div className="text-sm text-green-400 bg-green-950/30 border border-green-800/50 rounded-lg px-3 py-2">
            {msg}
          </div>
        )}

        {error && (
          <div className="text-sm text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm text-zinc-200">Name</label>
          <input
            className="input"
            value={name}
            onChange={e=>setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm text-zinc-200">Email</label>
          <input
            className="input"
            value={email}
            onChange={e=>setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm text-zinc-200">Password</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={e=>setPassword(e.target.value)}
          />
        </div>

        <button className="btn-primary w-full" disabled={loading}>
          {loading ? 'Registering…' : 'Create account'}
        </button>

        <p className="text-muted text-center">
          มีบัญชีแล้ว?{' '}
          <a className="link" href="/login">{/* <-- เปลี่ยนตรงนี้ */}
            เข้าสู่ระบบ
          </a>
        </p>
      </form>
    </div>
  )
}
