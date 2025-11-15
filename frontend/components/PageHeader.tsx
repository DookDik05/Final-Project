'use client'

import React, { ReactNode } from 'react'
import { useRouter } from 'next/navigation'

export default function PageHeader({
  title,
  subtitle,
  actions,
  showBack = false,
  backFallbackHref,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  showBack?: boolean
  backFallbackHref?: string
}) {
  const router = useRouter()

  const handleBack = () => {
    // router.back() บางครั้งบน deep link (เช่นเปิดหน้า board โดยตรง) 
    // จะไม่มีหน้าเดิมใน history → ในกรณีนั้นเราจะพาไป fallbackHref
    if (window.history.length > 1) {
      router.back()
    } else if (backFallbackHref) {
      router.push(backFallbackHref)
    } else {
      router.push('/projects')
    }
  }

  return (
    <div
      className="
        flex flex-col gap-4
        sm:flex-row sm:items-start sm:justify-between
      "
    >
      {/* Left side: back + titles */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-3">
          {showBack && (
            <button
              onClick={handleBack}
              className="
                h-8 w-8 flex items-center justify-center
                rounded-lg border border-zinc-600
                bg-zinc-900/50 text-zinc-200
                hover:bg-zinc-800 hover:border-zinc-500
                shadow-[0_20px_60px_rgba(0,0,0,0.8)]
                text-sm font-medium
                transition
              "
              title="Go back"
            >
              {/* ลูกศรย้อนกลับ ← */}
              <span className="text-lg leading-none -mt-[2px]">{'\u2190'}</span>
            </button>
          )}

          <div className="space-y-1">
            <h2 className="text-zinc-100 text-xl font-semibold tracking-[-0.03em]">
              {title}
            </h2>
            {subtitle && (
              <p className="text-zinc-400 text-sm leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right side: actions */}
      {actions && (
        <div className="flex items-start gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}
