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
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { AnimateInView } from '@/components/animate-in-view'

interface UseCasesProps {
  className?: string
  isAuthenticated?: boolean
}

export function UseCases(props: UseCasesProps) {
  const { t } = useTranslation()
  const ctaTo = props.isAuthenticated ? '/dashboard' : '/sign-up'

  const cases = [
    { image: '/coder.avif', title: t('独立开发者') },
    { image: '/team.jpg', title: t('中小开发团队') },
    { image: '/bigioffice.jpg', title: t('工业级研发和服务') },
  ]

  return (
    <section className='relative z-10 overflow-hidden px-6 py-16 md:py-24'>
      {/* Ambient gradient glow */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 -z-10 opacity-[0.12] dark:opacity-[0.07]'
        style={{
          background: [
            'radial-gradient(ellipse 45% 45% at 20% 30%, oklch(0.7 0.15 250 / 70%) 0%, transparent 70%)',
            'radial-gradient(ellipse 40% 40% at 85% 70%, oklch(0.72 0.18 35 / 60%) 0%, transparent 70%)',
          ].join(', '),
        }}
      />

      <div className='mx-auto max-w-6xl'>
        <AnimateInView animation='fade-up' className='mb-12 text-center md:mb-16'>
          <h2 className='text-3xl leading-tight font-bold tracking-tight md:text-5xl'>
            {t('适用场景')}
          </h2>
          <p className='text-muted-foreground/80 mx-auto mt-4 max-w-xl text-sm leading-relaxed md:text-base'>
            {t('从个人到企业，稳定可靠的 API 服务覆盖每一种研发需求')}
          </p>
        </AnimateInView>

        <div className='grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 md:gap-10'>
          {cases.map((c, i) => (
            <AnimateInView
              key={c.title}
              delay={i * 120}
              animation='fade-up'
              className='group flex flex-col'
            >
              <h3 className='mb-4 text-center text-xl font-bold tracking-tight md:text-2xl'>
                {c.title}
              </h3>
              <div className='relative overflow-hidden rounded-2xl border border-border/50 shadow-lg ring-1 ring-black/5 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl'>
                <img
                  src={c.image}
                  alt={c.title}
                  loading='lazy'
                  className='block h-auto w-full object-contain transition-transform duration-500 group-hover:scale-105'
                />
                {/* Subtle bottom gradient for depth */}
                <div
                  aria-hidden
                  className='pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent'
                />
              </div>
            </AnimateInView>
          ))}
        </div>

        <AnimateInView
          animation='scale-in'
          delay={200}
          className='mt-14 flex justify-center md:mt-16'
        >
          <Button
            size='lg'
            className='group h-13 rounded-xl px-9 text-base font-semibold shadow-lg shadow-primary/20 transition-all duration-200 hover:scale-[1.03] hover:shadow-xl hover:shadow-primary/30'
            render={<Link to={ctaTo} />}
          >
            {t('获取 API key')}
            <ArrowRight className='ml-2 size-5 transition-transform duration-200 group-hover:translate-x-1' />
          </Button>
        </AnimateInView>
      </div>
    </section>
  )
}
