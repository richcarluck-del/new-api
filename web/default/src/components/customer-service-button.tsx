/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { useState } from 'react'
import { Headphones } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useStatus } from '@/hooks/use-status'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CustomerServiceItem {
  label?: string
  image?: string
}

interface CustomerServiceConfig {
  title?: string
  description?: string
  items?: CustomerServiceItem[]
}

interface CustomerServiceButtonProps {
  className?: string
}

export function CustomerServiceButton({
  className,
}: CustomerServiceButtonProps) {
  const { t } = useTranslation()
  const { status } = useStatus()
  const isAuthenticated = !!useAuthStore((s) => s.auth.user)
  const [open, setOpen] = useState(false)

  const enabled = Boolean(status?.['customer_service_enabled'])
  const config = (status?.['customer_service'] ?? {}) as CustomerServiceConfig
  const items = (config.items ?? []).filter((item) => item.image)

  // Only visible to signed-in users; hidden when disabled or nothing to show.
  if (!isAuthenticated || !enabled || items.length === 0) {
    return null
  }

  const cardTitle = config.title || t('联系客服')
  const description = config.description || ''

  return (
    <>
      <Button
        variant='ghost'
        size='icon'
        onClick={() => setOpen(true)}
        className={cn('h-9 w-9', className)}
        aria-label={t('联系客服')}
      >
        <Headphones className='size-[1.2rem]' />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader className='border-b pb-4'>
            <DialogTitle>{t('联系客服')}</DialogTitle>
            <DialogDescription className='sr-only'>
              {t('联系客服')}
            </DialogDescription>
          </DialogHeader>

          {/* Info card: icon + title + description */}
          <div className='bg-muted/40 flex items-start gap-3 rounded-xl border p-4'>
            <div className='bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-full'>
              <Headphones className='size-5' />
            </div>
            <div className='flex min-w-0 flex-col gap-1'>
              <span className='text-foreground text-sm font-semibold'>
                {cardTitle}
              </span>
              {description && (
                <span className='text-muted-foreground text-sm leading-relaxed whitespace-pre-line'>
                  {description}
                </span>
              )}
            </div>
          </div>

          <div
            className={cn(
              'grid gap-4 py-2',
              items.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
            )}
          >
            {items.map((item, index) => (
              <div
                key={index}
                className='flex flex-col items-center gap-2.5'
              >
                <div className='bg-muted/30 rounded-xl border p-2'>
                  <img
                    src={item.image}
                    alt={item.label || t('联系客服')}
                    className='aspect-square w-full max-w-[160px] rounded-lg object-contain'
                  />
                </div>
                {item.label && (
                  <span className='text-muted-foreground text-sm font-medium'>
                    {item.label}
                  </span>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
