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
import { Copy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getLobeIcon } from '@/lib/lobe-icon'
import { cn } from '@/lib/utils'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { StatusBadge } from '@/components/status-badge'
import { DEFAULT_TOKEN_UNIT } from '../constants'
import {
  getDynamicDisplayGroupRatio,
  getDynamicPricingSummary,
} from '../lib/dynamic-price'
import { parseTags } from '../lib/filters'
import { isTokenBasedModel } from '../lib/model-helpers'
import {
  formatRequestPrice,
  getModelDiscountRatio,
  getPriceComparison,
  type PriceComparison,
} from '../lib/price'
import type { PriceType, PricingModel, TokenUnit } from '../types'
import { ModelPerfBadge, type ModelPerfBadgeData } from './model-perf-badge'

export interface ModelCardProps {
  model: PricingModel
  onClick: () => void
  priceRate?: number
  usdExchangeRate?: number
  tokenUnit?: TokenUnit
  showRechargePrice?: boolean
  perf?: ModelPerfBadgeData
}

export const ModelCard = memo(function ModelCard(props: ModelCardProps) {
  const { t } = useTranslation()
  const { copyToClipboard } = useCopyToClipboard()
  const tokenUnit = props.tokenUnit ?? DEFAULT_TOKEN_UNIT
  const priceRate = props.priceRate ?? 1
  const usdExchangeRate = props.usdExchangeRate ?? 1
  const showRechargePrice = props.showRechargePrice ?? false
  const isTokenBased = isTokenBasedModel(props.model)
  const tokenUnitLabel = tokenUnit === 'K' ? '1K' : '1M'
  const tags = parseTags(props.model.tags)
  const groups = props.model.enable_groups || []
  const endpoints = props.model.supported_endpoint_types || []
  const vendorIcon = props.model.vendor_icon
    ? getLobeIcon(props.model.vendor_icon, 28)
    : null
  const initial = props.model.model_name?.charAt(0).toUpperCase() || '?'
  const isDynamicPricing =
    props.model.billing_mode === 'tiered_expr' &&
    Boolean(props.model.billing_expr)
  const dynamicSummary = isDynamicPricing
    ? getDynamicPricingSummary(props.model, {
        tokenUnit,
        showRechargePrice,
        priceRate,
        usdExchangeRate,
        groupRatioMultiplier: getDynamicDisplayGroupRatio(props.model),
      })
    : null

  // Official-vs-site price comparison rows (token-based, non-dynamic only).
  const comparisonTypes: PriceType[] = ['input', 'output']
  const comparisonRows =
    isTokenBased && !isDynamicPricing
      ? comparisonTypes
          .map((type) => ({
            type,
            cmp: getPriceComparison(props.model, type, tokenUnit),
          }))
          .filter(
            (col): col is typeof col & { cmp: PriceComparison } =>
              col.cmp !== null
          )
      : []
  // Cache price (site, ¥) shown subtly in the price row when available.
  const cacheCmp =
    isTokenBased && !isDynamicPricing
      ? getPriceComparison(props.model, 'cache', tokenUnit)
      : null
  const discountRatio = getModelDiscountRatio(props.model)
  // Real user discount = group ratio ÷ USD→CNY rate (site is shown in ¥ at the
  // USD numeric base, so the FX rate is the extra discount). 0.35 / 7 => 0.05
  // => 0.5 折. Only show when there is a real discount.
  const realDiscount = usdExchangeRate > 0 ? discountRatio / usdExchangeRate : discountRatio
  const hasDiscount = realDiscount > 0 && realDiscount < 0.999
  const discountLabel = hasDiscount
    ? `${parseFloat((realDiscount * 10).toFixed(1))}${t('折')}`
    : ''
  // Savings = (official×FX − site) / (official×FX) = 1 − realDiscount.
  const savingsPercent = hasDiscount ? Math.round((1 - realDiscount) * 100) : 0

  const primaryGroup = groups[0]
  const bottomTags = [...endpoints.slice(0, 2), ...tags.slice(0, 2)]
  const hiddenCount =
    Math.max(groups.length - 1, 0) +
    Math.max(endpoints.length - 2, 0) +
    Math.max(tags.length - 2, 0)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    copyToClipboard(props.model.model_name || '')
  }

  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-xl border p-3 transition-colors sm:p-5'
      )}
    >
      {/* Header: icon + name + copy */}
      <div className='flex items-start justify-between gap-2.5 sm:gap-3'>
        <div className='flex min-w-0 items-start gap-2.5 sm:gap-3'>
          <div className='bg-muted/40 flex size-9 shrink-0 items-center justify-center rounded-lg sm:size-10 sm:rounded-xl'>
            {vendorIcon || (
              <span className='text-muted-foreground text-sm font-bold'>
                {initial}
              </span>
            )}
          </div>
          <div className='min-w-0'>
            <h3 className='text-foreground truncate font-mono text-[15px] leading-tight font-bold'>
              {props.model.model_name}
            </h3>
            {primaryGroup && (
              <span className='text-muted-foreground/70 mt-0.5 block truncate text-xs'>
                {primaryGroup} {t('Groups')}
              </span>
            )}
          </div>
        </div>

        <div className='flex shrink-0 items-center gap-1.5'>
          <button
            type='button'
            onClick={handleCopy}
            className='text-muted-foreground hover:text-foreground hover:bg-muted rounded-md border p-1.5 transition-colors'
            title={t('Copy')}
          >
            <Copy className='size-3.5' />
          </button>
        </div>
      </div>

      {/* Price comparison: official (strikethrough) vs site, with discount badge */}
      <div className='mt-3 flex-1 sm:mt-4'>
        {dynamicSummary ? (
          dynamicSummary.isSpecialExpression ? (
            <div className='text-xs'>
              <span className='text-amber-700 dark:text-amber-300'>
                {t('Special billing expression')}
              </span>
              <code className='text-muted-foreground/70 mt-0.5 line-clamp-1 block font-mono text-[11px] break-all'>
                {dynamicSummary.rawExpression}
              </code>
            </div>
          ) : dynamicSummary.primaryEntries.length > 0 ? (
            <div className='flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs'>
              {dynamicSummary.primaryEntries.map((entry) => (
                <span
                  key={entry.key}
                  className='text-muted-foreground whitespace-nowrap'
                >
                  {t(entry.shortLabel)}{' '}
                  <span className='text-foreground font-mono font-semibold'>
                    {entry.formatted}
                  </span>
                  /{tokenUnitLabel}
                </span>
              ))}
            </div>
          ) : (
            <span className='text-muted-foreground text-xs'>
              {t('Dynamic Pricing')}
            </span>
          )
        ) : comparisonRows.length > 0 ? (
          <div className='flex flex-wrap items-stretch gap-2'>
            <div className='bg-background flex w-36 shrink-0 flex-col gap-0.5 rounded-xl border px-3 py-2'>
              <span className='text-muted-foreground text-[10px] font-medium tracking-wider uppercase'>
                {t('Official Price')}
              </span>
              <span className='text-muted-foreground/70 font-mono text-sm font-medium tabular-nums line-through'>
                {comparisonRows.map((col, i) => (
                  <span key={col.type} className='whitespace-nowrap'>
                    {i > 0 && (
                      <span className='text-muted-foreground/40 mx-0.5'>/</span>
                    )}
                    {col.cmp.official}
                  </span>
                ))}
              </span>
            </div>
            <div className='bg-background flex w-36 shrink-0 flex-col gap-0.5 rounded-xl border px-3 py-2'>
              <span className='text-[10px] font-medium tracking-wider text-amber-600 uppercase dark:text-amber-400'>
                {t('Our Price')}
              </span>
              <span className='font-mono text-sm font-bold tabular-nums text-amber-600 dark:text-amber-400'>
                {comparisonRows.map((col, i) => (
                  <span key={col.type} className='whitespace-nowrap'>
                    {i > 0 && <span className='mx-0.5 opacity-50'>/</span>}
                    {col.cmp.site}
                  </span>
                ))}
              </span>
              {cacheCmp && (
                <span className='text-muted-foreground/50 text-[11px] whitespace-nowrap'>
                  {t('Cached')}{' '}
                  <span className='font-mono tabular-nums'>{cacheCmp.site}</span>
                </span>
              )}
            </div>
            {hasDiscount && (
              <span className='shrink-0 self-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-emerald-600 dark:text-emerald-400'>
                {discountLabel}
              </span>
            )}
            {hasDiscount && (
              <span className='shrink-0 self-center rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-white'>
                {t('约省 {{percent}}%', { percent: savingsPercent })}
              </span>
            )}
          </div>
        ) : (
          <span className='text-muted-foreground text-xs whitespace-nowrap'>
            <span className='text-foreground font-mono font-semibold'>
              {formatRequestPrice(
                props.model,
                showRechargePrice,
                priceRate,
                usdExchangeRate
              )}
            </span>{' '}
            / {t('request')}
          </span>
        )}
      </div>

      {/* Footer: left metadata and right performance summary share row alignment */}
      <div className='mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 gap-y-1 sm:mt-4'>
        <div className='flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1'>
          <span className='text-muted-foreground text-xs font-medium'>
            {isTokenBased ? t('Token-based') : t('Per Request')}
          </span>
          {isDynamicPricing && (
            <StatusBadge
              label={t('Dynamic Pricing')}
              variant='warning'
              copyable={false}
              size='sm'
            />
          )}
        </div>
        <ModelPerfBadge perf={props.perf} className='row-span-2 self-start' />

        <div className='flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-0.5 sm:gap-x-3 sm:gap-y-1'>
          {bottomTags.map((item) => (
            <span key={item} className='text-muted-foreground/70 text-xs'>
              {item}
            </span>
          ))}
          <span className='text-muted-foreground/50 text-xs'>
            {tokenUnitLabel}
          </span>
          {hiddenCount > 0 && (
            <span className='text-muted-foreground/40 text-xs'>
              +{hiddenCount}
            </span>
          )}
        </div>
      </div>
    </div>
  )
})
