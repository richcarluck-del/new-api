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
import { useCallback } from 'react'
import {
  INTERFACE_LANGUAGE_OPTIONS,
  normalizeInterfaceLanguage,
} from '@/i18n/languages'
import { Check, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth-store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const LANGUAGE_MAP: Record<string, { code: string; label: string }> = {
  zh: { code: 'CN', label: '中文' },
  'zh-CN': { code: 'CN', label: '中文' },
  'zh-TW': { code: 'CN', label: '中文' },
  en: { code: 'US', label: 'English' },
  'en-US': { code: 'US', label: 'English' },
}

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const user = useAuthStore((s) => s.auth.user)
  const currentLanguage = normalizeInterfaceLanguage(i18n.language)

  // 只显示中英文
  const languages = INTERFACE_LANGUAGE_OPTIONS.filter(
    (lang) => lang.code === 'zh' || lang.code === 'en'
  )

  const currentDisplay = LANGUAGE_MAP[currentLanguage] || { code: 'US', label: 'English' }

  const handleChangeLanguage = useCallback(
    async (code: string) => {
      await i18n.changeLanguage(code)
      if (user) {
        try {
          await api.put('/api/user/self', { language: code })
        } catch {
          // Best-effort persistence; don't block the UI on failure
        }
      }
    },
    [i18n, user]
  )

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={
          <Button
            variant='ghost'
            size='sm'
            className='h-8 gap-1 px-2 text-xs font-medium text-muted-foreground hover:text-foreground'
          />
        }
      >
        <span className='text-[10px] font-semibold tracking-wide opacity-60'>
          {currentDisplay.code}
        </span>
        <span className='text-sm'>{currentDisplay.label}</span>
        <ChevronDown className='size-3 opacity-50' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='min-w-[140px]'>
        {languages.map((lang) => {
          const display = LANGUAGE_MAP[lang.code]
          const isActive = currentLanguage === lang.code
          return (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleChangeLanguage(lang.code)}
              className={cn(
                'flex items-center justify-between gap-3 px-3 py-2',
                isActive && 'text-primary'
              )}
            >
              <div className='flex items-center gap-2'>
                <span className='text-[10px] font-semibold tracking-wide opacity-60'>
                  {display.code}
                </span>
                <span className='text-sm'>{display.label}</span>
              </div>
              {isActive && (
                <Check className='size-4 text-primary' strokeWidth={2.5} />
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
