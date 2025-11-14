'use client'

import React from 'react'

export default function Logo() {
  return (
    <div
      className="
        h-7 w-7 rounded-xl
        bg-gradient-to-br from-indigo-500/30 to-indigo-700/10
        border border-indigo-400/40
        shadow-[0_12px_40px_rgba(99,102,241,0.6)]
        flex items-center justify-center
        text-[10px] font-semibold text-indigo-200 tracking-tight
      "
    >
      TM
    </div>
  )
}
