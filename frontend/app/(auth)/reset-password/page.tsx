'use client'

import React, { useState, useMemo, useEffect, Suspense } from 'react'
import { api } from '@/lib/api'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Lock,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader,
} from 'lucide-react'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [touched, setTouched] = useState(false)

  // Validate if token is provided
  useEffect(() => {
    if (!token) {
      setError('ไม่พบโทเค็นรีเซ็ต กรุณาใช้ลิงก์จากอีเมลของคุณ')
    }
  }, [token])

  const passwordError = useMemo(() => {
    if (!touched) return null
    if (!password) return 'กรุณาใส่รหัสผ่านใหม่'
    if (password.length < 6) return 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
    return null
  }, [password, touched])

  const confirmPasswordError = useMemo(() => {
    if (!touched) return null
    if (!confirmPassword) return 'กรุณายืนยันรหัสผ่าน'
    if (password !== confirmPassword) return 'รหัสผ่านไม่ตรงกัน'
    return null
  }, [password, confirmPassword, touched])

  const isValid = password && confirmPassword && !passwordError && !confirmPasswordError

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) {
      setTouched(true)
      return
    }

    if (!token) {
      setError('ไม่พบโทเค็นรีเซ็ต')
      return
    }

    setLoading(true)
    setError('')
    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword: password,
      })
      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch (err: any) {
      console.error('RESET PASSWORD ERROR:', err?.response || err)
      setError(
        err?.response?.data?.error ||
          'ไม่สามารถรีเซ็ตรหัสผ่านได้ โทเค็นอาจหมดอายุแล้ว'
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
          <h2 className="text-2xl font-bold text-white mb-2">รีเซ็ตรหัสผ่านสำเร็จ!</h2>
          <p className="text-zinc-400 mb-6">
            คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้แล้ว
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
            <Lock size={24} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">รีเซ็ตรหัสผ่าน</h1>
          <p className="text-zinc-400">
            ใส่รหัสผ่านใหม่ของคุณด้านล่าง
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-950/50 border border-red-900/50 flex gap-3">
            <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-red-400 text-sm">{error}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4 mb-6">
          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              รหัสผ่านใหม่
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                className={`w-full px-4 py-3 rounded-lg border transition-all ${
                  touched && passwordError
                    ? 'border-red-500/50 bg-red-500/5 text-red-400'
                    : 'border-zinc-600 bg-zinc-700/50 text-white'
                } focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {touched && passwordError && (
              <p className="mt-1 text-xs text-red-400">{passwordError}</p>
            )}
          </div>

          {/* Confirm Password Input */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              ยืนยันรหัสผ่าน
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                className={`w-full px-4 py-3 rounded-lg border transition-all ${
                  touched && confirmPasswordError
                    ? 'border-red-500/50 bg-red-500/5 text-red-400'
                    : 'border-zinc-600 bg-zinc-700/50 text-white'
                } focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {touched && confirmPasswordError && (
              <p className="mt-1 text-xs text-red-400">{confirmPasswordError}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !token}
            className="w-full mt-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader size={18} className="animate-spin" />
                กำลังรีเซ็ต...
              </>
            ) : (
              'รีเซ็ตรหัสผ่าน'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-zinc-700" />
          <span className="text-xs text-zinc-500">หรือ</span>
          <div className="flex-1 h-px bg-zinc-700" />
        </div>

        {/* Back to Login Link */}
        <button
          onClick={() => router.push('/login')}
          className="w-full text-center text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          กลับไปยังหน้าลงชื่อเข้าใช้
        </button>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 flex items-center justify-center"><div className="text-zinc-400">Loading...</div></div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
