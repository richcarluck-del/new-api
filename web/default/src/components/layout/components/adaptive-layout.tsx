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
import { useAuthStore } from '@/stores/auth-store'
import { AuthenticatedLayout } from './authenticated-layout'
import { PublicLayout } from './public-layout'

type AdaptiveLayoutProps = {
  children: React.ReactNode
  /**
   * When true (default), wraps content in a centered page container.
   * Set false for pages that manage their own full-width container.
   */
  showMainContainer?: boolean
}

/**
 * Renders content inside the authenticated console frame (sidebar + app header)
 * when the user is signed in, and the public marketing layout otherwise.
 *
 * This lets public-accessible pages (pricing, rankings, about, legal) sit inside
 * the left-menu console shell for logged-in users while remaining reachable for guests.
 */
export function AdaptiveLayout(props: AdaptiveLayoutProps) {
  const { showMainContainer = true } = props
  const isAuthenticated = !!useAuthStore((s) => s.auth.user)

  if (isAuthenticated) {
    return (
      <AuthenticatedLayout>
        <div className='h-full overflow-y-auto [scrollbar-gutter:stable]'>
          {showMainContainer ? (
            <div className='container px-4 py-6 md:px-4'>{props.children}</div>
          ) : (
            props.children
          )}
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <PublicLayout showMainContainer={showMainContainer}>
      {props.children}
    </PublicLayout>
  )
}
