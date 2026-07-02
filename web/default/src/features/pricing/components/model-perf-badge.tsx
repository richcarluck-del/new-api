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
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import {
  formatLatency,
  formatThroughput,
} from '@/features/performance-metrics/lib/format'

export type ModelPerfBadgeData = {
  avg_ttft_ms: number
  avg_latency_ms: number
  success_rate: number
  avg_tps: number
}

export interface ModelPerfBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  perf: ModelPerfBadgeData | undefined
}

function formatCompactThroughput(tps: number): string {
  return formatThroughput(tps).replace(' t/s', 'tps')
}

export const ModelPerfBadge = memo(function ModelPerfBadge(
  props: ModelPerfBadgeProps
) {
  const { t } = useTranslation()

  if (!props.perf) {
    return null
  }

  const { avg_ttft_ms, avg_tps, success_rate } = props.perf

  let statusColor = 'bg-emerald-500'
  if (success_rate < 99) {
    statusColor = 'bg-red-500'
  } else if (success_rate < 99.9) {
    statusColor = 'bg-amber-500'
  }

  return (
    <div
      className={cn(
        'hidden w-[132px] grid-cols-[36px_44px_38px] gap-x-2 text-center tabular-nums min-[460px]:grid',
        props.className
      )}
    >
      <div title={t('Time to first token')} className='min-w-0'>
        <div className='text-muted-foreground/55 text-[10px] leading-4'>
          {t('TTFT short')}
        </div>
        <div className='text-muted-foreground/80 font-mono text-xs leading-4 whitespace-nowrap'>
          {avg_ttft_ms > 0 ? formatLatency(avg_ttft_ms) : '—'}
        </div>
      </div>
      <div title={t('Throughput')} className='min-w-0'>
        <div className='text-muted-foreground/55 truncate text-[10px] leading-4'>
          {t('Throughput short')}
        </div>
        <div className='text-muted-foreground/80 font-mono text-xs leading-4 whitespace-nowrap'>
          {formatCompactThroughput(avg_tps)}
        </div>
      </div>
      <div
        title={`${t('Success rate')}: ${success_rate.toFixed(1)}%`}
        className='min-w-0'
      >
        <div className='text-muted-foreground/55 truncate text-[10px] leading-4'>
          {t('Status short')}
        </div>
        <div className='flex h-4 items-center justify-center'>
          <span className={cn('size-2 rounded-full', statusColor)} />
        </div>
      </div>
    </div>
  )
})
