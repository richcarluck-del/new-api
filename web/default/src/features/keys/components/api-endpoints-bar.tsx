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
import { Check, Copy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getBgColorClass } from '@/lib/colors'
import { cn } from '@/lib/utils'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useApiInfo } from '@/features/dashboard/hooks/use-status-data'
import type { ApiInfoItem } from '@/features/dashboard/types'

function ApiEndpointPill({ item }: { item: ApiInfoItem }) {
  const { t } = useTranslation()
  const { copiedText, copyToClipboard } = useCopyToClipboard({
    notify: true,
    successMessage: t('Copied to clipboard'),
  })
  const isCopied = copiedText === item.url

  return (
    <div className='bg-card flex min-w-0 items-center gap-2 rounded-full border py-1 pr-1 pl-3'>
      <span className='text-foreground shrink-0 text-xs font-medium'>
        {t('API Endpoints')}
      </span>
      {item.route && (
        <Badge
          variant='secondary'
          className='gap-1 px-1.5 font-normal'
        >
          <span
            className={cn(
              'inline-block size-1.5 shrink-0 rounded-full',
              getBgColorClass(item.color)
            )}
          />
          {item.route}
        </Badge>
      )}
      <Separator orientation='vertical' className='h-4' />
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type='button'
              onClick={() => copyToClipboard(item.url)}
              className='text-muted-foreground hover:text-foreground min-w-0 cursor-pointer truncate font-mono text-xs underline-offset-4 transition-colors hover:underline hover:decoration-dashed'
            />
          }
        >
          {item.url}
        </TooltipTrigger>
        <TooltipContent>{t('Click to copy this endpoint')}</TooltipContent>
      </Tooltip>
      <Button
        variant='ghost'
        size='sm'
        onClick={() => copyToClipboard(item.url)}
        className='size-6 shrink-0 rounded-full p-0'
        aria-label={t('Copy URL')}
      >
        {isCopied ? (
          <Check className='text-success size-3.5' />
        ) : (
          <Copy className='size-3.5' />
        )}
      </Button>
    </div>
  )
}

export function ApiEndpointsBar() {
  const { items } = useApiInfo()

  if (!items.length) return null

  return (
    <div className='flex flex-wrap items-center gap-2'>
      {items.map((item) => (
        <ApiEndpointPill key={`${item.route}-${item.url}`} item={item} />
      ))}
    </div>
  )
}
