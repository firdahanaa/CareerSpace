'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'
import { Sidebar } from '@/components/dashboard/sidebar'

interface MobileNavProps {
  userEmail?: string
}

export function MobileNav({ userEmail }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground md:hidden cursor-pointer"
        aria-label="Buka navigasi menu"
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72">
        <SheetTitle className="sr-only">Menu Navigasi Dashboard</SheetTitle>
        <Sidebar userEmail={userEmail} onItemClick={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
