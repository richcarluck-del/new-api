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
import { useCallback, useMemo, useState } from 'react'
import {
  getAgreedLegalHashes,
  markAgreed,
  type LegalDocType,
} from '../lib/storage'
import type { SystemStatus } from '../types'

export interface EnabledLegalDoc {
  docType: LegalDocType
  // 后台配置的协议名称；为空时由调用方回退到 i18n 默认名
  title: string
  // 当前协议内容的 SHA256（后端 GetStatus 暴露）
  hash: string
  // 全文页路径
  href: string
}

const DOC_DEFS: Array<{
  docType: LegalDocType
  enabledKey: string
  titleKey: string
  hashKey: string
  href: string
}> = [
  {
    docType: 'user_agreement',
    enabledKey: 'user_agreement_enabled',
    titleKey: 'user_agreement_title',
    hashKey: 'user_agreement_hash',
    href: '/user-agreement',
  },
  {
    docType: 'privacy_policy',
    enabledKey: 'privacy_policy_enabled',
    titleKey: 'privacy_policy_title',
    hashKey: 'privacy_policy_hash',
    href: '/privacy-policy',
  },
  {
    docType: 'cross_border_transfer',
    enabledKey: 'cross_border_transfer_enabled',
    titleKey: 'cross_border_transfer_title',
    hashKey: 'cross_border_transfer_hash',
    href: '/cross-border-transfer',
  },
]

export interface LegalGate {
  // 已启用的协议（含名称/hash/全文路径）
  enabledDocs: EnabledLegalDoc[]
  // 协议更新日期（后台手填，可空）
  updatedAt: string
  // 是否需要（重新）同意：任一启用协议的已存 hash ≠ 当前 hash
  needsConsent: boolean
  // 各启用协议当前 hash（docType -> hash），用于举证落库
  currentHashes: Record<string, string>
  // 把所有启用协议的当前 hash 写入 localStorage（同意后调用），解除门禁
  agreeAll: () => void
}

// 共用门禁逻辑：登录页 / 注册页统一使用。
// 仅依赖 SystemStatus（getStatus 已展平的 data）与 localStorage。
export function useLegalGate(status: SystemStatus | null): LegalGate {
  // 用于在 agreeAll 后强制重算 needsConsent
  const [tick, setTick] = useState(0)

  const enabledDocs = useMemo<EnabledLegalDoc[]>(() => {
    if (!status) return []
    const s = status as Record<string, unknown>
    return DOC_DEFS.filter((d) => Boolean(s[d.enabledKey])).map((d) => ({
      docType: d.docType,
      title: typeof s[d.titleKey] === 'string' ? (s[d.titleKey] as string) : '',
      hash: typeof s[d.hashKey] === 'string' ? (s[d.hashKey] as string) : '',
      href: d.href,
    }))
  }, [status])

  const currentHashes = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const doc of enabledDocs) {
      if (doc.hash) map[doc.docType] = doc.hash
    }
    return map
  }, [enabledDocs])

  const needsConsent = useMemo(() => {
    void tick
    if (enabledDocs.length === 0) return false
    const agreed = getAgreedLegalHashes()
    return enabledDocs.some((doc) => agreed[doc.docType] !== doc.hash)
  }, [enabledDocs, tick])

  const agreeAll = useCallback(() => {
    for (const doc of enabledDocs) {
      if (doc.hash) markAgreed(doc.docType, doc.hash)
    }
    setTick((n) => n + 1)
  }, [enabledDocs])

  const updatedAt =
    status && typeof (status as Record<string, unknown>).legal_updated_at === 'string'
      ? ((status as Record<string, unknown>).legal_updated_at as string)
      : ''

  return { enabledDocs, updatedAt, needsConsent, currentHashes, agreeAll }
}
