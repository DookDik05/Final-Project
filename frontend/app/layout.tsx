import './globals.css'
import React from 'react'

export const metadata = { title: 'Mini Task Manager' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <div className="container py-6">
          <header className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Mini Task Manager</h1>
            <a className="btn" href="/(auth)/login">Login</a>
          </header>
          {children}
        </div>
      </body>
    </html>
  )
}
