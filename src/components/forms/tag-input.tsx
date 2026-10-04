'use client'

import React, { useState, type KeyboardEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'

export interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
  disabled?: boolean
  error?: string
}

/**
 * Komponen reusable untuk memasukkan tag (seperti technologies / tools).
 * Mendukung penambahan via tombol Enter, koma, atau tombol Tambah (+).
 */
export function TagInput({
  value = [],
  onChange,
  placeholder = 'Ketik nama teknologi lalu tekan Enter atau koma...',
  maxTags = 30,
  disabled = false,
  error,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')

  const addTag = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    if (value.length >= maxTags) return

    // Cegah duplikasi case-insensitive
    const lower = trimmed.toLowerCase()
    if (value.some((t) => t.toLowerCase() === lower)) {
      setInputValue('')
      return
    }

    onChange([...value, trimmed])
    setInputValue('')
  }

  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_, idx) => idx !== indexToRemove))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      removeTag(value.length - 1)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || value.length >= maxTags}
          className="flex-1"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => addTag(inputValue)}
          disabled={disabled || !inputValue.trim() || value.length >= maxTags}
          className="gap-1 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah</span>
        </Button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-muted/40 border border-border/50 min-h-[42px] items-center">
          {value.map((tag, idx) => (
            <Badge
              key={`${tag}-${idx}`}
              variant="secondary"
              className="gap-1.5 pl-2.5 pr-1.5 py-1 text-xs font-medium bg-background border border-border shadow-xs"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(idx)}
                disabled={disabled}
                className="rounded-full p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                aria-label={`Hapus tag ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
