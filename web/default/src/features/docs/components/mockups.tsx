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
import {
  ArrowUp,
  Bot,
  Box,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Copy,
  EyeOff,
  Filter,
  Info,
  Link2,
  ListFilter,
  Mic,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Share2,
  Square,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { API_BASE_URL } from '../data'

// 还原 Cursor「设置」里的面板（对方也是 HTML 还原，非截图）。键名对应 data.ts 的 { type:'mockup', name }。

function GreenToggle({ on }: { on?: boolean }) {
  return (
    <span
      className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors ${on ? 'justify-end bg-emerald-500' : 'bg-muted-foreground/30 justify-start'}`}
    >
      <span className='size-5 rounded-full bg-white shadow' />
    </span>
  )
}

// 绿色边框输入框（Cursor 风格）
function GreenInput({ children }: { children: React.ReactNode }) {
  return (
    <div className='rounded-lg border border-emerald-400/70 bg-emerald-50/40 px-3 py-2 font-mono text-sm dark:bg-emerald-950/20'>
      {children}
    </div>
  )
}

function PanelCard({ children }: { children: React.ReactNode }) {
  return (
    <div className='bg-card rounded-xl border p-5 shadow-sm'>{children}</div>
  )
}

// 面板一：Network 容器 + HTTP Compatibility Mode 子项（右侧下拉框，当前 HTTP/1.1）
function CursorNetworkMockup() {
  return (
    <PanelCard>
      <p className='mb-4 font-semibold'>Network</p>
      <div className='bg-muted/40 rounded-xl p-4'>
        <div className='flex items-start justify-between gap-4'>
          <div className='space-y-1'>
            <p className='text-sm font-semibold'>HTTP Compatibility Mode</p>
            <p className='text-muted-foreground text-sm leading-relaxed'>
              HTTP/2 is recommended for low-latency streaming. In some corporate
              proxy and VPN environments, the compatibility mode may need to be
              lowered.
            </p>
          </div>
          <span className='inline-flex shrink-0 items-center gap-2 rounded-lg border border-emerald-400/70 px-3 py-1.5 text-sm'>
            HTTP/1.1
            <ChevronDown className='size-4' />
          </span>
        </div>
      </div>
    </PanelCard>
  )
}

// 面板二：API Keys（含 OpenAI API Key + Override OpenAI Base URL 两个子项）
function CursorApiKeysMockup() {
  return (
    <PanelCard>
      <div className='mb-4 flex items-center gap-1.5'>
        <ChevronDown className='text-muted-foreground size-4' />
        <span className='font-semibold'>API Keys</span>
      </div>
      <div className='space-y-3'>
        {/* OpenAI API Key */}
        <div className='bg-muted/40 space-y-2 rounded-xl p-4'>
          <div className='flex items-center justify-between gap-4'>
            <span className='text-sm font-semibold'>OpenAI API Key</span>
            <GreenToggle on />
          </div>
          <p className='text-muted-foreground text-sm'>
            You can put in your OpenAI key to use OpenAI models at cost.
          </p>
          <GreenInput>你的API Key</GreenInput>
        </div>
        {/* Override OpenAI Base URL */}
        <div className='bg-muted/40 space-y-2 rounded-xl p-4'>
          <div className='flex items-center justify-between gap-4'>
            <span className='text-sm font-semibold'>
              Override OpenAI Base URL
            </span>
            <GreenToggle on />
          </div>
          <p className='text-muted-foreground text-sm'>
            Change the base URL for OpenAI API requests.
          </p>
          <GreenInput>{API_BASE_URL}/v1</GreenInput>
        </div>
      </div>
    </PanelCard>
  )
}

// TRAE 风格小开关：on=emerald 滑到右，off=zinc 停在左
function TraeSwitch({ on }: { on?: boolean }) {
  return (
    <div
      className={`relative h-6 w-11 shrink-0 rounded-full ${on ? 'bg-emerald-500' : 'bg-zinc-600'}`}
    >
      <div
        className='absolute top-0.5 size-5 rounded-full bg-white shadow-sm'
        style={{ left: on ? 20 : 2 }}
      />
    </div>
  )
}

// 禁用态字段框（灰底灰字）
function TraeDisabledField({ children }: { children: React.ReactNode }) {
  return (
    <div className='truncate rounded-lg border border-zinc-300 bg-zinc-200 px-3 py-2.5 text-sm font-medium text-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-400'>
      {children}
    </div>
  )
}

// 必填星号标签
function TraeFieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className='text-sm font-bold text-zinc-800 dark:text-zinc-200'>
      <span className='text-red-500'>*</span> {children}
    </div>
  )
}

// 面板三：TRAE SOLO「添加模型」弹窗（按竞品真实 DOM 高仿）
function TraeAddModelMockup({
  apiFormat = 'OpenAI Chat Completions 格式',
  baseUrl = `${API_BASE_URL}/v1`,
  hintFormat = 'OpenAI Chat Completions 格式',
  hintPath = '/chat/completions',
  model = 'gpt-5.4',
}: {
  apiFormat?: string
  baseUrl?: string
  hintFormat?: string
  hintPath?: string
  model?: string
}) {
  return (
    <div className='mx-auto max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900'>
      {/* 弹窗标题栏 */}
      <div className='flex items-center justify-between px-5 py-4'>
        <div className='text-lg font-bold text-zinc-900 dark:text-zinc-100'>
          添加模型
        </div>
        <X className='size-5 text-zinc-600 dark:text-zinc-400' />
      </div>

      {/* 灰底内容区 */}
      <div className='bg-zinc-100 px-5 py-3 dark:bg-zinc-800/60'>
        <div className='rounded-lg border border-zinc-200 bg-zinc-200/70 dark:border-zinc-700 dark:bg-zinc-800'>
          {/* 自定义配置 头 */}
          <div className='flex items-center gap-3 border-b border-zinc-300/70 px-4 py-3 dark:border-zinc-700'>
            <div className='flex size-8 items-center justify-center rounded-md bg-white text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'>
              <Box className='size-5' />
            </div>
            <div className='text-base font-bold text-zinc-800 dark:text-zinc-200'>
              自定义配置
            </div>
            <ChevronUp className='ml-auto size-4 text-zinc-600 dark:text-zinc-400' />
          </div>

          {/* 表单字段 */}
          <div className='space-y-5 px-4 py-5'>
            {/* API 格式 */}
            <div className='space-y-2'>
              <TraeFieldLabel>API 格式</TraeFieldLabel>
              <TraeDisabledField>{apiFormat}</TraeDisabledField>
            </div>

            {/* 自定义请求地址 */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between gap-3'>
                <TraeFieldLabel>自定义请求地址</TraeFieldLabel>
                <div className='flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200'>
                  <Link2 className='size-4' />
                  完整 URL
                  <TraeSwitch />
                </div>
              </div>
              <div className='truncate rounded-lg border border-blue-300 bg-blue-50/40 px-3 py-2.5 text-sm font-medium text-zinc-900 dark:border-blue-700 dark:bg-blue-950/30 dark:text-zinc-100'>
                {baseUrl}
              </div>
              <div className='rounded-lg border border-blue-200 bg-blue-50 px-3 py-3 text-sm leading-relaxed text-zinc-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-zinc-300'>
                请填写兼容{hintFormat} 的服务端点地址，不要以斜杠结尾。{hintPath} 将会被补充到你填写的地址末尾。
              </div>
            </div>

            {/* 模型 ID */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <TraeFieldLabel>模型 ID</TraeFieldLabel>
                <div className='flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200'>
                  多模态
                  <TraeSwitch on />
                </div>
              </div>
              <TraeDisabledField>{model}</TraeDisabledField>
            </div>

            {/* API 密钥 */}
            <div className='space-y-2'>
              <TraeFieldLabel>API 密钥</TraeFieldLabel>
              <TraeDisabledField>你的API Key</TraeDisabledField>
            </div>

            {/* 底部按钮 */}
            <div className='flex justify-end gap-3 pt-2'>
              <div className='rounded-lg bg-zinc-300 px-6 py-2 text-sm font-bold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200'>
                取消
              </div>
              <div className='rounded-lg bg-zinc-900 px-6 py-2 text-sm font-bold text-white dark:bg-zinc-100 dark:text-zinc-900'>
                提交
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 面板四：TRAE SOLO 对话验证界面（按竞品真实 DOM 高仿）
function TraeChatMockup({ model = 'gpt-5.4' }: { model?: string }) {
  return (
    <div className='mx-auto max-w-3xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900'>
      <div className='space-y-6 px-5 py-5'>
        {/* 用户消息（右对齐） */}
        <div className='flex justify-end'>
          <div className='rounded-xl bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'>
            hi
          </div>
        </div>

        {/* 助手回复区 */}
        <div className='space-y-4'>
          {/* SOLO MTC 标题行 */}
          <div className='flex items-center gap-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300'>
            <span className='flex size-6 items-center justify-center rounded-md bg-violet-500 text-white'>
              <Bot className='size-4' />
            </span>
            SOLO MTC
          </div>

          {/* 大字回复 */}
          <div className='text-lg font-medium text-zinc-900 dark:text-zinc-100'>
            Hi! How can I help you today?
          </div>

          {/* 任务完成 */}
          <div className='flex items-center gap-2 text-sm font-bold text-zinc-500 dark:text-zinc-400'>
            <span className='flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white'>
              <Check className='size-3.5' />
            </span>
            任务完成
          </div>

          {/* 蓝边任务卡片 */}
          <div className='rounded-2xl border border-blue-100 px-4 py-4 shadow-sm dark:border-blue-900/50'>
            <div className='min-h-20 text-sm text-zinc-400'>
              帮你整理论文综述、编写 PPT、分析 Excel 等日常工作，输出专业级工作成果。
            </div>
            <div className='flex items-center justify-between pt-3'>
              {/* 左侧工具图标 */}
              <div className='flex gap-3 text-zinc-600 dark:text-zinc-400'>
                <Square className='size-5' />
                <Mic className='size-5' />
              </div>
              {/* 右侧模型选择 + 发送 */}
              <div className='flex items-center gap-3'>
                <div className='text-sm font-medium text-zinc-900 dark:text-zinc-100'>
                  {model}
                </div>
                <ChevronDown className='size-4 text-zinc-600 dark:text-zinc-400' />
                <div className='flex size-9 items-center justify-center rounded-lg bg-violet-100 text-violet-500 dark:bg-violet-500/20'>
                  <ArrowUp className='size-5' />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Claude Code 终端启动画面的像素 logo（8×7，O=橙 X=黑眼）
const CC_LOGO = [
  '..OOOO..',
  '.OOOOOO.',
  'OOXOOXOO',
  'OOOOOOOO',
  '.OOOOOO.',
  'O.OOOO.O',
  'O..OO..O',
]

function ClaudeCodePixelLogo() {
  return (
    <div
      className='inline-grid'
      style={{ gridTemplateColumns: 'repeat(8,6px)', gap: 0 }}
    >
      {CC_LOGO.flatMap((row, r) =>
        row.split('').map((c, i) => (
          <div
            key={`${r}-${i}`}
            style={{
              width: 6,
              height: 6,
              backgroundColor:
                c === 'O'
                  ? 'rgb(194,113,79)'
                  : c === 'X'
                    ? 'rgb(26,26,26)'
                    : 'transparent',
            }}
          />
        ))
      )}
    </div>
  )
}

// 面板五：Claude Code 终端启动画面（按竞品真实 DOM 高仿）
function ClaudeCodeTerminalMockup({ model = 'gpt-5.4' }: { model?: string }) {
  return (
    <div className='mx-auto max-w-2xl overflow-hidden rounded-xl border border-[#d7d7d7] bg-white font-mono text-[12px] leading-relaxed text-[#1a1a1a] shadow-sm'>
      {/* mac 窗口红绿灯 */}
      <div className='flex items-center gap-2 border-b border-[#eaedf1] px-4 py-2.5'>
        <span className='size-3 rounded-full bg-[#ff5f57]' />
        <span className='size-3 rounded-full bg-[#febc2e]' />
        <span className='size-3 rounded-full bg-[#28c840]' />
      </div>

      <div className='p-5'>
        {/* 提示符行 */}
        <div className='flex items-center gap-1.5 text-[#555]'>
          <span>🍎</span>
          <span>🏠</span>
          <span className='text-[#888]'>~</span>
          <span className='text-[#888]'>&gt;</span>
          <span className='font-semibold text-[#1a1a1a]'>claude</span>
        </div>

        {/* Claude Code vX 分隔线 */}
        <div className='mt-3 flex items-center gap-2 text-[#888]'>
          <span className='flex-1 border-t border-dashed border-[#c7bdb4]' />
          <span className='text-[#c0724a]'>Claude Code</span>
          <span>v2.1.118</span>
          <span className='flex-1 border-t border-dashed border-[#c7bdb4]' />
        </div>

        {/* Welcome 双栏框 */}
        <div className='mt-3 grid grid-cols-[1fr_1fr] rounded border border-dashed border-[#c0724a]'>
          {/* 左：Welcome + 像素 logo + 账号信息 */}
          <div className='flex flex-col items-center justify-center border-r border-dashed border-[#c0724a] p-5'>
            <div className='text-[13px] font-bold'>Welcome back!</div>
            <div className='mt-4'>
              <ClaudeCodePixelLogo />
            </div>
            <div className='mt-4 text-center'>
              <div className='font-semibold'>{model} · API Usage Billing</div>
              <div className='text-[#888]'>/root</div>
            </div>
          </div>
          {/* 右：Tips + Recent activity */}
          <div className='space-y-3 p-5'>
            <div className='space-y-1'>
              <div className='font-semibold text-[#c0724a]'>
                Tips for getting started
              </div>
              <div className='text-[#555]'>
                Run /init to create a CLAUDE.md file with instructions for Claude
              </div>
              <div className='text-[#555]'>
                Note: You have launched claude in your home directory. For the
                best experience, launch it in a project d...
              </div>
            </div>
            <div className='border-t border-dashed border-[#c7bdb4]' />
            <div className='space-y-1'>
              <div className='font-semibold text-[#c0724a]'>Recent activity</div>
              <div className='text-[#888]'>No recent activity</div>
            </div>
          </div>
        </div>

        {/* Using model */}
        <div className='mt-4 text-[#888]'>
          Using {model}{' '}
          <span>(from .claude/settings.json) · /model to change</span>
        </div>

        {/* 对话 */}
        <div className='mt-4 space-y-2'>
          <div className='flex gap-2'>
            <span className='text-[#c0724a]'>❯</span>
            <span>hi</span>
          </div>
          <div className='flex gap-2'>
            <span className='text-[#c0724a]'>●</span>
            <span>Hey! What can I help you with?</span>
          </div>
          <div className='flex gap-2 text-[#888]'>
            <span className='text-[#c0724a]'>❯</span>
            <span>? for shortcuts</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// 面板六：OpenCode 终端欢迎界面（按竞品真实 DOM 高仿）
function OpenCodeTerminalMockup({ model = 'gpt-5.4' }: { model?: string }) {
  return (
    <div className='mx-auto max-w-2xl overflow-hidden rounded-xl border border-[#2a2a3c] font-mono text-[12px] leading-relaxed'>
      {/* 标题栏：红绿灯 + opencode */}
      <div className='flex items-center justify-between border-b border-[#2a2a3c] bg-[#1e1e2e] px-4 py-2'>
        <div className='flex items-center gap-2'>
          <span className='size-3 rounded-full bg-[#ff5f57]' />
          <span className='size-3 rounded-full bg-[#febc2e]' />
          <span className='size-3 rounded-full bg-[#28c840]' />
        </div>
        <span className='text-[13px] font-medium text-[#cdd6f4]'>opencode</span>
        <div className='w-[52px]' />
      </div>

      {/* 头部：欢迎语 + token 用量 */}
      <div className='flex items-start justify-between border-b border-[#2a2a3c] bg-[#181825] px-5 py-3'>
        <div>
          <div className='text-[13px] font-bold text-[#cdd6f4]'>
            # Welcome to OpenCode
          </div>
          <div className='mt-0.5 text-[11px] text-[#6c7086]'>
            /share to create a shareable link
          </div>
        </div>
        <div className='ml-4 whitespace-nowrap text-[11px] text-[#6c7086]'>
          1.2K/2% ($0.01)
        </div>
      </div>

      {/* 正文 */}
      <div className='bg-[#11111b] px-5 py-5 text-[12px] leading-[1.7] text-[#cdd6f4]'>
        <p>
          Hi! I'm your AI coding assistant. I can help you with a variety of
          programming tasks right from your terminal.
        </p>
        <p className='mt-4 font-semibold text-[#a6e3a1]'>## What I can do</p>
        <ul className='mt-2 space-y-1 text-[#bac2de]'>
          <li>
            -{' '}
            <span className='font-bold text-[#cdd6f4]'>Read &amp; edit files</span>
            : Navigate and modify your codebase
          </li>
          <li>
            - <span className='font-bold text-[#cdd6f4]'>Run commands</span>:
            Execute shell commands and review output
          </li>
          <li>
            - <span className='font-bold text-[#cdd6f4]'>Answer questions</span>:
            Explain code, debug issues, suggest improvements
          </li>
        </ul>
        <p className='mt-4 text-[#bac2de]'>
          Type a message below to get started.
        </p>
      </div>

      {/* 输入行 */}
      <div className='border-t border-[#2a2a3c] bg-[#181825] px-5 py-3'>
        <div className='flex items-center gap-2 text-[13px] text-[#6c7086]'>
          <span>&gt;</span>
          <span className='inline-block h-[15px] w-[8px] animate-pulse rounded-sm bg-[#fab387]' />
        </div>
      </div>

      {/* 状态行一：enter send / 渠道·模型 */}
      <div className='flex items-center justify-between border-t border-[#2a2a3c] bg-[#181825] px-5 py-1.5 text-[11px] text-[#6c7086]'>
        <span>enter send</span>
        <span>shunfeng&nbsp;&nbsp;{model}</span>
      </div>

      {/* 状态行二：版本 / 模式 */}
      <div className='flex items-center justify-between border-t border-[#2a2a3c] bg-[#1e1e2e] px-5 py-1 text-[10px] text-[#585b70]'>
        <div className='flex items-center gap-4'>
          <span>opencode v0.3.133</span>
          <span>~/logs</span>
        </div>
        <div className='flex items-center gap-4'>
          <span>tab</span>
          <span>BUILD MODE</span>
        </div>
      </div>
    </div>
  )
}

// 面板七：Cherry Studio「添加供应商」弹窗（按竞品真实 DOM 高仿）
function CherryAddProviderMockup({
  providerType = 'OpenAI',
}: {
  providerType?: string
}) {
  return (
    <div className='mx-auto max-w-xs overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900'>
      <div className='border-b border-zinc-100 px-5 pb-3 pt-5 dark:border-zinc-800'>
        <div className='text-base font-semibold text-zinc-800 dark:text-zinc-100'>
          添加供应商
        </div>
      </div>
      <div className='space-y-5 px-5 py-5'>
        <div className='flex justify-center'>
          <div className='flex size-16 items-center justify-center rounded-full bg-zinc-700 text-2xl font-bold text-white'>
            S
          </div>
        </div>
        <div className='space-y-1.5'>
          <div className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
            提供商名称
          </div>
          <div className='rounded-lg border-2 border-emerald-500 bg-white px-3 py-2 text-sm text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'>
            shunfeng
          </div>
        </div>
        <div className='space-y-1.5'>
          <div className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
            提供商类型
          </div>
          <div className='flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100'>
            <span>{providerType}</span>
            <ChevronDown className='size-4 text-zinc-400' />
          </div>
        </div>
      </div>
      <div className='flex justify-end gap-3 px-5 pb-5'>
        <div className='rounded-lg border border-zinc-200 px-5 py-1.5 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300'>
          取 消
        </div>
        <div className='rounded-lg bg-emerald-600 px-5 py-1.5 text-sm font-medium text-white'>
          确 定
        </div>
      </div>
    </div>
  )
}

// 面板八：Cherry Studio API 配置面板（API 密钥 + API 地址 + 模型，按竞品真实 DOM 高仿）
function CherryApiConfigMockup({
  baseUrl = `${API_BASE_URL}/codex/v1`,
  preview = '/chat/completions',
}: {
  baseUrl?: string
  preview?: string
}) {
  return (
    <div className='mx-auto max-w-sm overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900'>
      <div className='space-y-6 px-5 py-5'>
        {/* API 密钥 */}
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <div className='text-sm font-bold text-zinc-800 dark:text-zinc-100'>
              API 密钥
            </div>
            <MoreVertical className='size-4 text-zinc-400' />
          </div>
          <div className='flex items-center gap-2'>
            <div className='flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800'>
              你的API Key
            </div>
            <EyeOff className='size-4 shrink-0 text-zinc-400' />
            <div className='shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300'>
              检 测
            </div>
          </div>
          <div className='text-right text-xs text-zinc-400'>
            多个密钥使用逗号分隔
          </div>
        </div>
        {/* API 地址 */}
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-1.5'>
              <span className='text-sm font-bold text-zinc-800 dark:text-zinc-100'>
                API 地址
              </span>
              <Info className='size-3.5 text-zinc-400' />
            </div>
            <MoreVertical className='size-4 text-zinc-400' />
          </div>
          <div className='rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800'>
            {baseUrl}
          </div>
          <div className='text-xs text-zinc-400'>预览：{preview}</div>
        </div>
        {/* 模型 */}
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <span className='text-sm font-bold text-zinc-800 dark:text-zinc-100'>
              模型
            </span>
            <span className='rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800'>
              0
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-300'>
              <RefreshCw className='size-3.5' />
              获取模型列表
            </div>
            <div className='flex size-7 items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 dark:border-zinc-700'>
              <Plus className='size-3.5' />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 面板九：Cherry Studio 模型列表弹窗（按竞品真实 DOM 高仿）
function CherryModelListMockup({
  model = 'gpt-5.4',
  badge = 'G',
  badgeColor = 'bg-emerald-500',
}: {
  model?: string
  badge?: string
  badgeColor?: string
}) {
  const filters = ['全部', '推理', '视觉', '联网', '免费', '嵌入', '重排', '工具']
  return (
    <div className='mx-auto max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900'>
      <div className='flex items-center justify-between px-5 pb-3 pt-4'>
        <div className='text-base font-bold text-zinc-800 dark:text-zinc-100'>
          shunfeng模型
        </div>
        <X className='size-4 text-zinc-400' />
      </div>
      <div className='px-5 pb-3'>
        <div className='flex items-center gap-2'>
          <div className='flex flex-1 items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700'>
            <Search className='size-4 text-zinc-400' />
            <span className='text-sm text-zinc-400'>搜索模型 ID 或名称</span>
          </div>
          <div className='flex size-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700'>
            <Filter className='size-4 text-zinc-500' />
          </div>
          <div className='flex size-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700'>
            <RefreshCw className='size-4 text-zinc-500' />
          </div>
        </div>
      </div>
      <div className='flex gap-4 overflow-x-auto border-b border-zinc-100 px-5 pb-2 dark:border-zinc-800'>
        {filters.map((f, i) => (
          <span
            key={f}
            className={`shrink-0 pb-2 text-sm ${i === 0 ? 'border-b-2 border-emerald-500 font-medium text-emerald-600' : 'text-zinc-500'}`}
          >
            {f}
          </span>
        ))}
      </div>
      <div className='flex items-center justify-between bg-zinc-50 px-5 py-2.5 dark:bg-zinc-800/60'>
        <div className='flex items-center gap-2'>
          <ChevronDown className='size-3.5 text-zinc-400' />
          <span className='max-w-[240px] truncate font-mono text-xs text-zinc-600 dark:text-zinc-300'>
            abcf02ec-c12d-4333-b5ba-ba6ef9d40f20
          </span>
          <span className='rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:bg-emerald-950/40'>
            1
          </span>
        </div>
        <Plus className='size-3.5 text-zinc-400' />
      </div>
      <div className='flex items-center gap-3 px-5 py-3'>
        <div
          className={`flex size-8 shrink-0 items-center justify-center rounded-full ${badgeColor} text-sm font-bold text-white`}
        >
          {badge}
        </div>
        <span className='flex-1 truncate text-sm text-zinc-700 dark:text-zinc-200'>
          {model}
        </span>
        <Plus className='size-4 text-zinc-300' />
      </div>
    </div>
  )
}

// 面板十：Cherry Studio 对话验证界面（按竞品真实 DOM 高仿）
function CherryChatMockup({
  model = 'gpt-5.4',
  badge = 'G',
  badgeColor = 'bg-blue-500',
}: {
  model?: string
  badge?: string
  badgeColor?: string
}) {
  return (
    <div className='mx-auto max-w-2xl overflow-hidden rounded-2xl border border-zinc-200 bg-white text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900'>
      {/* 顶栏：助手 + 模型选择 */}
      <div className='flex items-center justify-between border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800'>
        <div className='flex items-center gap-2 text-zinc-600 dark:text-zinc-300'>
          <div className='flex size-6 items-center justify-center rounded-full bg-amber-100 text-xs'>
            😊
          </div>
          <span className='font-medium text-zinc-800 dark:text-zinc-100'>
            Default Assistant
          </span>
          <ChevronRight className='size-3.5 text-zinc-400' />
          <div
            className={`flex size-6 shrink-0 items-center justify-center rounded-full ${badgeColor} text-xs font-bold text-white`}
          >
            {badge}
          </div>
          <span className='font-medium text-zinc-800 dark:text-zinc-100'>
            {model}
          </span>
          <ChevronDown className='size-3.5 text-zinc-400' />
        </div>
        <div className='flex items-center gap-3 text-zinc-400'>
          <ListFilter className='size-4' />
          <Share2 className='size-4' />
          <Search className='size-4' />
        </div>
      </div>
      {/* 助手开场白 */}
      <div className='mx-5 mt-4 rounded-xl bg-zinc-50 px-4 py-2.5 text-[13px] text-zinc-500 dark:bg-zinc-800/60'>
        你好，我是默认助手。你可以立刻开始跟我聊天
      </div>
      <div className='space-y-6 px-5 py-4'>
        {/* 用户消息 */}
        <div className='flex items-start gap-3'>
          <div className='flex size-10 shrink-0 items-center justify-center rounded-full bg-teal-500 text-white'>
            <User className='size-5' />
          </div>
          <div className='min-w-0'>
            <div className='flex items-center gap-2'>
              <span className='font-semibold text-zinc-800 dark:text-zinc-100'>
                用户
              </span>
              <span className='text-xs text-zinc-400'>04/07 13:01</span>
            </div>
            <div className='mt-1 text-zinc-800 dark:text-zinc-200'>hi</div>
            <div className='mt-1 text-xs text-zinc-400'>Tokens: 1</div>
          </div>
        </div>
        {/* 助手回复 */}
        <div className='flex items-start gap-3'>
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-full ${badgeColor} text-xs font-bold text-white`}
          >
            {badge}
          </div>
          <div className='min-w-0 flex-1'>
            <div className='flex items-center gap-2'>
              <span className='font-semibold text-zinc-800 dark:text-zinc-100'>
                {model}
              </span>
              <span className='text-xs text-zinc-400'>04/29 18:01</span>
            </div>
            <div className='mt-2 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700'>
              <div className='flex w-full items-center justify-between px-4 py-2.5 text-left'>
                <div className='flex items-center gap-2 text-zinc-600 dark:text-zinc-300'>
                  <span className='text-[13px]'>已深度思考（用时 2.9 秒）</span>
                </div>
                <ChevronDown className='size-4 text-zinc-400' />
              </div>
            </div>
            <div className='mt-3 text-zinc-800 dark:text-zinc-200'>
              Hi! How can I help you today?
            </div>
            <div className='mt-3 flex items-center justify-between'>
              <div className='flex items-center gap-3 text-zinc-400'>
                <Copy className='size-4' />
                <RefreshCw className='size-4' />
                <Share2 className='size-4' />
                <span className='text-xs font-medium'>文</span>
                <Pencil className='size-4' />
                <Trash2 className='size-4' />
                <ListFilter className='size-4' />
              </div>
              <span className='text-xs text-zinc-400'>Tokens: 70 15 165</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const MOCKUPS: Record<string, () => React.ReactNode> = {
  'cursor-network': CursorNetworkMockup,
  'cursor-api-keys': CursorApiKeysMockup,
  'trae-add-model': () => <TraeAddModelMockup />,
  'trae-add-model-max': () => (
    <TraeAddModelMockup
      apiFormat='Anthropic Messages 格式'
      baseUrl={`${API_BASE_URL}`}
      hintFormat='Anthropic Messages 格式'
      hintPath='/v1/messages'
      model='claude-opus-4-6'
    />
  ),
  'trae-chat': () => <TraeChatMockup />,
  'trae-chat-max': () => <TraeChatMockup model='claude-opus-4-6' />,
  'claude-code-terminal': () => <ClaudeCodeTerminalMockup />,
  'claude-code-terminal-max': () => (
    <ClaudeCodeTerminalMockup model='claude-opus-4-6' />
  ),
  'opencode-terminal': () => <OpenCodeTerminalMockup />,
  'opencode-terminal-max': () => (
    <OpenCodeTerminalMockup model='claude-opus-4-6' />
  ),
  'cherry-add-provider': () => <CherryAddProviderMockup />,
  'cherry-add-provider-max': () => (
    <CherryAddProviderMockup providerType='Anthropic' />
  ),
  'cherry-api-config': () => <CherryApiConfigMockup />,
  'cherry-api-config-max': () => (
    <CherryApiConfigMockup baseUrl={`${API_BASE_URL}`} preview='/v1/messages' />
  ),
  'cherry-model-list': () => <CherryModelListMockup />,
  'cherry-model-list-max': () => (
    <CherryModelListMockup
      model='claude-opus-4-6'
      badge='C'
      badgeColor='bg-[#D97757]'
    />
  ),
  'cherry-chat': () => <CherryChatMockup />,
  'cherry-chat-max': () => (
    <CherryChatMockup
      model='claude-opus-4-6'
      badge='C'
      badgeColor='bg-[#D97757]'
    />
  ),
}

export function DocMockup({ name }: { name: string }) {
  const Comp = MOCKUPS[name]
  return Comp ? <Comp /> : null
}

