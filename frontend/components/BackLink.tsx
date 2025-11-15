'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

type BackLinkProps = {
  href?: string
  label?: string
}

/**
 * ปุ่มย้อนกลับพร้อมไอคอนลูกศร
 * - ถ้าใส่ href -> จะ link ไปหน้าที่กำหนด
 * - ถ้าไม่ใส่ href -> ใช้ router.back()
 */
export default function BackLink({ href, label = 'ย้อนกลับ' }: BackLinkProps) {
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    if (!href) {
      e.preventDefault()
      router.back()
    }
  }

  const content = (
    <div
      className="
        inline-flex items-center gap-2 text-sm
        text-zinc-300 hover:text-white
        px-3 py-1.5 rounded-full
        bg-zinc-800/80 hover:bg-zinc-700
        border border-zinc-700
        shadow-sm shadow-black/40
        transition
      "
      title="ไปหน้าก่อนหน้า"
    >
      <ArrowLeft size={16} />
      <span>{label}</span>
    </div>
  )

  if (href) {
    return (
      <Link href={href} onClick={handleClick}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" onClick={handleClick}>
      {content}
    </button>
  )
}
