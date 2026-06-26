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
import { useId, type ReactNode } from 'react'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

type StatCardTone = 'cobalt' | 'sky' | 'violet'
type StatCardSparklineVariant = 'bars' | 'line'
type StatCardDetailTone =
  | 'default'
  | 'muted'
  | 'success'
  | 'warning'
  | 'destructive'

export interface StatCardDetail {
  label: string
  value: string
  tone?: StatCardDetailTone
}

interface StatCardProps {
  title: string
  value: string | number
  description: string
  icon: LucideIcon
  sparkline?: number[]
  sparklineVariant?: StatCardSparklineVariant
  details?: StatCardDetail[]
  tone?: StatCardTone
  loading?: boolean
  error?: boolean
  action?: ReactNode
}

const TONE_CLASSES: Record<StatCardTone, string> = {
  cobalt:
    'from-primary/80 via-primary/40 to-primary/10 dark:from-primary/70 dark:via-primary/30 dark:to-primary/5',
  sky: 'from-sky-500/80 via-sky-400/50 to-sky-300/15 dark:from-sky-400/70 dark:via-sky-500/30 dark:to-sky-500/5',
  violet:
    'from-violet-500/80 via-violet-400/50 to-violet-300/15 dark:from-violet-400/70 dark:via-violet-500/30 dark:to-violet-500/5',
}

const LINE_TONE_CLASSES: Record<StatCardTone, string> = {
  cobalt: 'text-primary',
  sky: 'text-sky-500 dark:text-sky-400',
  violet: 'text-violet-500 dark:text-violet-400',
}

const CHIP_TONE_CLASSES: Record<StatCardTone, string> = {
  cobalt: 'bg-primary/12 text-primary',
  sky: 'bg-sky-500/12 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400',
  violet:
    'bg-violet-500/12 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
}

const DETAIL_TONE_CLASSES: Record<StatCardDetailTone, string> = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
}

function normalizeSparkline(values?: number[]): number[] {
  if (!values?.length) return []

  const sanitized = values.map((value) => Math.max(0, Number(value) || 0))
  const max = Math.max(...sanitized)
  if (max <= 0) return sanitized.map(() => 0)

  return sanitized.map((value) => Math.max(8, (value / max) * 100))
}

function buildLineSparkline(values?: number[]) {
  if (!values?.length) return null

  const sanitized = values.map((value) => Math.max(0, Number(value) || 0))
  const width = 160
  const height = 36
  const padding = 3
  const max = Math.max(...sanitized)
  const min = Math.min(...sanitized)
  const range = max - min

  const points = sanitized.map((value, index) => {
    const x =
      sanitized.length === 1
        ? width / 2
        : (index / (sanitized.length - 1)) * width
    const normalized =
      range > 0 ? (value - min) / range : max > 0 ? 0.5 : 0
    const y = height - padding - normalized * (height - padding * 2)

    return { x, y }
  })

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
  const firstPoint = points[0]
  const lastPoint = points[points.length - 1]
  const areaPath = `${linePath} L ${lastPoint.x} ${height} L ${firstPoint.x} ${height} Z`

  return {
    areaPath,
    linePath,
  }
}

function LineSparkline(props: { values?: number[]; tone: StatCardTone }) {
  const rawGradientId = useId()
  const gradientId = `stat-card-line-${rawGradientId.replace(/:/g, '')}`
  const paths = buildLineSparkline(props.values)

  if (!paths) return <div className='h-8' aria-hidden='true' />

  return (
    <div
      className={cn(
        'relative h-8 overflow-hidden rounded-lg',
        LINE_TONE_CLASSES[props.tone]
      )}
      aria-hidden='true'
    >
      <svg
        viewBox='0 0 160 36'
        preserveAspectRatio='none'
        className='size-full'
      >
        <defs>
          <linearGradient id={gradientId} x1='0' x2='0' y1='0' y2='1'>
            <stop offset='0%' stopColor='currentColor' stopOpacity='0.24' />
            <stop offset='100%' stopColor='currentColor' stopOpacity='0' />
          </linearGradient>
        </defs>
        <path d={paths.areaPath} fill={`url(#${gradientId})`} />
        <path
          d={paths.linePath}
          fill='none'
          stroke='currentColor'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2.25'
          vectorEffect='non-scaling-stroke'
        />
      </svg>
    </div>
  )
}

function BarSparkline(props: { values?: number[]; tone: StatCardTone }) {
  const sparkline = normalizeSparkline(props.values)

  return (
    <div className='flex h-8 items-end gap-1' aria-hidden='true'>
      {sparkline.map((height, index) => (
        <span
          key={`spark-${index}`}
          className={cn(
            'flex-1 rounded-t-sm bg-linear-to-t',
            height <= 0 && 'opacity-20',
            TONE_CLASSES[props.tone]
          )}
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  )
}

function StatCardDetails(props: { details: StatCardDetail[] }) {
  return (
    <div className='grid grid-cols-2 gap-2'>
      {props.details.map((detail) => (
        <div
          key={detail.label}
          className='bg-muted/30 rounded-lg px-2 py-1.5'
        >
          <div className='text-muted-foreground truncate text-[11px] leading-none font-medium'>
            {detail.label}
          </div>
          <div
            className={cn(
              'mt-1.5 truncate text-xs font-semibold tabular-nums',
              DETAIL_TONE_CLASSES[detail.tone ?? 'default']
            )}
            title={detail.value}
          >
            {detail.value}
          </div>
        </div>
      ))}
    </div>
  )
}

export function StatCard(props: StatCardProps) {
  const Icon = props.icon
  const tone = props.tone ?? 'cobalt'
  const sparklineVariant = props.sparklineVariant ?? 'bars'

  return (
    <div className='group flex min-h-32 flex-col justify-between gap-3'>
      <div className='flex items-start justify-between gap-1'>
        <div className='flex min-w-0 items-center gap-2'>
          <span
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-lg',
              CHIP_TONE_CLASSES[tone]
            )}
            aria-hidden='true'
          >
            <Icon className='size-4' />
          </span>
          <span className='text-muted-foreground line-clamp-2 text-xs leading-snug font-medium'>
            {props.title}
          </span>
        </div>
        {props.action && <div className='shrink-0'>{props.action}</div>}
      </div>

      {props.loading ? (
        <div className='flex flex-col gap-1.5'>
          <Skeleton className='h-7 w-24' />
          <Skeleton className='h-3.5 w-32' />
        </div>
      ) : props.error ? (
        <div className='flex flex-col gap-1'>
          <div className='text-muted-foreground mt-0.5 font-mono text-base font-bold tracking-tight break-all tabular-nums sm:text-2xl'>
            --
          </div>
          <p className='text-muted-foreground/60 text-xs'>
            {props.description}
          </p>
        </div>
      ) : (
        <div className='flex flex-col gap-1'>
          <div className='text-foreground font-mono text-2xl font-bold tracking-tight break-all tabular-nums'>
            {props.value}
          </div>
          <p className='text-muted-foreground/60 text-xs leading-relaxed'>
            {props.description}
          </p>
        </div>
      )}

      {props.details?.length ? (
        <StatCardDetails details={props.details} />
      ) : sparklineVariant === 'line' ? (
        <LineSparkline values={props.sparkline} tone={tone} />
      ) : (
        <BarSparkline values={props.sparkline} tone={tone} />
      )}
    </div>
  )
}
