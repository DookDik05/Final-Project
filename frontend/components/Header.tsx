'use client'

import React, { ReactNode } from 'react'

export default function SectionHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div
      className="
        flex flex-col gap-4
        sm:flex-row sm:items-start sm:justify-between
      "
    >
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

      {actions && (
        <div className="flex items-start gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}
