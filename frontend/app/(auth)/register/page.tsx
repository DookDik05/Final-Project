'use client'
import React, { useState, useMemo } from 'react'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean; password?: boolean }>({})
  const nav = useRouter()

  // Form validation
  const nameError = useMemo(() => {
    if (!touched.name) return null
    if (!name) return 'กรุณาใส่ชื่อของคุณ'
    if (name.length < 2) return 'ชื่อจะต้องมีอย่างน้อย 2 ตัวอักษร'
    return null
  }, [name, touched.name])

  const emailError = useMemo(() => {
    if (!touched.email) return null
    if (!email) return 'กรุณาใส่อีเมลของคุณ'
    if (!/^\S+@\S+\.\S+$/.test(email)) return 'รูปประแบบอีเมลไม่ถูกต้อง'
    return null
  }, [email, touched.email])

  const passwordError = useMemo(() => {
    if (!touched.password) return null
    if (!password) return 'กรุณาใส่รหัสผ่านของคุณ'
    if (password.length < 6) return 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
    return null
  }, [password, touched.password])

  const isValid = name && email && password && !nameError && !emailError && !passwordError

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) {
      setTouched({ name: true, email: true, password: true })
      return
    }

    setLoading(true)
    setError('')
    try {
      await api.post('/auth/register', { name, email, password })
      setSuccess(true)
      setTimeout(() => nav.push('/login'), 2000)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'สร้างบัญชีไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center mx-auto mb-4 animate-scale-in">
            <CheckCircle2 size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">สร้างบัญชีสำเร็จ!</h2>
          <p className="text-zinc-400 mb-6">กำลังพาไปหน้าเข้าสู่ระบบ…</p>
          <div className="w-12 h-1 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-full mx-auto animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 flex items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center mx-auto mb-4">
            <User size={24} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">สร้างบัญชีใหม่</h1>
          <p className="text-zinc-400">เข้าร่วมกับเราเพื่อเริ่มจัดการโครงการของคุณ</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-950/50 border border-red-900/50 flex gap-3">
            <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-5">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-zinc-100 mb-2">
              ชื่อผู้ใช้งาน
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                placeholder="กรุณาใส่ชื่อของคุณ"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched({ ...touched, name: true })}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors bg-zinc-800/50 outline-none ${
                  nameError
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
                    : 'border-zinc-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20'
                } text-zinc-100 placeholder:text-zinc-500`}
              />
            </div>
            {nameError && (
              <p className="mt-1.5 text-xs font-medium text-red-400">{nameError}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-zinc-100 mb-2">
              อีเมล
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <input
                type="email"
                placeholder="กรุณาใส่อีเมลของคุณ"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched({ ...touched, email: true })}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors bg-zinc-800/50 outline-none ${
                  emailError
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
                    : 'border-zinc-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20'
                } text-zinc-100 placeholder:text-zinc-500`}
              />
            </div>
            {emailError && (
              <p className="mt-1.5 text-xs font-medium text-red-400">{emailError}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-zinc-100 mb-2">
              รหัสผ่าน
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="กรุณาใส่รหัสผ่านของคุณ"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched({ ...touched, password: true })}
                className={`w-full pl-10 pr-10 py-2.5 rounded-lg border transition-colors bg-zinc-800/50 outline-none ${
                  passwordError
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
                    : 'border-zinc-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20'
                } text-zinc-100 placeholder:text-zinc-500`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordError && (
              <p className="mt-1.5 text-xs font-medium text-red-400">{passwordError}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !isValid}
            className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium transition-all hover:shadow-lg hover:shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                กำลังสร้างบัญชี...
              </>
            ) : (
              <>
                สร้างบัญชีผู้ใช้ใหม่
                <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-700" />
          <span className="text-xs text-zinc-500 font-medium">มีบัญชีอยู่แล้ว?</span>
          <div className="flex-1 h-px bg-zinc-700" />
        </div>

        {/* Sign in Link */}
        <a
          href="/login"
          className="w-full py-2.5 px-4 rounded-lg border border-zinc-700 text-zinc-100 font-medium text-center transition-all hover:bg-zinc-800/50 hover:border-zinc-600 flex items-center justify-center gap-2 group"
        >
          ลงชื่อเข้าใช้
          <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>
    </div>
  )
}
