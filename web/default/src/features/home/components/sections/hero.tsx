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
import { ArrowRight, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { InteractiveHeroBackground } from './interactive-hero-background'

interface HeroProps {
  className?: string
  isAuthenticated?: boolean
}

const MODELS = [
  { name: 'Claude', logo: '/model-claude.webp' },
  { name: 'OpenAI', logo: '/model-gpt.webp' },
  { name: 'Gemini', logo: '/model-gemini.webp' },
]

export function Hero(props: HeroProps) {
  const { t } = useTranslation()
  const ctaTo = props.isAuthenticated ? '/dashboard' : '/sign-up'

  return (
    <section className='relative z-10 px-6 pt-12 pb-12 md:pt-16 md:pb-20'>
      {/* Interactive particle ripple — extended mask to cover Features section below */}
      <div
        aria-hidden
        className='pointer-events-none fixed inset-0 -z-10 [mask-image:radial-gradient(ellipse_90%_100%_at_50%_20%,black,transparent)]'
      >
        <InteractiveHeroBackground />
      </div>

      {/* Subtle warm ambient glow */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 -z-10 opacity-[0.07] dark:opacity-[0.06]'
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 35% 30%, oklch(0.7 0.2 35 / 80%) 0%, transparent 70%)',
        }}
      />

      <div className='mx-auto max-w-6xl'>
        {/* Top row: left content + right models */}
        <div className='flex flex-col items-center justify-center gap-12 md:flex-row md:items-center md:gap-48'>
          {/* Left: brand + copy */}
          <div className='flex max-w-md flex-col items-center text-center md:items-start md:text-left'>
            {/* Brand lockup — logo-led, sits above the headline as identity */}
            <div className='mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 md:-ml-2'>
              <img
                src='/sf-logo.png'
                alt={t('Logo')}
                className='size-14 -mt-3 object-contain drop-shadow md:size-16 md:-mt-4'
              />
              <div className='flex flex-wrap items-baseline gap-x-1.5 gap-y-2'>
                <span className='font-brand text-3xl tracking-tight md:text-4xl'>
                  {t('顺风')}
                </span>
                <div className='flex items-center gap-3'>
                  <span className='text-muted-foreground text-lg font-semibold md:text-xl'>
                    API
                  </span>
                  <span className='border-primary/30 bg-primary/10 text-primary inline-flex items-center rounded-full border px-3.5 py-1 text-sm font-medium whitespace-nowrap shadow-sm backdrop-blur'>
                    {t('1 RMB = 1 USD，官方价格同步')}
                  </span>
                </div>
              </div>
            </div>

            <h1 className='text-[clamp(2rem,5.5vw,3.5rem)] leading-[1.1] font-bold tracking-tight'>
              {t('稳定')} · {t('安全')} · {t('超值')}
            </h1>

            <p className='text-muted-foreground mt-4 text-base leading-relaxed md:text-lg'>
              {t('一个 Key，即可使用 ')}
              <span className='text-red-500 font-bold'>GPT</span>
              {t('、')}
              <span className='text-red-500 font-bold'>Claude</span>
              {t(' 等主流模型。')}
            </p>
          </div>

          {/* Right: supported models — bounded panel so it reads as one object */}
          <div className='w-full max-w-[280px] rounded-2xl border border-border/60 bg-card/40 p-5 shadow-sm backdrop-blur'>
          <p className='text-muted-foreground mb-4 text-xs font-medium'>
            {t('支持主流模型')}
          </p>
          <div className='flex flex-col gap-4'>
            {MODELS.map((m) => (
              <div key={m.name} className='flex items-center gap-3'>
                <div className='flex size-10 items-center justify-center overflow-hidden rounded-xl bg-card/60 p-1.5 shadow-sm ring-1 ring-border/50'>
                  <img
                    src={m.logo}
                    alt={m.name}
                    className='size-full object-contain'
                  />
                </div>
                <span className='min-w-16 text-lg font-semibold'>{m.name}</span>
                <Check
                  className='ml-auto size-5 text-sky-500'
                  strokeWidth={2.5}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row: centered CTA button */}
      <div className='mt-16 flex justify-center'>
        <Button
          size='lg'
          className='group h-13 rounded-xl px-9 text-base font-semibold shadow-lg shadow-primary/20 transition-all duration-200 hover:scale-[1.03] hover:shadow-xl hover:shadow-primary/30'
          render={<Link to={ctaTo} />}
        >
          {t('获取 API key')}
          <ArrowRight className='ml-2 size-5 transition-transform duration-200 group-hover:translate-x-1' />
        </Button>
      </div>
    </div>
    </section>
  )
}
