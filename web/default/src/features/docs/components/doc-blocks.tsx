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
import { Info, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Markdown } from '@/components/ui/markdown'
import type { DocBlock } from '../types'
import { CodeBlock } from './code-block'
import { DocMockup } from './mockups'

// 按顺序渲染一个客户端（或 tab）的正文块。
export function DocBlocks({ blocks }: { blocks: DocBlock[] }) {
  if (blocks.length === 0) {
    return null
  }
  return (
    <div className='space-y-4'>
      {blocks.map((block, i) => (
        <DocBlockItem key={i} block={block} />
      ))}
    </div>
  )
}

function DocBlockItem({ block }: { block: DocBlock }) {
  switch (block.type) {
    case 'heading':
      return (
        <h3 className='mt-2 text-base font-semibold tracking-tight'>
          {block.text}
        </h3>
      )
    case 'text':
      return <Markdown>{block.text}</Markdown>
    case 'code':
      return <CodeBlock code={block.code} lang={block.lang} title={block.title} />
    case 'image':
      return (
        <img
          src={block.src}
          alt={block.alt ?? ''}
          className='rounded-lg border shadow-sm'
        />
      )
    case 'callout':
      return <Callout text={block.text} variant={block.variant} />
    case 'mockup':
      return <DocMockup name={block.name} />
    default:
      return null
  }
}

function Callout({
  text,
  variant = 'info',
}: {
  text: string
  variant?: 'info' | 'warning'
}) {
  const isWarning = variant === 'warning'
  const Icon = isWarning ? TriangleAlert : Info
  return (
    <div
      className={cn(
        'flex gap-2 rounded-lg border p-3 text-sm',
        isWarning
          ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200'
          : 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200'
      )}
    >
      <Icon className='mt-0.5 size-4 shrink-0' />
      <span>{text}</span>
    </div>
  )
}
