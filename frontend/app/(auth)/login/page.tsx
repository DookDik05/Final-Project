'use client'

import React, { useState } from 'react'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const nav = useRouter()
  const { setUser } = useAuth()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data } = await api.post('/auth/login', { email, password })
      // เก็บ token
      localStorage.setItem('accessToken', data.accessToken)

      // อัปเดต global auth context ทันที
      setUser({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
      })

      // ไป projects
      nav.push('/projects')
    } catch (err: any) {
      console.log('LOGIN ERROR:', err?.response || err)
      setError(err?.response?.data?.error || 'Login failed')
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
          <h2 className="text-zinc-100 text-lg font-semibold">Sign in</h2>
          <p className="text-muted">เข้าสู่ระบบเพื่อจัดการโปรเจคและงาน</p>
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

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

        <button
          className="btn-primary w-full"
          disabled={loading}
        >
          {loading ? 'Signing in…' : 'Login'}
        </button>

        <p className="text-muted text-center">
          ยังไม่มีบัญชี?{' '}
          <a className="link" href="/register">
            สมัครสมาชิก
          </a>
        </p>
      </form>
    </div>
  )
}
