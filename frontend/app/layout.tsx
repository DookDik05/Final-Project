import './globals.css'
import React from 'react'
import { AuthProvider } from '@/context/AuthContext'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

export const metadata = {
  title: 'Mini Task Manager',
  description: 'Modern & Minimal Task Management System',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className="bg-zinc-900 text-zinc-100">
      <body className="bg-zinc-900 text-zinc-100">
        <AuthProvider>
          <div className="max-w-screen-2xl mx-auto px-4 py-4 flex gap-4">
            {/* Left: Sidebar */}
            <Sidebar />

            {/* Right: page content */}
            <main className="flex-1 min-w-0 flex flex-col gap-4">
              {/* mini header / breadcrumb area */}
              <Header />

              <div className="space-y-6">
                {children}
              </div>
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
