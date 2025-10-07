'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

type Project = { id: string; name: string; description?: string }

export default function ProjectsPage() {
  const [items, setItems] = useState<Project[]>([])
  useEffect(() => {
    api.get('/projects').then(res => setItems(res.data)).catch(()=>{})
  }, [])
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Projects</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map(p => (
          <Link key={p.id} href={`/projects/${p.id}`} className="card p-4 hover:bg-slate-50">
            <div className="font-semibold">{p.name}</div>
            <div className="text-slate-500 text-sm">{p.description ?? '—'}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
