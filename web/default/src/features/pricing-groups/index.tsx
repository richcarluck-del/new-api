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
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { SectionPageLayout } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { CHANNEL_TYPE_CONFIGS } from '@/features/channels/lib/channel-type-config'
import { getPricingGroupOverview } from './api'
import type { PricingGroupChannel } from './types'

function channelTypeLabel(type: number): string {
  return CHANNEL_TYPE_CONFIGS[type]?.name ?? String(type)
}

function StatusCell({ status }: { status: number }) {
  const { t } = useTranslation()
  const enabled = status === 1
  return (
    <Badge variant={enabled ? 'default' : 'secondary'}>
      {enabled ? t('Enabled') : t('Disabled')}
    </Badge>
  )
}

function ChannelCells({ channel }: { channel: PricingGroupChannel }) {
  return (
    <>
      <TableCell className='tabular-nums'>{channel.channel_ratio}</TableCell>
      <TableCell className='tabular-nums'>{channel.priority}</TableCell>
      <TableCell className='text-muted-foreground tabular-nums'>
        {channel.id}
      </TableCell>
      <TableCell className='font-medium'>{channel.name}</TableCell>
      <TableCell className='text-muted-foreground'>
        {channelTypeLabel(channel.type)}
      </TableCell>
      <TableCell>
        <StatusCell status={channel.status} />
      </TableCell>
      <TableCell className='text-muted-foreground max-w-md truncate text-xs'>
        {channel.models || '—'}
      </TableCell>
    </>
  )
}

export function PricingGroups() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['pricing-group-overview'],
    queryFn: getPricingGroupOverview,
    staleTime: 30 * 1000,
  })

  const rows = data ?? []

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>
        {t('Pricing Group Overview')}
      </SectionPageLayout.Title>
      <SectionPageLayout.Description>
        {t('Compare every pricing group and the channels mounted under it')}
      </SectionPageLayout.Description>
      <SectionPageLayout.Content>
        <div className='overflow-hidden rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='border-r'>{t('Group')}</TableHead>
                <TableHead className='border-r'>{t('Description')}</TableHead>
                <TableHead className='border-r'>{t('Ratio')}</TableHead>
                <TableHead>{t('Channel Ratio')}</TableHead>
                <TableHead>{t('Priority')}</TableHead>
                <TableHead>{t('ID')}</TableHead>
                <TableHead>{t('Name')}</TableHead>
                <TableHead>{t('Type')}</TableHead>
                <TableHead>{t('Status')}</TableHead>
                <TableHead>{t('Models')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className='text-muted-foreground h-24 text-center'
                  >
                    {t('Loading...')}
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className='text-muted-foreground h-24 text-center'
                  >
                    {t('No data')}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const span = Math.max(1, row.channels.length)
                  if (row.channels.length === 0) {
                    return (
                      <TableRow
                        key={row.group}
                        className='border-t-2'
                      >
                        <TableCell className='border-r font-medium'>
                          {row.group}
                        </TableCell>
                        <TableCell className='text-muted-foreground border-r whitespace-normal'>
                          {row.description || '—'}
                        </TableCell>
                        <TableCell className='border-r tabular-nums'>
                          {row.ratio}
                        </TableCell>
                        <TableCell
                          colSpan={7}
                          className='text-muted-foreground/50 text-center'
                        >
                          {t('No channels')}
                        </TableCell>
                      </TableRow>
                    )
                  }
                  return row.channels.map((channel, index) => (
                    <TableRow
                      key={`${row.group}-${channel.id}-${index}`}
                      className={index === 0 ? 'border-t-2' : ''}
                    >
                      {index === 0 && (
                        <>
                          <TableCell
                            rowSpan={span}
                            className='border-r align-top font-medium'
                          >
                            {row.group}
                          </TableCell>
                          <TableCell
                            rowSpan={span}
                            className='text-muted-foreground border-r align-top whitespace-normal'
                          >
                            {row.description || '—'}
                          </TableCell>
                          <TableCell
                            rowSpan={span}
                            className='border-r align-top tabular-nums'
                          >
                            {row.ratio}
                          </TableCell>
                        </>
                      )}
                      <ChannelCells channel={channel} />
                    </TableRow>
                  ))
                })
              )}
            </TableBody>
          </Table>
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
