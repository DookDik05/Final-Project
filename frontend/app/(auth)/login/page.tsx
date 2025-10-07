'use client'
import React, { useState } from 'react'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('admin123')
  const nav = useRouter()
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('accessToken', data.accessToken)
    nav.push('/projects')
  }
  return (
    <div className="grid place-items-center min-h-[60vh]">
      <form onSubmit={onSubmit} className="card p-6 w-full max-w-sm space-y-3">
        <h2 className="text-lg font-semibold">Sign in</h2>
        <div>
          <label className="block text-sm">Email</label>
          <input className="input" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Password</label>
          <input type="password" className="input" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        <button className="btn w-full">Login</button>
      </form>
    </div>
  )
}
