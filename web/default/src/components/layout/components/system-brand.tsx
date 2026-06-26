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
import { cn } from '@/lib/utils'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const BRAND_LOGO = '/sf-logo.png'
const BRAND_WORDMARK = '/sf-wordmark.png'

type SystemBrandProps = {
  defaultName?: string
  defaultVersion?: string
  /**
   * Visual layout:
   * - 'sidebar': stacked card style (used inside the sidebar header).
   * - 'inline': compact horizontal pill (used inside the top app bar).
   */
  variant?: 'sidebar' | 'inline'
}

/**
 * System brand component
 * Displays current system logo + name.
 * - inline: compact pill in the top app bar; clicking navigates to home (/)
 * - sidebar: stacked card in the sidebar header (display only)
 */
export function SystemBrand(props: SystemBrandProps) {
  const { t } = useTranslation()

  const variant = props.variant ?? 'sidebar'

  if (variant === 'inline') {
    return (
      <Link
        to='/'
        aria-label={t('Go to home')}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg px-1 py-0.5 transition-colors outline-none select-none',
          'hover:bg-accent focus-visible:ring-ring/40 focus-visible:ring-2'
        )}
      >
        <img
          src={BRAND_LOGO}
          alt={t('Logo')}
          className='size-9 object-contain'
        />
        <img
          src={BRAND_WORDMARK}
          alt='shunfeng'
          className='mt-1.5 h-5 w-auto object-contain'
        />
      </Link>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size='lg'
          className='hover:text-sidebar-foreground active:text-sidebar-foreground h-auto cursor-default py-2 hover:bg-transparent active:bg-transparent'
          render={<div />}
        >
          <img
            src={BRAND_LOGO}
            alt={t('Logo')}
            className='size-11 shrink-0 object-contain'
          />
          <div className='flex flex-1 flex-col items-start gap-1.5 group-data-[collapsible=icon]:hidden'>
            <img
              src={BRAND_WORDMARK}
              alt='shunfeng'
              className='h-6 w-auto max-w-full object-contain'
            />
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
