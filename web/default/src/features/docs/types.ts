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

// 站内文档：单条内容块。客户端教程正文由若干块顺序拼成。
export type DocBlock =
  | { type: 'heading'; text: string }
  | { type: 'text'; text: string } // 支持 Markdown 行内语法
  | { type: 'code'; code: string; lang?: string; title?: string }
  | { type: 'image'; src: string; alt?: string }
  | { type: 'callout'; text: string; variant?: 'info' | 'warning' }
  | { type: 'mockup'; name: string } // 还原设置面板截图的命名组件

// 单个客户端的教程（chip + 正文块）
export type ClientDoc = {
  id: string
  name: string
  icon?: string // lobe 图标名，如 'Codex.Avatar'；缺省则用通用代码图标
  blocks: DocBlock[]
}

// 顶部 tab：带客户端 chip 的教程 tab（clients），或纯正文 tab（blocks，如常见问题）
export type DocTab = {
  id: string
  label: string
  clients?: ClientDoc[]
  blocks?: DocBlock[]
}
