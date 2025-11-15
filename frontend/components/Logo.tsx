'use client'

import React from 'react'

interface LogoProps {
  className?: string
  size?: number
}

export default function Logo({ className = '', size = 48 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 320 320"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="320" height="320" rx="32" fill="#111218" />
      <rect x="40" y="40" width="240" height="240" rx="24" fill="#181a20" stroke="#3b82f6" strokeWidth="4" />
      <path
        d="M96 120h128M96 160h128M96 200h128"
        stroke="#8b5cf6"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <circle cx="96" cy="120" r="8" fill="#3b82f6" />
      <circle cx="96" cy="160" r="8" fill="#3b82f6" />
      <circle cx="96" cy="200" r="8" fill="#3b82f6" />
    </svg>
  )
}
