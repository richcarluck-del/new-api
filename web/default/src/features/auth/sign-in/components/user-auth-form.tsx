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
import { useEffect, useMemo, useRef, useState } from 'react'
import type { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { Loader2, LogIn, KeyRound, ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  buildAssertionResult,
  prepareCredentialRequestOptions,
  isPasskeySupported as detectPasskeySupport,
} from '@/lib/passkey'
import { cn } from '@/lib/utils'
import { useStatus } from '@/hooks/use-status'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/password-input'
import { Turnstile } from '@/components/turnstile'
import { login, recordConsent, wechatLoginByCode } from '@/features/auth/api'
import type { ConsentItem } from '@/features/auth/api'
import { LegalConsentDialog } from '@/features/auth/components/legal-consent-dialog'
import { OAuthProviders } from '@/features/auth/components/oauth-providers'
import { loginFormSchema } from '@/features/auth/constants'
import { useAuthRedirect } from '@/features/auth/hooks/use-auth-redirect'
import { useLegalGate } from '@/features/auth/hooks/use-legal-gate'
import { useTurnstile } from '@/features/auth/hooks/use-turnstile'
import { beginPasskeyLogin, finishPasskeyLogin } from '@/features/auth/passkey'
import type { AuthFormProps } from '@/features/auth/types'

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: AuthFormProps) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [wechatCode, setWeChatCode] = useState('')
  const [passkeySupported, setPasskeySupported] = useState(false)
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false)
  const [isWeChatDialogOpen, setIsWeChatDialogOpen] = useState(false)
  const [isWeChatSubmitting, setIsWeChatSubmitting] = useState(false)
  const [consentDialogOpen, setConsentDialogOpen] = useState(false)
  const [consentRejected, setConsentRejected] = useState(false)
  const loginFailedMessage = t('Login failed')

  const { status } = useStatus()
  const { enabledDocs, updatedAt, needsConsent, agreeAll } =
    useLegalGate(status)
  // 进页门禁：未同意最新协议时禁用全部输入与按钮
  const gated = needsConsent
  const gateMessage = t('同意最新条款前，无法输入账号密码或使用快捷登录')

  const passkeyLoginEnabled = Boolean(
    status?.passkey_login ?? status?.data?.passkey_login
  )
  const {
    isTurnstileEnabled,
    turnstileSiteKey,
    turnstileToken,
    setTurnstileToken,
    validateTurnstile,
  } = useTurnstile()
  const { handleLoginSuccess, redirectTo2FA } = useAuthRedirect()

  const passkeyButtonDisabled =
    isPasskeyLoading || !passkeySupported || gated
  const hasWeChatLogin = Boolean(status?.wechat_login)

  // 进页若需要同意，自动弹出同意框（仅首次）；拒绝后改为显示提示框
  const autoOpenedRef = useRef(false)
  useEffect(() => {
    if (gated && !autoOpenedRef.current) {
      autoOpenedRef.current = true
      setConsentDialogOpen(true)
    }
    if (!gated) {
      autoOpenedRef.current = false
      setConsentRejected(false)
    }
  }, [gated])

  useEffect(() => {
    detectPasskeySupport()
      .then(setPasskeySupported)
      .catch(() => setPasskeySupported(false))
  }, [])

  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  const wechatQrCodeUrl = useMemo(() => {
    return (
      status?.wechat_qrcode ||
      status?.wechat_qr_code ||
      status?.wechat_qrcode_image_url ||
      status?.wechat_qr_code_image_url ||
      status?.wechat_account_qrcode_image_url ||
      status?.WeChatAccountQRCodeImageURL ||
      status?.data?.wechat_qrcode ||
      status?.data?.WeChatAccountQRCodeImageURL ||
      ''
    )
  }, [status])

  // 登录成功后举证落库（后端按 user+doc+hash 去重）
  const recordConsentEvidence = () => {
    const consents: ConsentItem[] = enabledDocs
      .filter((d) => d.hash)
      .map((d) => ({ doc_type: d.docType, content_hash: d.hash }))
    if (consents.length > 0) {
      recordConsent(consents).catch(() => {
        /* 举证失败不阻塞登录 */
      })
    }
  }

  async function onSubmit(data: z.infer<typeof loginFormSchema>) {
    if (gated) {
      toast.warning(gateMessage)
      return
    }

    if (!validateTurnstile()) return

    setIsLoading(true)
    try {
      const res = await login({
        username: data.username,
        password: data.password,
        turnstile: turnstileToken,
      })

      if (res.success) {
        if (res.data?.require_2fa) {
          redirectTo2FA()
          return
        }

        recordConsentEvidence()
        await handleLoginSuccess(res.data as { id?: number } | null, redirectTo)
        toast.success(t('Welcome back!'))
      }
    } catch (_error) {
      // Errors are handled by global interceptor
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenWeChatDialog = () => {
    if (gated) {
      toast.warning(gateMessage)
      return
    }

    setIsWeChatDialogOpen(true)
  }

  const handleWeChatDialogChange = (open: boolean) => {
    setIsWeChatDialogOpen(open)
    if (!open) {
      setWeChatCode('')
      setIsWeChatSubmitting(false)
    }
  }

  async function handleWeChatLogin() {
    if (!wechatCode.trim()) {
      toast.error(t('Please enter the verification code'))
      return
    }

    setIsWeChatSubmitting(true)
    try {
      const res = await wechatLoginByCode(wechatCode)
      if (res?.success) {
        recordConsentEvidence()
        await handleLoginSuccess(res.data as { id?: number } | null, redirectTo)
        toast.success(t('Signed in via WeChat'))
        handleWeChatDialogChange(false)
      } else {
        toast.error(res?.message || loginFailedMessage)
      }
    } catch (_error) {
      toast.error(loginFailedMessage)
    } finally {
      setIsWeChatSubmitting(false)
    }
  }

  async function handlePasskeyLogin() {
    if (gated) {
      toast.warning(gateMessage)
      return
    }

    if (!passkeySupported) {
      toast.error(t('Passkey is not supported on this device'))
      return
    }

    if (!navigator?.credentials) {
      toast.error(t('Passkey is not available in this browser'))
      return
    }

    setIsPasskeyLoading(true)
    try {
      const begin = await beginPasskeyLogin()
      if (!begin.success) {
        throw new Error(begin.message || t('Failed to start Passkey login'))
      }

      const publicKey = prepareCredentialRequestOptions(
        begin.data?.options ?? begin.data
      )

      const credential = (await navigator.credentials.get({
        publicKey,
      })) as PublicKeyCredential | null

      if (!credential) {
        toast.info(t('Passkey login was cancelled'))
        return
      }

      const assertion = buildAssertionResult(credential)
      if (!assertion) {
        throw new Error(t('Invalid Passkey response'))
      }

      const finish = await finishPasskeyLogin(assertion)
      if (!finish.success) {
        throw new Error(finish.message || t('Failed to complete Passkey login'))
      }

      if (!finish.data) {
        throw new Error(t('Missing user data from Passkey login response'))
      }

      recordConsentEvidence()
      await handleLoginSuccess(
        finish.data as { id?: number } | null,
        redirectTo
      )
      toast.success(t('Signed in with Passkey'))
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        toast.info(t('Passkey login was cancelled or timed out'))
      } else if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error(t('Passkey login failed'))
      }
    } finally {
      setIsPasskeyLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-4', className)}
        {...props}
      >
        {/* Username Field */}
        <FormField
          control={form.control}
          name='username'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Username or Email')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('Enter your username or email')}
                  disabled={gated}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password Field */}
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem className='relative'>
              <FormLabel>{t('Password')}</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder={t('Enter password')}
                  disabled={gated}
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <Link
                to='/forgot-password'
                className='text-muted-foreground absolute end-0 -top-0.5 z-10 text-sm font-medium hover:opacity-75'
              >
                {t('Forgot password?')}
              </Link>
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button
          type='submit'
          className='mt-2 w-full justify-center gap-2'
          disabled={isLoading || gated}
        >
          {isLoading ? <Loader2 className='animate-spin' /> : <LogIn />}
          {t('Sign in')}
        </Button>

        {/* Turnstile */}
        {isTurnstileEnabled && (
          <div className='mt-2'>
            <Turnstile
              siteKey={turnstileSiteKey}
              onVerify={setTurnstileToken}
            />
          </div>
        )}

        {/* 门禁提示框：拒绝后显示 */}
        {gated && consentRejected && (
          <div className='mt-1 flex flex-col gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm'>
            <div className='flex items-start gap-2 text-emerald-700 dark:text-emerald-300'>
              <ShieldAlert className='mt-0.5 h-4 w-4 shrink-0' />
              <span>{t('继续登录前需要先同意最新条款，未同意前账号密码输入和快捷登录会保持禁用。')}</span>
            </div>
            <Button
              type='button'
              size='sm'
              className='self-end'
              onClick={() => setConsentDialogOpen(true)}
            >
              {t('查看条款')}
            </Button>
          </div>
        )}

        {passkeyLoginEnabled && (
          <div className='mt-2 space-y-1'>
            <Button
              type='button'
              variant='outline'
              disabled={passkeyButtonDisabled}
              onClick={handlePasskeyLogin}
              className='h-11 w-full justify-center gap-2 rounded-lg'
            >
              {isPasskeyLoading ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <KeyRound className='h-4 w-4' />
              )}
              {t('Sign in with Passkey')}
            </Button>
            {!passkeySupported && (
              <p className='text-muted-foreground text-xs'>
                {t('Passkey is not supported on this device.')}
              </p>
            )}
          </div>
        )}

        {/* OAuth Providers */}
        <OAuthProviders
          status={status}
          disabled={isLoading || gated}
          onWeChatLogin={hasWeChatLogin ? handleOpenWeChatDialog : undefined}
          isWeChatLoading={isWeChatSubmitting}
        />
      </form>

      <LegalConsentDialog
        open={consentDialogOpen}
        onOpenChange={setConsentDialogOpen}
        enabledDocs={enabledDocs}
        updatedAt={updatedAt}
        onAgree={agreeAll}
        onReject={() => {
          // 拒绝：维持门禁禁用态，弹 toast 强提示 + 显示提示框
          setConsentRejected(true)
          toast.warning(gateMessage)
        }}
      />

      {hasWeChatLogin && (
        <Dialog
          open={isWeChatDialogOpen}
          onOpenChange={handleWeChatDialogChange}
        >
          <DialogContent className='max-w-sm'>
            <DialogHeader className='text-left'>
              <DialogTitle>{t('WeChat sign in')}</DialogTitle>
              <DialogDescription>
                {t(
                  'Scan the QR code to follow the official account and reply with “验证码” to receive your verification code.'
                )}
              </DialogDescription>
            </DialogHeader>

            {wechatQrCodeUrl ? (
              <div className='flex justify-center'>
                <img
                  src={wechatQrCodeUrl}
                  alt={t('WeChat login QR code')}
                  className='h-40 w-40 rounded-md border object-contain'
                />
              </div>
            ) : (
              <p className='text-muted-foreground text-sm'>
                {t('QR code is not configured. Please contact support.')}
              </p>
            )}

            <div className='grid gap-2'>
              <Label htmlFor='wechat-code'>{t('Verification code')}</Label>
              <Input
                id='wechat-code'
                placeholder={t('Enter the verification code')}
                value={wechatCode}
                onChange={(event) => setWeChatCode(event.target.value)}
                autoComplete='one-time-code'
              />
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => handleWeChatDialogChange(false)}
                disabled={isWeChatSubmitting}
              >
                {t('Cancel')}
              </Button>
              <Button
                type='button'
                onClick={handleWeChatLogin}
                disabled={
                  isWeChatSubmitting || !wechatCode.trim() || gated
                }
                className='gap-2'
              >
                {isWeChatSubmitting ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : null}
                {t('Confirm')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Form>
  )
}
