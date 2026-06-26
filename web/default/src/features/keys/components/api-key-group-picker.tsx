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
import { useMemo, useState } from 'react'
import { Search, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { getLobeIcon } from '@/lib/lobe-icon'
import {
  getChannelTypeIcon,
  getChannelTypeLabel,
} from '@/features/channels/lib/channel-utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

const AUTO_GROUP = 'auto'
const MAX_VISIBLE_MODELS = 10

// 归一化渠道类型：未知/未绑定真实渠道统一记为 0（Unknown），以便参与厂商筛选
function normalizeType(channelType?: number) {
  return typeof channelType === 'number' && channelType > 0 ? channelType : 0
}

export type ApiKeyGroupPickerOption = {
  value: string
  desc?: string
  ratio?: number | string
  channelType?: number
  models?: string[]
}

type ApiKeyGroupPickerProps = {
  options: ApiKeyGroupPickerOption[]
  value?: string
  onValueChange: (value: string) => void
  disabled?: boolean
}

function formatGroupRatio(ratio: ApiKeyGroupPickerOption['ratio'], label: string) {
  if (ratio === undefined || ratio === null || ratio === '') return null
  return `${ratio}x ${label}`
}

function getRatioBadgeClassName(ratio: ApiKeyGroupPickerOption['ratio']) {
  if (typeof ratio !== 'number') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
  }
  if (ratio > 5) {
    return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300'
  }
  if (ratio > 3) {
    return 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300'
  }
  if (ratio > 1) {
    return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300'
  }
  return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
}

export function GroupRatioBadge({
  ratio,
  hideLabel,
}: {
  ratio: ApiKeyGroupPickerOption['ratio']
  hideLabel?: boolean
}) {
  const { t } = useTranslation()
  const label = hideLabel
    ? formatGroupRatio(ratio, '')?.trimEnd()
    : formatGroupRatio(ratio, t('Ratio'))
  if (!label) return null
  return (
    <Badge
      variant='outline'
      className={cn(
        'shrink-0 text-[10px] sm:text-xs',
        getRatioBadgeClassName(ratio)
      )}
    >
      {label}
    </Badge>
  )
}
// APPEND_MARKER

export function VendorIcon({ channelType, size }: { channelType?: number; size: number }) {
  if (channelType === undefined || channelType <= 0) {
    return (
      <Sparkles
        className='text-primary'
        style={{ width: size, height: size }}
      />
    )
  }
  return <>{getLobeIcon(getChannelTypeIcon(channelType), size)}</>
}

export function ApiKeyGroupPicker({
  options,
  value,
  onValueChange,
  disabled,
}: ApiKeyGroupPickerProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState<'flat' | 'byVendor'>('flat')
  const [vendorFilter, setVendorFilter] = useState<number | null>(null)

  const autoOption = useMemo(
    () => options.find((o) => o.value === AUTO_GROUP),
    [options]
  )
  const realOptions = useMemo(
    () => options.filter((o) => o.value !== AUTO_GROUP),
    [options]
  )

  // 厂商筛选条：按归一化渠道类型分组（含 Unknown=0），按数量降序
  const vendorCounts = useMemo(() => {
    const m = new Map<number, number>()
    for (const o of realOptions) {
      const tpe = normalizeType(o.channelType)
      m.set(tpe, (m.get(tpe) ?? 0) + 1)
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [realOptions])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return realOptions.filter((o) => {
      if (vendorFilter !== null && normalizeType(o.channelType) !== vendorFilter)
        return false
      if (!q) return true
      const vendorName = getChannelTypeLabel(normalizeType(o.channelType)).toLowerCase()
      return (
        o.value.toLowerCase().includes(q) ||
        o.desc?.toLowerCase().includes(q) ||
        vendorName.includes(q) ||
        o.models?.some((mdl) => mdl.toLowerCase().includes(q))
      )
    })
  }, [realOptions, search, vendorFilter])

  const sections = useMemo(() => {
    if (mode === 'flat') return null
    const byType = new Map<number, ApiKeyGroupPickerOption[]>()
    for (const o of filtered) {
      const tpe = normalizeType(o.channelType)
      if (!byType.has(tpe)) byType.set(tpe, [])
      byType.get(tpe)!.push(o)
    }
    return [...byType.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [filtered, mode])

  const showAuto = autoOption && vendorFilter === null && !search.trim()

  const renderCard = (o: ApiKeyGroupPickerOption) => {
    const selected = value === o.value
    const isAuto = o.value === AUTO_GROUP
    const models = o.models ?? []
    const visibleModels = models.slice(0, MAX_VISIBLE_MODELS)
    const restCount = models.length - visibleModels.length
    return (
      <button
        type='button'
        key={o.value}
        disabled={disabled}
        onClick={() => onValueChange(o.value)}
        className={cn(
          'bg-card flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors',
          'hover:bg-muted/50 focus-visible:ring-ring/40 focus-visible:ring-2 focus-visible:outline-none',
          selected && 'border-primary ring-primary/30 bg-primary/5 ring-2',
          disabled && 'cursor-not-allowed opacity-60'
        )}
      >
        <div className='flex items-center gap-2'>
          <span className='flex size-7 shrink-0 items-center justify-center'>
            <VendorIcon channelType={isAuto ? 0 : o.channelType} size={24} />
          </span>
          <span className='min-w-0 flex-1 truncate font-medium'>{o.value}</span>
          <GroupRatioBadge ratio={o.ratio} />
        </div>
        {o.desc && (
          <p className='text-muted-foreground line-clamp-2 text-xs'>{o.desc}</p>
        )}
        {visibleModels.length > 0 && (
          <div className='flex flex-wrap gap-1'>
            {visibleModels.map((mdl) => (
              <Badge
                key={mdl}
                variant='secondary'
                className='max-w-full truncate text-[10px] font-normal'
              >
                {mdl}
              </Badge>
            ))}
            {restCount > 0 && (
              <Badge variant='outline' className='text-[10px] font-normal'>
                {t('+{{count}} more', { count: restCount })}
              </Badge>
            )}
          </div>
        )}
      </button>
    )
  }

  const renderGrid = (items: ApiKeyGroupPickerOption[]) => (
    <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3'>
      {items.map(renderCard)}
    </div>
  )
// APPEND_MARKER2

  return (
    <div className='bg-card space-y-3 rounded-lg border p-3'>
      {/* 顶部：搜索 + 平铺/按厂商切换 */}
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
        <div className='relative flex-1'>
          <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('Search groups')}
            className='pl-9'
            disabled={disabled}
          />
        </div>
        <div className='bg-muted/50 flex shrink-0 rounded-lg p-0.5'>
          <Button
            type='button'
            size='sm'
            variant={mode === 'flat' ? 'secondary' : 'ghost'}
            className='h-7 px-3 text-xs'
            onClick={() => setMode('flat')}
          >
            {t('Flat')}
          </Button>
          <Button
            type='button'
            size='sm'
            variant={mode === 'byVendor' ? 'secondary' : 'ghost'}
            className='h-7 px-3 text-xs'
            onClick={() => setMode('byVendor')}
          >
            {t('By vendor')}
          </Button>
        </div>
      </div>

      {/* 中部：厂商筛选 chip 条（单选） */}
      {vendorCounts.length > 0 && (
        <ScrollArea className='w-full whitespace-nowrap'>
          <div className='flex gap-2 pb-2'>
            <button
              type='button'
              disabled={disabled}
              onClick={() => setVendorFilter(null)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors',
                vendorFilter === null
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted/50'
              )}
            >
              <span>{t('All')}</span>
              <Badge
                variant='secondary'
                className='ml-0.5 px-1.5 py-0 text-[10px]'
              >
                {realOptions.length}
              </Badge>
            </button>
            {vendorCounts.map(([type, count]) => (
              <button
                key={type}
                type='button'
                disabled={disabled}
                onClick={() => setVendorFilter(type)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors',
                  vendorFilter === type
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border text-muted-foreground hover:bg-muted/50'
                )}
              >
                <VendorIcon channelType={type} size={16} />
                <span>{getChannelTypeLabel(type)}</span>
                <Badge
                  variant='secondary'
                  className='ml-0.5 px-1.5 py-0 text-[10px]'
                >
                  {count}
                </Badge>
              </button>
            ))}
          </div>
          <ScrollBar orientation='horizontal' />
        </ScrollArea>
      )}

      {/* 下部：分组卡片网格（不独立滚动，交由外层容器统一滚动） */}
      <div>
        <div className='space-y-4'>
          {showAuto && renderGrid([autoOption!])}

          {mode === 'flat'
            ? renderGrid(filtered)
            : sections?.map(([type, items]) => (
                <div key={type} className='space-y-2'>
                  <div className='flex items-center gap-2 text-sm font-medium'>
                    <VendorIcon channelType={type} size={18} />
                    <span>{getChannelTypeLabel(type)}</span>
                    <span className='text-muted-foreground font-normal'>
                      ({items.length})
                    </span>
                  </div>
                  {renderGrid(items)}
                </div>
              ))}

          {filtered.length === 0 && !showAuto && (
            <p className='text-muted-foreground py-8 text-center text-sm'>
              {t('No group found.')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

