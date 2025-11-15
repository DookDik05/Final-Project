'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from '@/lib/api'

export type AuthUser = {
  id: string
  name: string
  email: string
}

type AuthContextType = {
  user: AuthUser | null
  loading: boolean
  setUser: (u: AuthUser | null) => void
  refreshUser: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // ดึงข้อมูลผู้ใช้ครั้งแรกจาก token (ถ้ามี)
  useEffect(() => {
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('accessToken')
      : null

    if (!token) {
      setLoading(false)
      return
    }

    api.get('/me')
      .then(res => {
        setUser(res.data)
      })
      .catch(() => {
        // token เสีย / หมดอายุ
        localStorage.removeItem('accessToken')
        setUser(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  // call นี้เอาไว้ให้ component อื่นขอ sync user ใหม่เมื่อมีการเปลี่ยนแปลง
  const refreshUser = async () => {
    try {
      const { data } = await api.get('/me')
      setUser(data)
    } catch {
      localStorage.removeItem('accessToken')
      setUser(null)
    }
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, setUser, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return ctx
}
