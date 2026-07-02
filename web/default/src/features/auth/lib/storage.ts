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
/**
 * Utilities for managing authentication-related browser storage
 */

// ============================================================================
// LocalStorage Keys
// ============================================================================

const STORAGE_KEYS = {
  USER_ID: 'uid',
  AFFILIATE: 'aff',
  STATUS: 'status',
} as const

// ============================================================================
// User ID Storage
// ============================================================================

/**
 * Save user ID to localStorage
 */
export function saveUserId(userId: number | string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEYS.USER_ID, String(userId))
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to save user ID:', error)
  }
}

/**
 * Get user ID from localStorage
 */
export function getUserId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(STORAGE_KEYS.USER_ID)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to get user ID:', error)
    return null
  }
}

/**
 * Remove user ID from localStorage
 */
export function removeUserId(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEYS.USER_ID)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to remove user ID:', error)
  }
}

// ============================================================================
// Affiliate Code Storage
// ============================================================================

/**
 * Get affiliate code from localStorage
 */
export function getAffiliateCode(): string {
  if (typeof window === 'undefined') return ''
  try {
    return window.localStorage.getItem(STORAGE_KEYS.AFFILIATE) ?? ''
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to get affiliate code:', error)
    return ''
  }
}

/**
 * Save affiliate code to localStorage
 */
export function saveAffiliateCode(code: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEYS.AFFILIATE, code)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to save affiliate code:', error)
  }
}

// ============================================================================
// Legal Consent Storage
// ============================================================================

// 已同意的协议内容 hash 按 docType 存储。键名固定，避免与其它存储冲突。
const LEGAL_CONSENT_KEY = 'legal_consent_hashes'

export type LegalDocType =
  | 'user_agreement'
  | 'privacy_policy'
  | 'cross_border_transfer'

/**
 * 读取已同意的各协议内容 hash（docType -> hash）。
 */
export function getAgreedLegalHashes(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(LEGAL_CONSENT_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

/**
 * 记录某协议已同意的内容 hash（同意/更新后调用）。
 */
export function markAgreed(docType: LegalDocType, hash: string): void {
  if (typeof window === 'undefined' || !hash) return
  try {
    const current = getAgreedLegalHashes()
    current[docType] = hash
    window.localStorage.setItem(LEGAL_CONSENT_KEY, JSON.stringify(current))
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to mark legal consent:', error)
  }
}
