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
import { getLobeIcon } from '@/lib/lobe-icon'
import { AnimateInView } from '@/components/animate-in-view'

interface SupportedClientsProps {
  className?: string
}

const CLIENTS = [
  { icon: 'ClaudeCode.Avatar', name: 'Claude Code' },
  { icon: 'Codex.Avatar', name: 'Codex' },
  { icon: 'Cursor.Avatar', name: 'Cursor' },
  { icon: 'Cline.Avatar', name: 'Cline' },
  { icon: 'RooCode.Avatar', name: 'Roo Code' },
  { icon: 'Windsurf.Avatar', name: 'Windsurf' },
  { icon: 'Copilot.Avatar', name: 'Copilot' },
  { icon: 'Trae.Avatar', name: 'Trae' },
  { icon: 'KiloCode.Avatar', name: 'Kilo Code' },
  { icon: 'OpenClaw.Avatar', name: 'OpenClaw' },
  { icon: 'NousResearch.Avatar', name: 'Hermes' },
  { icon: 'CherryStudio.Avatar', name: 'Cherry Studio' },
] as const

export function SupportedClients(_props: SupportedClientsProps) {
  const { t } = useTranslation()

  return (
    <section className='relative z-10 px-6 py-12 md:py-16'>
      <div className='mx-auto max-w-6xl'>
        <AnimateInView animation='fade-up' className='mb-10 text-center md:mb-12'>
          <h2 className='text-2xl leading-tight font-bold tracking-tight md:text-4xl'>
            {t('兼容主流客户端')}
          </h2>
        </AnimateInView>

        <AnimateInView animation='fade-up' delay={120}>
          <div className='marquee-container group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]'>
            <div className='animate-scroll-left flex w-max gap-4 md:gap-5'>
              {[...CLIENTS, ...CLIENTS].map((c, i) => (
                <div
                  key={`${c.name}-${i}`}
                  aria-hidden={i >= CLIENTS.length}
                  className='flex w-[124px] shrink-0 flex-col items-center gap-3 rounded-2xl border border-border/50 bg-card/40 p-5 shadow-sm ring-1 ring-black/5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-lg'
                >
                  <div className='flex size-12 items-center justify-center overflow-hidden rounded-xl transition-transform duration-300 hover:scale-110'>
                    {getLobeIcon(c.icon, 48)}
                  </div>
                  <span className='text-sm font-medium whitespace-nowrap'>
                    {c.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </AnimateInView>
      </div>
    </section>
  )
}
