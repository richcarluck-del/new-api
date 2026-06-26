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
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { AnimateInView } from '@/components/animate-in-view'
import { useStatus } from '@/hooks/use-status'

interface PricingProps {
  className?: string
}

type PricingRow = {
  model: string
  hot?: boolean
  official?: string
  ratio?: string
  price?: string
  save?: string
}

// 模型定价兜底数据；后端未配置时使用。后端可在「系统设置 → 内容管理 → 模型定价」中覆盖。
const FALLBACK_PRICING_ROWS: PricingRow[] = [
  {
    model: 'GPT-5.5',
    hot: true,
    official: '$5.00 / $30.00',
    ratio: '0.35',
    price: '¥1.75 / ¥10.50',
    save: '约省 95%',
  },
  {
    model: 'Claude Opus 4.8',
    hot: false,
    official: '$5.00 / $25.00',
    ratio: '1.5',
    price: '¥7.50 / ¥37.50',
    save: '约省 78%',
  },
]

export function Pricing(_props: PricingProps) {
  const { t } = useTranslation()
  const { status } = useStatus()

  const enabled = (status?.['home_pricing_enabled'] ?? true) as boolean
  const configured = Array.isArray(status?.['home_pricing'])
    ? (status?.['home_pricing'] as PricingRow[])
    : []
  const rows: PricingRow[] =
    configured.length > 0 ? configured : FALLBACK_PRICING_ROWS

  if (!enabled) {
    return null
  }

  return (
    <section className='relative z-10 px-6 py-12 md:py-16'>
      <div className='mx-auto max-w-6xl'>
        <AnimateInView animation='fade-up' className='mb-4 text-center'>
          <h2 className='text-2xl leading-tight font-bold tracking-tight md:text-4xl'>
            {t('模型定价')}
          </h2>
        </AnimateInView>
        <AnimateInView
          animation='fade-up'
          delay={80}
          className='mb-10 text-center md:mb-12'
        >
          <p className='text-muted-foreground text-sm md:text-base'>
            {t('价格以人民币（¥）计价，官方价格以美元（$）标注。单位：百万 tokens。')}
          </p>
        </AnimateInView>

        <AnimateInView animation='fade-up' delay={160}>
          <div className='border-border/60 bg-card/40 overflow-x-auto rounded-2xl border shadow-sm ring-1 ring-black/5 backdrop-blur'>
            <div className='min-w-[640px]'>
              {/* 表头 */}
              <div className='border-border/60 text-muted-foreground grid grid-cols-[1.4fr_1.2fr_0.7fr_1.2fr_0.9fr] gap-4 border-b px-6 py-4 text-sm font-medium'>
                <div>{t('模型')}</div>
                <div>{t('官方价格 ($/1M TOK)')}</div>
                <div>{t('倍率')}</div>
                <div>{t('本站价格 (¥/1M TOK)')}</div>
                <div>{t('节省')}</div>
              </div>

              {/* 数据行 */}
              {rows.map((row) => (
                <div
                  key={row.model}
                  className='border-border/40 grid grid-cols-[1.4fr_1.2fr_0.7fr_1.2fr_0.9fr] items-center gap-4 border-b px-6 py-5 last:border-b-0'
                >
                  {/* 模型 */}
                  <div className='flex items-center gap-2'>
                    <span className='bg-emerald-500 size-2 shrink-0 rounded-full' />
                    <span className='font-semibold'>{row.model}</span>
                  </div>
                  {/* 官方价格 */}
                  <div className='text-muted-foreground'>{row.official}</div>
                  {/* 倍率 */}
                  <div className='text-muted-foreground'>{row.ratio}</div>
                  {/* 本站价格 */}
                  <div className='font-medium'>{row.price}</div>
                  {/* 节省 */}
                  <div className='flex'>
                    <span className='rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400'>
                      {row.save}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AnimateInView>

        <AnimateInView animation='fade-up' delay={200} className='mt-6 text-center'>
          <Link
            to='/pricing'
            className='text-muted-foreground hover:text-foreground text-sm font-medium underline underline-offset-4 transition-colors'
          >
            {t('查看更多模型')}
          </Link>
        </AnimateInView>
      </div>
    </section>
  )
}
