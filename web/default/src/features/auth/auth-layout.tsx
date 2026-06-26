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

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation()

  return (
    <div className='relative grid h-svh max-w-none'>
      <header className='absolute inset-x-0 top-0 z-10'>
        <div className='mx-auto max-w-7xl px-4 md:px-6'>
          <div className='flex h-[66px] items-center px-2'>
            <Link
              to='/'
              className='inline-flex items-center gap-2 rounded-lg px-1 py-0.5 outline-none select-none transition-opacity hover:opacity-80'
            >
              <img
                src='/sf-logo.png'
                alt={t('Logo')}
                className='size-[38px] object-contain'
              />
              <img
                src='/sf-wordmark.png'
                alt='shunfeng'
                className='mt-3 h-6 w-auto object-contain'
              />
            </Link>
          </div>
        </div>
      </header>
      <div className='container flex items-center pt-16 sm:pt-0'>
        <div className='mx-auto flex w-full flex-col justify-center space-y-2 px-4 py-8 sm:w-[480px] sm:p-8'>
          {children}
        </div>
      </div>
    </div>
  )
}
