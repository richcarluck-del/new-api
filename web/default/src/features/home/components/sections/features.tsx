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
import { useTranslation } from 'react-i18next'
import { AnimateInView } from '@/components/animate-in-view'

interface FeaturesProps {
  className?: string
}

export function Features(_props: FeaturesProps) {
  const { t } = useTranslation()

  const additionalFeatures = [
    {
      icon: '/dollar-sign.svg',
      title: t('计费透明'),
      desc: t('按量计费，实时展示消费数据'),
    },
    {
      icon: '/lock-keyhole.svg',
      title: t('数据安全'),
      desc: t('电信级安全标准，全面隐私保护'),
    },
    {
      icon: '/medal.svg',
      title: t('极致稳定'),
      desc: t('持续token质量和链路检测'),
    },
  ]

  return (
    <section className='relative z-10 px-6 py-12 md:py-16'>
      <div className='mx-auto max-w-6xl'>
        {/* Additional features row */}
        <div className='grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-16'>
          {additionalFeatures.map((f, i) => (
            <AnimateInView
              key={f.title}
              delay={i * 100}
              animation='fade-up'
              className='flex flex-col items-center text-center'
            >
              <div className='mb-4'>
                <img
                  src={f.icon}
                  alt={f.title}
                  className='size-6 opacity-70'
                  style={{
                    filter:
                      'invert(0.5) sepia(1) saturate(3) hue-rotate(180deg) brightness(1.1)',
                  }}
                />
              </div>
              <h3 className='mb-2 text-xl font-bold'>{f.title}</h3>
              <p className='text-muted-foreground max-w-[280px] text-sm leading-relaxed'>
                {f.desc}
              </p>
            </AnimateInView>
          ))}
        </div>
      </div>
    </section>
  )
}
