'use client'

import React, { useState, type KeyboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react'

export interface BulletListInputProps {
  value: string[]
  onChange: (items: string[]) => void
  placeholder?: string
  disabled?: boolean
  error?: string
}

/**
 * Komponen reusable untuk mengelola daftar poin (Key Responsibilities, Outcomes / Achievements).
 * Memungkinkan penambahan, pengeditan inline, pengurutan, dan penghapusan poin.
 */
export function BulletListInput({
  value = [],
  onChange,
  placeholder = 'Tulis poin baru...',
  disabled = false,
  error,
}: BulletListInputProps) {
  const [newText, setNewText] = useState('')

  const handleAdd = () => {
    const trimmed = newText.trim()
    if (!trimmed) return
    onChange([...value, trimmed])
    setNewText('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  const handleUpdateItem = (index: number, updatedText: string) => {
    const updated = [...value]
    updated[index] = updatedText
    onChange(updated)
  }

  const handleRemove = (index: number) => {
    onChange(value.filter((_, idx) => idx !== index))
  }

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= value.length) return

    const updated = [...value]
    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      {/* Input Tambah Poin Baru */}
      <div className="flex gap-2">
        <Input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={handleAdd}
          disabled={disabled || !newText.trim()}
          className="gap-1.5 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Poin</span>
        </Button>
      </div>

      {/* Daftar Poin yang Ada */}
      {value.length > 0 && (
        <div className="space-y-2 border border-border/60 rounded-lg p-2 bg-muted/20">
          {value.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-background p-2 rounded-md border border-border/50 text-sm group"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
                {idx + 1}
              </span>
              <Input
                type="text"
                value={item}
                onChange={(e) => handleUpdateItem(idx, e.target.value)}
                disabled={disabled}
                className="h-8 border-transparent hover:border-input focus:border-input transition-colors flex-1 text-sm bg-transparent"
              />
              <div className="flex items-center gap-0.5 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  onClick={() => handleMove(idx, 'up')}
                  disabled={disabled || idx === 0}
                  title="Geser ke atas"
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  onClick={() => handleMove(idx, 'down')}
                  disabled={disabled || idx === value.length - 1}
                  title="Geser ke bawah"
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemove(idx)}
                  disabled={disabled}
                  title="Hapus poin ini"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
