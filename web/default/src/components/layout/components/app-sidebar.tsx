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
import { useMemo } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth-store'
import { getUserAvatarFallback, getUserAvatarStyle } from '@/lib/avatar'
import { formatQuotaWithCurrency } from '@/lib/currency'
import { ROLE } from '@/lib/roles'
import { useLayout } from '@/context/layout-provider'
import { useUserDisplay } from '@/hooks/use-user-display'
import { useSidebarConfig } from '@/hooks/use-sidebar-config'
import { useSidebarData } from '@/hooks/use-sidebar-data'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from '@/components/ui/sidebar'
import { getNavGroupsForPath } from '../lib/workspace-registry'
import { NavGroup } from './nav-group'

/**
 * Application sidebar component
 * Fetches corresponding navigation menu from workspace registry based on current path
 * Dynamically filters navigation items based on backend SidebarModulesAdmin configuration
 *
 * Automatically matches workspace configuration for current path through workspace registry system
 * Adding new workspaces only requires registration in workspace-registry.ts
 */
export function AppSidebar() {
  const { t } = useTranslation()
  const { collapsible, variant } = useLayout()
  const { pathname } = useLocation()
  const userRole = useAuthStore((state) => state.auth.user?.role)
  const user = useAuthStore((state) => state.auth.user)
  const sidebarData = useSidebarData()
  const { displayName } = useUserDisplay(user)
  const avatarName = user?.username || displayName
  const avatarFallback = getUserAvatarFallback(avatarName)
  const avatarStyle = useMemo(
    () => getUserAvatarStyle(avatarName),
    [avatarName]
  )
  const balance = formatQuotaWithCurrency(Number(user?.quota ?? 0))

  // Get navigation group configuration corresponding to current path from workspace registry
  const allNavGroups = getNavGroupsForPath(pathname, t) || sidebarData.navGroups

  // Filter sidebar navigation items based on backend configuration
  const configFilteredNavGroups = useSidebarConfig(allNavGroups)

  // Filter navigation groups based on user role
  // Non-Admin users cannot see Admin navigation group
  const currentNavGroups = useMemo(() => {
    const isAdmin = userRole && userRole >= ROLE.ADMIN
    return configFilteredNavGroups.filter((group) => {
      if (group.id === 'admin') {
        return isAdmin
      }
      return true
    })
  }, [configFilteredNavGroups, userRole])

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarContent className='pt-4 pb-2'>
        {currentNavGroups.map((props) => {
          const key = props.id || props.title
          return <NavGroup key={key} {...props} />
        })}
      </SidebarContent>
      <SidebarFooter className='p-2'>
        <Link
          to='/wallet'
          className='group/usercard flex items-center gap-2.5 rounded-xl border border-border/60 bg-card p-2 transition-colors hover:border-primary/40 hover:bg-primary/5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0'
        >
          <Avatar className='size-8 shrink-0'>
            <AvatarFallback
              className='text-[11px] font-semibold text-white'
              style={avatarStyle}
            >
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
          <div className='flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden'>
            <span className='text-foreground truncate text-sm font-medium'>
              {displayName}
            </span>
            <span className='text-muted-foreground truncate text-xs'>
              {t('Balance')}{' '}
              <span className='text-primary font-semibold'>{balance}</span>
            </span>
          </div>
          <ChevronRight className='text-muted-foreground size-4 shrink-0 transition-transform group-hover/usercard:translate-x-0.5 group-hover/usercard:text-primary group-data-[collapsible=icon]:hidden' />
        </Link>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
