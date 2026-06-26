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
import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

type CodeBlockProps = {
  code: string
  lang?: string
  title?: string // 给定文件名则显示 macOS 窗口栏；否则为简单命令框
  className?: string
}

export function CodeBlock({ code, lang, title, className }: CodeBlockProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // 剪贴板不可用时静默失败
    }
  }

  const copyBtn = (
    <button
      type='button'
      onClick={onCopy}
      className='text-muted-foreground hover:bg-background hover:text-foreground inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors'
    >
      {copied ? (
        <>
          <Check className='size-3.5' />
          {t('Copied')}
        </>
      ) : (
        <>
          <Copy className='size-3.5' />
          {t('Copy')}
        </>
      )}
    </button>
  )

  // 带文件名：macOS 窗口栏样式
  if (title) {
    return (
      <div
        className={cn(
          'bg-muted/60 overflow-hidden rounded-lg border',
          className
        )}
      >
        <div className='border-border/60 bg-muted flex items-center gap-2 border-b px-3 py-2'>
          <span className='size-3 rounded-full bg-[#ff5f56]' />
          <span className='size-3 rounded-full bg-[#ffbd2e]' />
          <span className='size-3 rounded-full bg-[#27c93f]' />
          <span className='text-muted-foreground ml-1 text-xs'>{title}</span>
          <span className='ml-auto'>{copyBtn}</span>
        </div>
        <pre className='overflow-x-auto p-4 text-sm leading-relaxed'>
          <code>{code}</code>
        </pre>
      </div>
    )
  }

  // 简单命令框：单行/少量命令，右侧浮动复制按钮
  return (
    <div
      className={cn(
        'bg-muted/60 group relative overflow-hidden rounded-lg border',
        className
      )}
    >
      <div className='absolute top-1.5 right-1.5 opacity-0 transition-opacity group-hover:opacity-100'>
        {copyBtn}
      </div>
      {lang && (
        <span className='text-muted-foreground absolute top-2 left-3 text-xs'>
          {lang}
        </span>
      )}
      <pre
        className={cn(
          'overflow-x-auto px-4 py-3 text-sm leading-relaxed',
          lang && 'pt-7'
        )}
      >
        <code>{code}</code>
      </pre>
    </div>
  )
}
