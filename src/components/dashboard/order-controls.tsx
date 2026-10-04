'use client'

import { Button } from '@/components/ui/button'
import { ArrowUp, ArrowDown } from 'lucide-react'

export interface OrderControlsProps {
  onMoveUp: () => void | Promise<void>
  onMoveDown: () => void | Promise<void>
  isFirst: boolean
  isLast: boolean
  disabled?: boolean
  className?: string
}

/**
 * Kontrol pengurutan naik/turun berbasis tombol (DATA-06)
 * Reusable untuk Project, Experience, Education, Skill, dan Certification.
 */
export function OrderControls({
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  disabled = false,
  className = '',
}: OrderControlsProps) {
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
        onClick={onMoveUp}
        disabled={disabled || isFirst}
        title={isFirst ? 'Sudah berada di posisi teratas' : 'Pindahkan ke atas'}
        aria-label="Pindahkan ke atas"
      >
        <ArrowUp className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
        onClick={onMoveDown}
        disabled={disabled || isLast}
        title={isLast ? 'Sudah berada di posisi terbawah' : 'Pindahkan ke bawah'}
        aria-label="Pindahkan ke bawah"
      >
        <ArrowDown className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
