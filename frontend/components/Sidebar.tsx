'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Logo from '@/components/Logo'
import React from 'react'

type NavItemProps = {
  href: string
  label: string
  active?: boolean
  icon?: React.ReactNode
}

function NavItem({ href, label, active, icon }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2
        border border-transparent
        transition
        ${active
          ? 'bg-zinc-800 text-zinc-100 border-zinc-600 shadow-[0_20px_60px_rgba(0,0,0,0.8)]'
          : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 hover:border-zinc-700'
        }
      `}
    >
      {icon && <span className="text-[14px] text-indigo-400">{icon}</span>}
      <span>{label}</span>
    </Link>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <aside
      className="
        bg-zinc-900/60
        border border-zinc-800
        rounded-2xl
        shadow-[0px_30px_120px_rgba(0,0,0,0.8)]
        ring-1 ring-black/60
        backdrop-blur-xl
        p-4
        flex flex-col
        w-[220px]
        shrink-0
        h-[calc(100vh-2rem)]
        sticky top-4
      "
    >
      {/* Top Brand */}
      <div className="flex items-center gap-2 mb-6">
        <Logo />
        <div className="flex flex-col">
          <div className="text-zinc-100 text-sm font-semibold leading-none">Mini Task Manager</div>
          <div className="text-[11px] text-zinc-500 leading-none">จัดการงาน & โปรเจค</div>
        </div>
      </div>

      {/* Nav Section */}
      <nav className="flex flex-col gap-1 text-[13px]">
        <NavItem
          href="/"
          label="Dashboard"
          active={pathname === '/'}
          icon={<span>🏠</span>}
        />
        <NavItem
          href="/projects"
          label="Projects"
          active={pathname.startsWith('/projects')}
          icon={<span>📁</span>}
        />
        {/* อยากมีรายงานรวมทุกโปรเจคเพิ่มได้ในอนาคต */}
        {/* <NavItem href="/reports" label="Reports" ... /> */}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User box / auth section */}
      <div className="mt-6 border-t border-zinc-800 pt-4 text-[13px]">
        {loading ? (
          <div className="text-zinc-500 text-xs italic">กำลังโหลดผู้ใช้...</div>
        ) : user ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div
                className="
                  h-9 w-9 rounded-lg bg-zinc-800 border border-zinc-700
                  flex items-center justify-center text-[11px] font-semibold text-zinc-200
                "
              >
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col leading-tight">
                <div className="text-zinc-100 font-medium">{user.name}</div>
                <div className="text-[11px] text-zinc-500">{user.email}</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="
                w-full text-left text-[12px] font-medium
                px-3 py-2 rounded-lg
                bg-zinc-800 border border-zinc-700
                text-zinc-300
                hover:bg-zinc-700 hover:border-zinc-600 hover:text-white
                transition
              "
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link
              href="/login"
              className="
                block text-center text-[12px] font-medium
                w-full px-3 py-2 rounded-lg
                border border-zinc-600
                bg-zinc-900/40 text-zinc-200
                hover:bg-zinc-800 hover:border-zinc-500
                transition
              "
            >
              Login
            </Link>
            <Link
              href="/register"
              className="
                block text-center text-[12px] font-medium
                w-full px-3 py-2 rounded-lg
                bg-indigo-500 hover:bg-indigo-600
                text-white
                shadow-lg shadow-indigo-900/40
                transition
              "
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </aside>
  )
}
