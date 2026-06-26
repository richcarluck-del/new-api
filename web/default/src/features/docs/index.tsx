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
import { Code, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { getLobeIcon } from '@/lib/lobe-icon'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdaptiveLayout } from '@/components/layout'
import { DocBlocks } from './components/doc-blocks'
import { DOC_TABS } from './data'
import type { ClientDoc, DocTab } from './types'

export function Docs() {
  const { t } = useTranslation()

  return (
    <AdaptiveLayout>
      <div className='mx-auto max-w-5xl px-4 py-8'>
        <h1 className='mb-6 text-2xl font-bold tracking-tight'>
          {t('使用教程')}
        </h1>
        <Tabs defaultValue={DOC_TABS[0].id}>
          <TabsList className='bg-muted/60 h-auto w-full justify-start gap-1 rounded-xl p-1 sm:w-auto'>
            {DOC_TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className='data-active:bg-background data-active:text-foreground rounded-lg px-4 py-2 text-sm font-medium data-active:shadow-sm'
              >
                {t(tab.label)}
              </TabsTrigger>
            ))}
          </TabsList>
          {DOC_TABS.map((tab) => (
            <TabsContent
              key={tab.id}
              value={tab.id}
              className='min-h-[60vh] pt-6'
            >
              <TabPanel tab={tab} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdaptiveLayout>
  )
}

function TabPanel({ tab }: { tab: DocTab }) {
  // 纯正文 tab（常见问题）
  if (tab.clients === undefined) {
    return <PanelBody blocks={tab.blocks ?? []} />
  }
  return <ClientTabPanel clients={tab.clients} />
}

function ClientTabPanel({ clients }: { clients: ClientDoc[] }) {
  const [activeId, setActiveId] = useState(clients[0]?.id)
  const active = useMemo(
    () => clients.find((c) => c.id === activeId) ?? clients[0],
    [clients, activeId]
  )

  return (
    <div className='space-y-5'>
      {/* 客户端 chip 行 */}
      <div className='flex flex-wrap gap-2'>
        {clients.map((c) => {
          const selected = c.id === active?.id
          return (
            <button
              key={c.id}
              type='button'
              onClick={() => setActiveId(c.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors',
                selected
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted/50'
              )}
            >
              <span className='flex size-5 items-center justify-center'>
                {c.icon ? (
                  getLobeIcon(c.icon, 20)
                ) : (
                  <Code className='size-4' />
                )}
              </span>
              <span className='whitespace-nowrap'>{c.name}</span>
            </button>
          )
        })}
      </div>

      {/* 选中客户端正文 */}
      {active && <PanelBody blocks={active.blocks} />}
    </div>
  )
}

function PanelBody({ blocks }: { blocks: ClientDoc['blocks'] }) {
  const { t } = useTranslation()
  if (blocks.length === 0) {
    return (
      <div className='text-muted-foreground flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed'>
        <FileText className='size-10' />
        <p className='text-sm'>{t('内容即将上线')}</p>
      </div>
    )
  }
  return <DocBlocks blocks={blocks} />
}
