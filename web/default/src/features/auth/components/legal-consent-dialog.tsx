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
import { CalendarClock, ExternalLink, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { EnabledLegalDoc } from '../hooks/use-legal-gate'

// 协议名称为空时的 i18n 默认名
const DEFAULT_TITLE_KEYS: Record<string, string> = {
  user_agreement: 'User Agreement',
  privacy_policy: 'Privacy Policy',
  cross_border_transfer: 'Cross-border Data Transfer Agreement',
}

interface LegalConsentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  enabledDocs: EnabledLegalDoc[]
  updatedAt: string
  // 点「同意并继续」（无需逐项勾选）
  onAgree: () => void
  // 点「拒绝」（保持门禁禁用态）
  onReject: () => void
}

export function LegalConsentDialog({
  open,
  onOpenChange,
  enabledDocs,
  updatedAt,
  onAgree,
  onReject,
}: LegalConsentDialogProps) {
  const { t } = useTranslation()

  const handleAgree = () => {
    onAgree()
    onOpenChange(false)
  }

  const handleReject = () => {
    onReject()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} disablePointerDismissal>
      <DialogContent showCloseButton={false} className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('条款更新提示')}</DialogTitle>
          <DialogDescription>
            {t('我们更新了服务条款，请在继续前重新阅读并同意')}
          </DialogDescription>
        </DialogHeader>

        {updatedAt && (
          <div className='flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300'>
            <CalendarClock className='h-4 w-4 shrink-0' />
            <span>
              {t('更新时间')}：
              <span className='font-semibold tabular-nums'>{updatedAt}</span>
            </span>
          </div>
        )}

        <div className='space-y-2'>
          <div className='text-foreground text-sm font-medium'>
            {t('相关文档')}
          </div>
          {enabledDocs.map((doc) => {
            const name =
              doc.title || t(DEFAULT_TITLE_KEYS[doc.docType] || doc.docType)
            return (
              <a
                key={doc.docType}
                href={doc.href}
                target='_blank'
                rel='noopener noreferrer'
                className='border-border/60 bg-muted/40 hover:bg-muted flex items-center justify-between gap-2 rounded-md border p-3 transition-colors'
              >
                <span className='text-foreground flex items-center gap-2 text-sm'>
                  <FileText className='text-muted-foreground h-4 w-4 shrink-0' />
                  {name}
                </span>
                <span className='text-primary inline-flex shrink-0 items-center gap-1 text-xs'>
                  {t('查看')}
                  <ExternalLink className='h-3 w-3' />
                </span>
              </a>
            )
          })}
        </div>

        <DialogFooter>
          <Button type='button' variant='outline' onClick={handleReject}>
            {t('拒绝')}
          </Button>
          <Button type='button' onClick={handleAgree}>
            {t('同意并继续')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
