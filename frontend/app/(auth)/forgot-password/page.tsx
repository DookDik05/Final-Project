'use client'

import React, { useState, useMemo } from 'react'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { Mail, ArrowLeft, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [touched, setTouched] = useState(false)
  const router = useRouter()

  const emailError = useMemo(() => {
    if (!touched) return null
    if (!email) return 'กรุณาใส่อีเมลของคุณ'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'รูปแบบอีเมลไม่ถูกต้อง'
    return null
  }, [email, touched])

  const isValid = email && !emailError

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) {
      setTouched(true)
      return
    }

    setLoading(true)
    setError('')
    try {
      // TODO: จะเพิ่ม endpoint /auth/forgot-password ใน backend
      // ตอนนี้เป็น placeholder สำหรับส่ง email reset password
      await api.post('/auth/forgot-password', { email })
      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch (err: any) {
      console.error('FORGOT PASSWORD ERROR:', err?.response || err)
      setError(
        err?.response?.data?.error || 'ไม่สามารถส่งลิงก์รีเซ็ตรหัสผ่านได้ กรุณาลองใหม่อีกครั้ง'
      )
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
          <h2 className="text-2xl font-bold text-white mb-2">ส่งอีเมลสำเร็จ!</h2>
          <p className="text-zinc-400 mb-2">เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยัง</p>
          <p className="text-indigo-400 font-medium mb-6">{email}</p>
          <p className="text-zinc-500 text-sm mb-4">
            กรุณาตรวจสอบอีเมลของคุณและติดตามขั้นตอนเพื่อรีเซ็ตรหัสผ่าน
          </p>
          <p className="text-zinc-400 text-xs">กำลังพาไปยังหน้าลงชื่อเข้าใช้...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 flex items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft size={18} />
          กลับไป
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center mx-auto mb-4">
            <Mail size={24} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">ลืมรหัสผ่าน?</h1>
          <p className="text-zinc-400">
            ไม่เป็นไร! ใส่อีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน
          </p>
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
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-zinc-100 mb-2">
              ที่อยู่อีเมล
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !isValid}
            className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium transition-all hover:shadow-lg hover:shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                กำลังส่ง...
              </>
            ) : (
              <>
                ส่งลิงก์รีเซ็ต
                <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Info Box */}
        <div className="mt-6 p-4 rounded-lg bg-zinc-800/30 border border-zinc-700 text-sm text-zinc-400">
          <p className="font-medium text-zinc-300 mb-2">💡 Tips:</p>
          <ul className="space-y-1 text-xs">
            <li>• ตรวจสอบกล่องจดหมายและโฟลเดอร์ Spam</li>
            <li>• ลิงก์รีเซ็ตจะหมดอายุใน 24 ชั่วโมง</li>
            <li>• หากไม่ได้รับอีเมล ให้ลองส่งใหม่อีกครั้ง</li>
          </ul>
        </div>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-700" />
          <span className="text-xs text-zinc-500 font-medium">หรือ</span>
          <div className="flex-1 h-px bg-zinc-700" />
        </div>

        {/* Go to Login */}
        <a
          href="/login"
          className="w-full py-2.5 px-4 rounded-lg border border-zinc-700 text-zinc-100 font-medium text-center transition-all hover:bg-zinc-800/50 hover:border-zinc-600"
        >
          ลงชื่อเข้าใช้
        </a>
      </div>
    </div>
  )
}
