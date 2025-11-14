'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export type AuthUser = {
  id: string
  name: string
  email: string
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('accessToken')
      : null

    if (!token) {
      setLoading(false)
      setUser(null)
      return
    }

    api.get('/me')
      .then(res => {
        setUser(res.data)
      })
      .catch(() => {
        // token เสีย / หมดอายุ -> เคลียร์
        localStorage.removeItem('accessToken')
        setUser(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return { user, loading }
}
