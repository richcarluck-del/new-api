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
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  CreditCard,
  FileText,
  KeyRound,
  ListChecks,
  Play,
  RadioTower,
  TerminalSquare,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth-store'
import { ROLE } from '@/lib/roles'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  CardStaggerContainer,
  CardStaggerItem,
} from '@/components/page-transition'
import { getApiKeys } from '@/features/keys/api'
import type { ApiKey } from '@/features/keys/types'
import { AnnouncementsPanel } from './announcements-panel'
import { ApiInfoPanel } from './api-info-panel'
import { FAQPanel } from './faq-panel'
import { PerformanceHealthPanel } from './performance-health-panel'
import { SummaryCards } from './summary-cards'
import { UptimePanel } from './uptime-panel'

const SETUP_GUIDE_VISIBILITY_STORAGE_KEY =
  'dashboard_overview_setup_guide_expanded'

// Backdrop code pattern hidden per request — kept for potential restore.
/* const SETUP_GUIDE_CODE_PATTERN = [
  'const request = await client.responses.create({',
  "  model: 'gpt-4.1-mini',",
  "  input: 'Start routing traffic',",
  '})',
  '',
  'if (request.output_text) {',
  '  console.log(request.output_text)',
  '}',
].join('\n') */

type DashboardActionPath =
  | '/keys'
  | '/wallet'
  | '/playground'
  | '/channels'
  | '/usage-logs'
  | '/pricing'

interface StartStep {
  title: string
  description: string
  to: DashboardActionPath
  icon: LucideIcon
  completed: boolean
}

interface QuickAction {
  title: string
  description: string
  to: DashboardActionPath
  icon: LucideIcon
  adminOnly?: boolean
}

// Types for the hidden "First API request" preview — kept for potential restore.
/* interface RequestExample {
  endpoint: string
  model: string
  keyName: string
  displayKey: string
  curl: string
  ready: boolean
}

interface HeroSignal {
  label: string
  value: string
  icon: LucideIcon
} */

function getSavedSetupGuideExpanded(): boolean | null {
  if (typeof window === 'undefined') return null
  const saved = window.localStorage.getItem(SETUP_GUIDE_VISIBILITY_STORAGE_KEY)
  if (saved === 'expanded') return true
  if (saved === 'collapsed') return false
  return null
}

function saveSetupGuideExpanded(expanded: boolean): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    SETUP_GUIDE_VISIBILITY_STORAGE_KEY,
    expanded ? 'expanded' : 'collapsed'
  )
}

// Endpoint/curl helpers for the hidden "First API request" preview — kept for potential restore.
/* function getCurrentOrigin(): string {
  if (typeof window === 'undefined') return ''
  return window.location.origin
}

function normalizeEndpoint(sourceUrl?: string): string {
  const fallback = `${getCurrentOrigin()}/v1/chat/completions`
  const trimmed = sourceUrl?.trim()
  if (!trimmed) return fallback

  const withoutTrailingSlash = trimmed.replace(/\/+$/, '')
  if (withoutTrailingSlash.endsWith('/v1/chat/completions')) {
    return withoutTrailingSlash
  }
  if (withoutTrailingSlash.endsWith('/v1')) {
    return `${withoutTrailingSlash}/chat/completions`
  }
  return `${withoutTrailingSlash}/v1/chat/completions`
} */

function getPreferredKey(keys: ApiKey[]): ApiKey | null {
  return keys.find((item) => item.status === 1) ?? keys[0] ?? null
}

/* function formatDisplayKey(key?: string): string {
  if (!key) return 'sk-...'
  if (key.length <= 14) return key
  return `${key.slice(0, 7)}...${key.slice(-4)}`
}

function buildCurlCommand(args: {
  endpoint: string
  apiKey: string
  model: string
}): string {
  return [
    `curl ${args.endpoint} \\`,
    '  -H "Content-Type: application/json" \\',
    `  -H "Authorization: Bearer ${args.apiKey}" \\`,
    `  -d '{"model":"${args.model}","messages":[{"role":"user","content":"Say hello in one sentence."}]}'`,
  ].join('\n')
} */

function SetupGuideBackdrop(props: { compact?: boolean }) {
  return (
    <>
      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-muted/20',
          props.compact
            ? '[mask-image:linear-gradient(90deg,black_0%,black_48%,transparent_74%)] opacity-55'
            : 'opacity-85'
        )}
        aria-hidden='true'
      />
      <div
        className='from-background/35 to-background/70 dark:from-background/20 dark:to-background/80 pointer-events-none absolute inset-0 bg-linear-to-b via-transparent'
        aria-hidden='true'
      />
    </>
  )
}

function StartStepItem(props: {
  step: StartStep
  isLast: boolean
}) {
  const Icon = props.step.icon
  const StatusIcon = props.step.completed ? Check : Circle

  return (
    <li className='relative flex items-center gap-3 pb-2.5 last:pb-0'>
      {!props.isLast && (
        <span
          className='bg-border absolute top-9 bottom-0 left-4 w-px'
          aria-hidden='true'
        />
      )}
      <span
        className={cn(
          'bg-background relative z-10 flex size-8 shrink-0 items-center justify-center rounded-lg border',
          props.step.completed && 'border-success/30 bg-success/10'
        )}
      >
        <StatusIcon
          className={props.step.completed ? 'text-success size-4' : 'size-4'}
          aria-hidden='true'
        />
      </span>

      <Link
        to={props.step.to}
        className='hover:bg-muted/50 focus-visible:ring-ring flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors outline-none focus-visible:ring-2'
      >
        <span className='flex min-w-0 items-center gap-2.5'>
          <span className='bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-lg'>
            <Icon className='size-3.5' aria-hidden='true' />
          </span>
          <span className='flex min-w-0 flex-col gap-0.5'>
            <span className='flex items-center gap-2 text-sm font-medium'>
              <span className='truncate'>{props.step.title}</span>
            </span>
            {props.step.description && (
              <span className='text-muted-foreground line-clamp-1 text-xs'>
                {props.step.description}
              </span>
            )}
          </span>
        </span>
        <ArrowRight
          className='text-muted-foreground size-4 shrink-0'
          aria-hidden='true'
        />
      </Link>
    </li>
  )
}

// Used by the hidden "First API request" preview — kept for potential restore.
/* function RequestPreview(props: {
  example: RequestExample
  signals: HeroSignal[]
}) {
  const { t } = useTranslation()
  const shouldReduceMotion = useReducedMotion()
  const previewLines = props.example.curl.split('\n').map((line) => {
    if (line.includes('Authorization: Bearer')) {
      return `  -H "Authorization: Bearer ${props.example.displayKey}" \\`
    }
    return line
  })

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={MOTION_TRANSITION.slow}
      className='bg-muted/40 relative overflow-hidden rounded-xl p-3 backdrop-blur'
    >
      {!shouldReduceMotion && (
        <motion.div
          className='via-foreground/30 pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent to-transparent'
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden='true'
        />
      )}

      <div className='flex items-center justify-between gap-3 border-b pb-3'>
        <div className='flex min-w-0 items-center gap-2'>
          <span className='bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg'>
            <TerminalSquare className='size-4' aria-hidden='true' />
          </span>
          <div className='min-w-0'>
            <div className='truncate text-sm font-medium'>
              {t('First API request')}
            </div>
            <div className='text-muted-foreground truncate text-xs'>
              {props.example.ready
                ? props.example.keyName
                : t('Create an API key to unlock the real request')}
            </div>
          </div>
        </div>
        {props.example.ready ? (
          <CopyButton
            value={props.example.curl}
            variant='outline'
            size='sm'
            className='h-7 gap-1.5 px-2 text-xs'
            tooltip={t('Copy ready-to-run curl')}
            successTooltip={t('Copied!')}
            aria-label={t('Copy ready-to-run curl')}
          >
            {t('Copy')}
          </CopyButton>
        ) : (
          <Button size='sm' variant='outline' render={<Link to='/keys' />}>
            {t('Create API Key')}
          </Button>
        )}
      </div>

      <div className='bg-foreground/[0.035] my-3 rounded-xl p-3 font-mono text-xs'>
        <div className='mb-2 flex items-center gap-1.5'>
          <span className='bg-destructive size-2 rounded-full' />
          <span className='bg-warning size-2 rounded-full' />
          <span className='bg-success size-2 rounded-full' />
        </div>
        <div className='flex flex-col gap-1 overflow-hidden'>
          {previewLines.map((line, index) => (
            <code
              key={`${line}-${index}`}
              className='text-muted-foreground truncate'
              title={line}
            >
              {line}
            </code>
          ))}
        </div>
      </div>

      <div className='grid gap-2'>
        {props.signals.map((signal) => {
          const Icon = signal.icon

          return (
            <div
              key={signal.label}
              className='bg-muted/40 flex items-center justify-between gap-3 rounded-xl px-3 py-2'
            >
              <span className='flex min-w-0 items-center gap-2'>
                <Icon
                  className='text-muted-foreground size-3.5 shrink-0'
                  aria-hidden='true'
                />
                <span className='truncate text-xs font-medium'>
                  {signal.label}
                </span>
              </span>
              <span className='text-muted-foreground shrink-0 text-xs'>
                {signal.value}
              </span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
} */

// Used by the hidden "Recommended actions" panel — kept for potential restore.
/* function QuickActionItem(props: { action: QuickAction }) {
  const Icon = props.action.icon

  return (
    <Button
      variant='outline'
      className='h-auto justify-start rounded-xl px-3 py-3 text-left'
      render={<Link to={props.action.to} />}
    >
      <span className='bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg'>
        <Icon className='size-4' aria-hidden='true' />
      </span>
      <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
        <span className='truncate text-sm font-medium'>
          {props.action.title}
        </span>
        <span className='text-muted-foreground line-clamp-2 text-xs leading-relaxed'>
          {props.action.description}
        </span>
      </span>
    </Button>
  )
} */

function CompactQuickAction(props: { action: QuickAction }) {
  const Icon = props.action.icon

  return (
    <Button
      variant='outline'
      size='sm'
      className='bg-background/70 h-8 min-w-24 gap-1.5 px-2.5'
      render={<Link to={props.action.to} />}
    >
      <Icon data-icon='inline-start' />
      <span>{props.action.title}</span>
    </Button>
  )
}

export function OverviewDashboard() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.auth.user)
  const [manualSetupGuideExpanded, setManualSetupGuideExpanded] = useState<
    boolean | null
  >(() => getSavedSetupGuideExpanded())

  const requestCount = Number(user?.request_count ?? 0)
  const remainQuota = Number(user?.quota ?? 0)
  const usedQuota = Number(user?.used_quota ?? 0)
  const isAdmin = Boolean(user?.role && user.role >= ROLE.ADMIN)

  const apiKeysQuery = useQuery({
    queryKey: ['dashboard', 'overview', 'api-keys'],
    queryFn: async () => {
      const result = await getApiKeys({ p: 1, size: 10 })
      return result.success ? (result.data?.items ?? []) : []
    },
    staleTime: 60 * 1000,
  })

  const preferredKey = useMemo(
    () => getPreferredKey(apiKeysQuery.data ?? []),
    [apiKeysQuery.data]
  )

  const startSteps = useMemo<StartStep[]>(
    () => [
      {
        title: t('Step 1: Create an API key'),
        description: '',
        to: '/keys',
        icon: KeyRound,
        completed: Boolean(preferredKey),
      },
      {
        title: t('Step 2: Add credits'),
        description: '',
        to: '/wallet',
        icon: CreditCard,
        completed: remainQuota > 0 || usedQuota > 0,
      },
      {
        title: t('Step 3: Send a request and use the model'),
        description: '',
        to: '/playground',
        icon: TerminalSquare,
        completed: requestCount > 0,
      },
    ],
    [preferredKey, remainQuota, requestCount, t, usedQuota]
  )

  const quickActions = useMemo<QuickAction[]>(
    () => [
      {
        title: t('Playground'),
        description: t('Test models and prompts from the browser'),
        to: '/playground',
        icon: Play,
      },
      {
        title: t('Channels'),
        description: t('Configure upstream providers and routing.'),
        to: '/channels',
        icon: RadioTower,
        adminOnly: true,
      },
      {
        title: t('Usage Logs'),
        description: t('Inspect requests, errors, and billing details'),
        to: '/usage-logs',
        icon: FileText,
      },
      {
        title: t('Pricing'),
        description: t('Review model rates before scaling traffic'),
        to: '/pricing',
        icon: BookOpen,
      },
    ],
    [t]
  )

  const visibleQuickActions = useMemo(
    () => quickActions.filter((action) => !action.adminOnly || isAdmin),
    [isAdmin, quickActions]
  )

  // Hero signals + request example feed the hidden "First API request" preview — kept for potential restore.
  /* const heroSignals = useMemo<HeroSignal[]>(
    () => [
      {
        label: t('Route active'),
        value: apiInfoItems.length > 0 ? t('Online') : t('Current domain'),
        icon: RadioTower,
      },
      {
        label: t('Auth configured'),
        value: preferredKey ? t('Secured') : t('Needs API key'),
        icon: ShieldCheck,
      },
      {
        label: t('Model selected'),
        value: modelsQuery.data?.[0] ?? t('Loading'),
        icon: Timer,
      },
    ],
    [apiInfoItems.length, modelsQuery.data, preferredKey, t]
  )

  const requestExample = useMemo<RequestExample>(() => {
    const endpoint = normalizeEndpoint(apiInfoItems[0]?.url)
    const model = modelsQuery.data?.[0] ?? 'gpt-4o-mini'
    const apiKey = realKeyQuery.data ?? ''
    const keyName = preferredKey?.name ?? t('No API key yet')
    const ready = Boolean(apiKey && model)

    return {
      endpoint,
      model,
      keyName,
      displayKey: formatDisplayKey(apiKey),
      ready,
      curl: buildCurlCommand({
        endpoint,
        apiKey: apiKey || 'sk-...',
        model,
      }),
    }
  }, [apiInfoItems, modelsQuery.data, preferredKey, realKeyQuery.data, t]) */

  const completedStepCount = startSteps.filter((step) => step.completed).length
  const setupComplete = completedStepCount === startSteps.length
  const setupGuideExpanded = manualSetupGuideExpanded ?? !setupComplete

  const handleSetupGuideToggle = () => {
    const nextExpanded = !setupGuideExpanded
    setManualSetupGuideExpanded(nextExpanded)
    saveSetupGuideExpanded(nextExpanded)
  }

  return (
    <div className='flex flex-col gap-4'>
      {setupGuideExpanded ? (
        <CardStaggerContainer className='grid items-stretch gap-4'>
          <CardStaggerItem className='bg-card h-full w-2/3 overflow-hidden rounded-2xl border border-border/60'>
            <div className='relative h-full overflow-hidden p-5 sm:p-6'>
              <SetupGuideBackdrop />
              <div className='relative grid grid-cols-1 gap-5'>
                <div className='flex min-w-0 flex-col gap-5'>
                  <div className='flex flex-wrap items-start justify-between gap-3'>
                    <div className='flex max-w-2xl flex-col gap-1'>
                      <div className='flex items-center gap-2'>
                        <h3 className='flex items-center gap-2 text-lg font-semibold tracking-tight sm:text-xl'>
                          <ListChecks
                            className='text-primary size-5'
                            aria-hidden='true'
                          />
                          {t('Beginner guide')}
                        </h3>
                        <span className='text-muted-foreground bg-background/60 rounded-md border px-2 py-0.5 text-xs'>
                          {t('Setup progress: {{completed}}/{{total}}', {
                            completed: completedStepCount,
                            total: startSteps.length,
                          })}
                        </span>
                      </div>
                      {/* Subtitle and description hidden per request — may restore later */}
                      {/* <h3 className='text-xl font-semibold tracking-tight sm:text-2xl'>
                        {t('Build on your API gateway in minutes')}
                      </h3>
                      <p className='text-muted-foreground max-w-xl text-sm leading-relaxed'>
                        {t(
                          'A focused home for keys, balance, routing, and service health.'
                        )}
                      </p> */}
                    </div>
                    <div className='flex flex-wrap items-center gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={handleSetupGuideToggle}
                      >
                        <ChevronUp data-icon='inline-start' />
                        {t('Hide setup guide')}
                      </Button>
                      <Button size='sm' render={<Link to='/keys' />}>
                        <KeyRound data-icon='inline-start' />
                        {t('Create API Key')}
                      </Button>
                    </div>
                  </div>

                  <ol className='flex flex-col'>
                    {startSteps.map((step, index) => (
                      <StartStepItem
                        key={step.title}
                        step={step}
                        isLast={index === startSteps.length - 1}
                      />
                    ))}
                  </ol>
                </div>

                {/* First API request preview hidden per request — may restore later */}
                {/* <RequestPreview
                  example={requestExample}
                  signals={heroSignals}
                /> */}
              </div>
            </div>
          </CardStaggerItem>

          {/* Recommended actions panel hidden per request — may restore later */}
          {/* <CardStaggerItem className='bg-card h-full rounded-2xl border border-border/60 p-5 sm:p-6'>
            <div className='flex h-full flex-col gap-4'>
              <div className='flex flex-col gap-1'>
                <div className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
                  {t('Recommended actions')}
                </div>
                <h3 className='text-lg font-semibold tracking-tight'>
                  {t('Keep the platform ready')}
                </h3>
              </div>
              <div className='grid gap-2'>
                {visibleQuickActions.map((action) => (
                  <QuickActionItem key={action.title} action={action} />
                ))}
              </div>
            </div>
          </CardStaggerItem> */}
        </CardStaggerContainer>
      ) : (
        <CardStaggerContainer>
          <CardStaggerItem className='bg-card overflow-hidden rounded-2xl border border-border/60'>
            <div className='relative overflow-hidden px-4 py-3 sm:px-5'>
              <SetupGuideBackdrop compact />
              <div className='relative flex flex-wrap items-center justify-between gap-3'>
                <div className='flex min-w-0 items-center gap-3'>
                  <span className='bg-background flex size-9 shrink-0 items-center justify-center rounded-lg border border-border'>
                    <Check className='text-success size-4' aria-hidden='true' />
                  </span>
                  <div className='min-w-0'>
                    <div className='flex items-center gap-2'>
                      <h3 className='truncate text-sm font-semibold'>
                        {setupComplete
                          ? t('Setup guide complete')
                          : t('Setup guide')}
                      </h3>
                      <span className='text-muted-foreground bg-background/60 rounded-md border px-2 py-0.5 text-xs'>
                        {t('Setup progress: {{completed}}/{{total}}', {
                          completed: completedStepCount,
                          total: startSteps.length,
                        })}
                      </span>
                    </div>
                    <p className='text-muted-foreground line-clamp-1 text-xs'>
                      {setupComplete
                        ? t(
                            'Your setup guide is collapsed so usage stays in focus.'
                          )
                        : t('Setup guide is collapsed. Expand it anytime.')}
                    </p>
                  </div>
                </div>

                <div className='flex flex-wrap items-center gap-2'>
                  {visibleQuickActions.map((action) => (
                    <CompactQuickAction key={action.title} action={action} />
                  ))}
                  <Button
                    variant='outline'
                    size='sm'
                    className='bg-background/70 h-8 min-w-28'
                    onClick={handleSetupGuideToggle}
                  >
                    <ChevronDown data-icon='inline-start' />
                    {t('Show setup guide')}
                  </Button>
                </div>
              </div>
            </div>
          </CardStaggerItem>
        </CardStaggerContainer>
      )}

      <SummaryCards />

      <CardStaggerContainer className='grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]'>
        <div className='grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2'>
          {isAdmin && (
            <CardStaggerItem className='lg:col-span-2'>
              <PerformanceHealthPanel />
            </CardStaggerItem>
          )}
          {isAdmin && (
            <CardStaggerItem>
              <ApiInfoPanel />
            </CardStaggerItem>
          )}
          <CardStaggerItem>
            <AnnouncementsPanel />
          </CardStaggerItem>
          <CardStaggerItem>
            <FAQPanel />
          </CardStaggerItem>
        </div>
        {isAdmin && (
          <CardStaggerItem>
            <UptimePanel />
          </CardStaggerItem>
        )}
      </CardStaggerContainer>
    </div>
  )
}
