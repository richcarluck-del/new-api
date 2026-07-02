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
import type { DocBlock, DocTab } from './types'

// 写死的 API 接入域名；后续如换线路只改这一处。
export const API_BASE_URL = 'https://shunfengai.cn'

// 每个客户端正文（blocks）暂留空，等用户逐个发图后照图补全。
const EMPTY = [] as const

// OpenAI 官渠 → Codex（照图还原，域名替换为本站）
// OpenAI 官渠 → Cursor（照图还原，域名替换为本站）
const CURSOR_OPENAI_BLOCKS: DocBlock[] = [
  {
    type: 'text',
    text: '1\\. 打开 Cursor Settings，进入 Network，将 HTTP Compatibility Mode 改为 HTTP/1.1。',
  },
  { type: 'mockup', name: 'cursor-network' },
  {
    type: 'text',
    text: '2\\. 进入 Models 页面，展开 API Keys。OpenAI API Key 填入你现有的 API Key。',
  },
  {
    type: 'text',
    text: '3\\. 打开 Override OpenAI Base URL，将输入框填入下方地址：',
  },
  { type: 'code', code: `${API_BASE_URL}/v1` },
  { type: 'mockup', name: 'cursor-api-keys' },
  {
    type: 'text',
    text: '4\\. 保存设置后返回 Cursor 对话页面，选择当前渠道可用模型并发送一条消息，能正常回复即表示配置完成。',
  },
]

const CLAUDE_CODE_OPENAI_BLOCKS: DocBlock[] = [
  {
    type: 'text',
    text: '1\\. 安装或更新 Node.js（v18.0 或更高版本）。',
  },
  {
    type: 'text',
    text: '2\\. 在终端中执行下列命令，安装 Claude Code。',
  },
  { type: 'code', code: 'npm install -g @anthropic-ai/claude-code' },
  {
    type: 'text',
    text: '3\\. 运行以下命令验证安装。若有版本号输出，则表示安装成功。',
  },
  { type: 'code', code: 'claude --version' },
  {
    type: 'text',
    text: '4\\. 创建并打开配置文件 `C:\\Users\\<用户名>\\.claude\\settings.json`。如果 `.claude` 目录不存在，需要先行创建：',
  },
  { type: 'code', code: 'mkdir C:\\Users\\<用户名>\\.claude' },
  { type: 'text', text: '然后打开配置文件：' },
  { type: 'code', code: 'notepad C:\\Users\\<用户名>\\.claude\\settings.json' },
  {
    type: 'text',
    text: '5\\. 编辑配置文件，将以下内容写入并保存。',
  },
  {
    type: 'code',
    title: 'C:\\Users\\<用户名>\\.claude\\settings.json',
    code: `{
  "env": {
    "ANTHROPIC_BASE_URL": "${API_BASE_URL}",
    "ANTHROPIC_AUTH_TOKEN": "你的API Key",
    "CLAUDE_CODE_ATTRIBUTION_HEADER": "0",
    "CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS": "1",
    "ANTHROPIC_MODEL": "gpt-5.4",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "gpt-5.4",
    "ANTHROPIC_DEFAULT_OPUS_MODEL_SUPPORTED_CAPABILITIES": "thinking,adaptive_thinking,temperature,effort,max_effort",
    "ANTHROPIC_DEFAULT_SONNET_MODEL_SUPPORTED_CAPABILITIES": "thinking,adaptive_thinking,temperature,effort,max_effort",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "gpt-5.4",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL_SUPPORTED_CAPABILITIES": "thinking,adaptive_thinking,temperature,effort,max_effort",
    "CLAUDE_CODE_SUBAGENT_MODEL": "gpt-5.4",
    "CLAUDE_CODE_EFFORT_LEVEL": "max"
  },
  "hasCompletedOnboarding": true
}`,
  },
  {
    type: 'text',
    text: '保存配置文件，重新打开一个终端即可生效。',
  },
  {
    type: 'text',
    text: '6\\. 在终端运行 `claude`，看到对话界面并能正常回复即表示配置完成。',
  },
  { type: 'mockup', name: 'claude-code-terminal' },
]

// Max 官渠 → Claude Code（照图还原；裸域名，无 /codex，模型 claude-opus-4-6）
const CLAUDE_CODE_MAX_BLOCKS: DocBlock[] = [
  {
    type: 'text',
    text: '1\\. 安装或更新 Node.js（v18.0 或更高版本）。',
  },
  {
    type: 'text',
    text: '2\\. 在终端中执行下列命令，安装 Claude Code。',
  },
  { type: 'code', code: 'npm install -g @anthropic-ai/claude-code' },
  {
    type: 'text',
    text: '3\\. 运行以下命令验证安装。若有版本号输出，则表示安装成功。',
  },
  { type: 'code', code: 'claude --version' },
  {
    type: 'text',
    text: '4\\. 创建并打开配置文件 `C:\\Users\\<用户名>\\.claude\\settings.json`。如果 `.claude` 目录不存在，需要先行创建：',
  },
  { type: 'code', code: 'mkdir C:\\Users\\<用户名>\\.claude' },
  { type: 'text', text: '然后打开配置文件：' },
  { type: 'code', code: 'notepad C:\\Users\\<用户名>\\.claude\\settings.json' },
  {
    type: 'text',
    text: '5\\. 编辑配置文件，将以下内容写入并保存。',
  },
  {
    type: 'code',
    title: 'C:\\Users\\<用户名>\\.claude\\settings.json',
    code: `{
  "env": {
    "ANTHROPIC_BASE_URL": "${API_BASE_URL}",
    "ANTHROPIC_AUTH_TOKEN": "你的API Key",
    "CLAUDE_CODE_ATTRIBUTION_HEADER": "0",
    "CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS": "1",
    "ANTHROPIC_MODEL": "claude-opus-4-6",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-4-6",
    "ANTHROPIC_DEFAULT_OPUS_MODEL_SUPPORTED_CAPABILITIES": "thinking,adaptive_thinking,temperature,effort,max_effort",
    "ANTHROPIC_DEFAULT_SONNET_MODEL_SUPPORTED_CAPABILITIES": "thinking,adaptive_thinking,temperature,effort,max_effort",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "claude-opus-4-6",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL_SUPPORTED_CAPABILITIES": "thinking,adaptive_thinking,temperature,effort,max_effort",
    "CLAUDE_CODE_SUBAGENT_MODEL": "claude-opus-4-6",
    "CLAUDE_CODE_EFFORT_LEVEL": "max"
  },
  "hasCompletedOnboarding": true
}`,
  },
  {
    type: 'text',
    text: '保存配置文件，重新打开一个终端即可生效。',
  },
  {
    type: 'text',
    text: '6\\. 在终端运行 `claude`，看到对话界面并能正常回复即表示配置完成。',
  },
  { type: 'mockup', name: 'claude-code-terminal-max' },
]

const TRAE_SOLO_OPENAI_BLOCKS: DocBlock[] = [
  {
    type: 'text',
    text: '1\\. 打开 TRAE SOLO 的模型设置，点击「添加模型」，展开「自定义配置」。',
  },
  {
    type: 'text',
    text: '2\\. API 格式选择「OpenAI Chat Completions 格式」。自定义请求地址填入当前线路 URL，保持「完整 URL」关闭，不要在地址末尾添加斜杠。',
  },
  {
    type: 'text',
    text: '3\\. 模型 ID 填入当前选择的模型，API 密钥填入你的 API Key。模型支持图片时，可以开启「多模态」。',
  },
  { type: 'mockup', name: 'trae-add-model' },
  {
    type: 'text',
    text: '4\\. 提交保存后回到 TRAE SOLO 对话界面，选择刚添加的模型，发送一条消息测试，能正常回复即表示配置完成。',
  },
  { type: 'mockup', name: 'trae-chat' },
]

// Max 官渠 → TRAE SOLO（照图还原；API 格式 Anthropic Messages，裸域名，模型 claude-opus-4-6）
const TRAE_SOLO_MAX_BLOCKS: DocBlock[] = [
  {
    type: 'text',
    text: '1\\. 打开 TRAE SOLO 的模型设置，点击「添加模型」，展开「自定义配置」。',
  },
  {
    type: 'text',
    text: '2\\. API 格式选择「Anthropic Messages 格式」。自定义请求地址填入当前线路 URL，保持「完整 URL」关闭，不要在地址末尾添加斜杠。',
  },
  {
    type: 'text',
    text: '3\\. 模型 ID 填入当前选择的模型，API 密钥填入你的 API Key。模型支持图片时，可以开启「多模态」。',
  },
  { type: 'mockup', name: 'trae-add-model-max' },
  {
    type: 'text',
    text: '4\\. 提交保存后回到 TRAE SOLO 对话界面，选择刚添加的模型，发送一条消息测试，能正常回复即表示配置完成。',
  },
  { type: 'mockup', name: 'trae-chat-max' },
]

const OPENCODE_OPENAI_BLOCKS: DocBlock[] = [
  { type: 'code', code: 'npm install -g opencode-ai' },
  {
    type: 'text',
    text: '3\\. 在终端中执行以下命令，若输出版本号，则表示安装成功。',
  },
  { type: 'code', code: 'opencode -v' },
  {
    type: 'text',
    text: '4\\. 创建并打开配置文件 `C:\\Users\\<用户名>\\.config\\opencode\\opencode.json`：',
  },
  {
    type: 'code',
    code: 'notepad C:\\Users\\<用户名>\\.config\\opencode\\opencode.json',
  },
  {
    type: 'text',
    text: '5\\. 将以下配置写入文件，保存后退出并重新启动 OpenCode 使新配置生效。',
  },
  {
    type: 'code',
    title: 'C:\\Users\\<用户名>\\.config\\opencode\\opencode.json',
    code: `{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "shunfeng": {
      "npm": "@ai-sdk/openai",
      "name": "shunfeng",
      "options": {
        "baseURL": "${API_BASE_URL}/v1",
        "apiKey": "你的API Key",
        "setCacheKey": true
      },
      "models": {
        "gpt-5.4": {
          "name": "gpt-5.4",
          "modalities": {
            "input": ["text", "image"],
            "output": ["text"]
          },
          "options": {
            "thinking": {
              "type": "enabled",
              "budgetTokens": 8192
            }
          },
          "limit": {
            "context": 1000000,
            "output": 65536
          }
        }
      }
    }
  }
}`,
  },
  {
    type: 'text',
    text: '6\\. 在终端运行 `opencode`，看到对话界面并能正常回复即表示配置完成。',
  },
  { type: 'mockup', name: 'opencode-terminal' },
]

// Max 官渠 → OpenCode（照图还原；provider krill→shunfeng，SDK @ai-sdk/anthropic，域名 /v1，模型 claude-opus-4-6）
const OPENCODE_MAX_BLOCKS: DocBlock[] = [
  {
    type: 'text',
    text: '1\\. 安装或更新 Node.js（v18.0 或更高版本）。',
  },
  {
    type: 'text',
    text: '2\\. 在终端中执行以下命令安装 OpenCode。',
  },
  { type: 'code', code: 'npm install -g opencode-ai' },
  {
    type: 'text',
    text: '3\\. 在终端中执行以下命令，若输出版本号，则表示安装成功。',
  },
  { type: 'code', code: 'opencode -v' },
  {
    type: 'text',
    text: '4\\. 创建并打开配置文件 `C:\\Users\\<用户名>\\.config\\opencode\\opencode.json`：',
  },
  {
    type: 'code',
    code: 'notepad C:\\Users\\<用户名>\\.config\\opencode\\opencode.json',
  },
  {
    type: 'text',
    text: '5\\. 将以下配置写入文件，保存后退出并重新启动 OpenCode 使新配置生效。',
  },
  {
    type: 'code',
    title: 'C:\\Users\\<用户名>\\.config\\opencode\\opencode.json',
    code: `{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "shunfeng": {
      "npm": "@ai-sdk/anthropic",
      "name": "shunfeng",
      "options": {
        "baseURL": "${API_BASE_URL}/v1",
        "apiKey": "你的API Key"
      },
      "models": {
        "claude-opus-4-6": {
          "name": "claude-opus-4-6",
          "modalities": {
            "input": ["text", "image"],
            "output": ["text"]
          },
          "options": {
            "thinking": {
              "type": "enabled",
              "budgetTokens": 8192
            }
          },
          "limit": {
            "context": 1000000,
            "output": 65536
          }
        }
      }
    }
  }
}`,
  },
  {
    type: 'text',
    text: '6\\. 在终端运行 `opencode`，看到对话界面并能正常回复即表示配置完成。',
  },
  { type: 'mockup', name: 'opencode-terminal-max' },
]

const OPENCLAW_OPENAI_BLOCKS: DocBlock[] = [
  {
    type: 'text',
    text: '1\\. 在终端执行以下命令打开配置文件。',
  },
  { type: 'code', code: 'notepad C:\\Users\\<用户名>\\.openclaw\\openclaw.json' },
  {
    type: 'text',
    text: '2\\. 首次配置：复制以下内容到配置文件。将 YOUR_API_KEY 替换为你的 API Key。 已有配置：若需保留已有配置，请勿直接全量替换。',
  },
  {
    type: 'code',
    title: 'C:\\Users\\<用户名>\\.openclaw\\openclaw.json',
    code: `{
  "models": {
    "mode": "merge",
    "providers": {
      "shunfeng": {
        "baseUrl": "${API_BASE_URL}/v1",
        "apiKey": "你的API Key",
        "api": "openai-responses",
        "models": [
          {
            "id": "gpt-5.4",
            "name": "gpt-5.4",
            "reasoning": false,
            "input": ["text", "image"],
            "cost": {
              "input": 0,
              "output": 0,
              "cacheRead": 0,
              "cacheWrite": 0
            },
            "contextWindow": 1000000,
            "maxTokens": 65536
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "shunfeng/gpt-5.4"
      },
      "models": {
        "shunfeng/gpt-5.4": {}
      }
    }
  },
  "gateway": {
    "mode": "local"
  }
}`,
  },
  {
    type: 'text',
    text: '3\\. 保存文件并退出，运行以下命令来使配置生效。',
  },
  { type: 'code', code: 'openclaw gateway restart' },
]

// Max 官渠 → OpenClaw（照图还原；provider krill→shunfeng，裸域名，api anthropic-messages，模型 claude-opus-4-6）
const OPENCLAW_MAX_BLOCKS: DocBlock[] = [
  {
    type: 'text',
    text: '1\\. 在终端执行以下命令打开配置文件。',
  },
  { type: 'code', code: 'notepad C:\\Users\\<用户名>\\.openclaw\\openclaw.json' },
  {
    type: 'text',
    text: '2\\. 首次配置：复制以下内容到配置文件。将 YOUR_API_KEY 替换为你的 API Key。 已有配置：若需保留已有配置，请勿直接全量替换。',
  },
  {
    type: 'code',
    title: 'C:\\Users\\<用户名>\\.openclaw\\openclaw.json',
    code: `{
  "models": {
    "mode": "merge",
    "providers": {
      "shunfeng": {
        "baseUrl": "${API_BASE_URL}",
        "apiKey": "你的API Key",
        "api": "anthropic-messages",
        "models": [
          {
            "id": "claude-opus-4-6",
            "name": "claude-opus-4-6",
            "reasoning": false,
            "input": ["text", "image"],
            "cost": {
              "input": 0,
              "output": 0,
              "cacheRead": 0,
              "cacheWrite": 0
            },
            "contextWindow": 1000000,
            "maxTokens": 65536
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "shunfeng/claude-opus-4-6"
      },
      "models": {
        "shunfeng/claude-opus-4-6": {}
      }
    }
  },
  "gateway": {
    "mode": "local"
  }
}`,
  },
  {
    type: 'text',
    text: '3\\. 保存文件并退出，运行以下命令来使配置生效。',
  },
  { type: 'code', code: 'openclaw gateway restart' },
]

const HERMES_OPENAI_BLOCKS: DocBlock[] = [
  {
    type: 'text',
    text: '1\\. 在终端中执行以下命令，安装脚本会自动安装 Python、Git 等依赖。  \nWindows 不支持原生安装，请先安装 WSL2，在 WSL2 终端中运行以下命令：',
  },
  {
    type: 'code',
    code: 'curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash',
  },
  {
    type: 'text',
    text: '2\\. 安装完成后，重新加载终端环境。',
  },
  { type: 'code', code: '# Windows 用户请关闭并重新打开终端' },
  {
    type: 'text',
    text: '3\\. 验证安装是否成功。',
  },
  { type: 'code', code: 'hermes --version' },
  {
    type: 'text',
    text: '4\\. 在终端中依次执行以下命令，配置模型提供商、Base URL、API Key 和默认模型。',
  },
  {
    type: 'code',
    code: `hermes config set model.provider custom
hermes config set model.base_url ${API_BASE_URL}/v1
hermes config set model.api_key 你的API Key
hermes config set model.default gpt-5.4
hermes config set model.api_mode codex_responses`,
  },
  {
    type: 'text',
    text: '以上命令将配置写入 `C:\\Users\\<用户名>\\.hermes\\config.yaml`。也可以直接编辑该文件，写入以下内容：',
  },
  {
    type: 'code',
    title: 'C:\\Users\\<用户名>\\.hermes\\config.yaml',
    code: `model:
  default: gpt-5.4
  provider: custom
  base_url: ${API_BASE_URL}/v1
  api_key: 你的API Key
  api_mode: codex_responses`,
  },
  {
    type: 'text',
    text: '5\\. 配置完成后，可以通过 -m 参数在对话时切换模型。',
  },
  { type: 'code', code: 'hermes chat -m gpt-5.4' },
]

// Max 官渠 → Hermes（照图还原；裸域名，api_mode anthropic_messages，模型 claude-opus-4-6）
const HERMES_MAX_BLOCKS: DocBlock[] = [
  {
    type: 'text',
    text: '1\\. 在终端中执行以下命令，安装脚本会自动安装 Python、Git 等依赖。  \nWindows 不支持原生安装，请先安装 WSL2，在 WSL2 终端中运行以下命令：',
  },
  {
    type: 'code',
    code: 'curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash',
  },
  {
    type: 'text',
    text: '2\\. 安装完成后，重新加载终端环境。',
  },
  { type: 'code', code: '# Windows 用户请关闭并重新打开终端' },
  {
    type: 'text',
    text: '3\\. 验证安装是否成功。',
  },
  { type: 'code', code: 'hermes --version' },
  {
    type: 'text',
    text: '4\\. 在终端中依次执行以下命令，配置模型提供商、Base URL、API Key 和默认模型。',
  },
  {
    type: 'code',
    code: `hermes config set model.provider custom
hermes config set model.base_url ${API_BASE_URL}
hermes config set model.api_key 你的API Key
hermes config set model.default claude-opus-4-6
hermes config set model.api_mode anthropic_messages`,
  },
  {
    type: 'text',
    text: '以上命令将配置写入 `C:\\Users\\<用户名>\\.hermes\\config.yaml`。也可以直接编辑该文件，写入以下内容：',
  },
  {
    type: 'code',
    title: 'C:\\Users\\<用户名>\\.hermes\\config.yaml',
    code: `model:
  default: claude-opus-4-6
  provider: custom
  base_url: ${API_BASE_URL}
  api_key: 你的API Key
  api_mode: anthropic_messages`,
  },
  {
    type: 'text',
    text: '5\\. 配置完成后，可以通过 -m 参数在对话时切换模型。',
  },
  { type: 'code', code: 'hermes chat -m claude-opus-4-6' },
  {
    type: 'text',
    text: '也可以通过 `hermes config set` 修改默认模型：',
  },
  { type: 'code', code: 'hermes config set model.default claude-opus-4-6' },
  {
    type: 'text',
    text: '6\\. 验证配置，执行以下命令发送一条测试消息。',
  },
  { type: 'code', code: 'hermes chat -q "你好"' },
  {
    type: 'text',
    text: '如果返回正常的 AI 回复，则配置成功。如需进入交互式对话模式，直接执行：',
  },
  { type: 'code', code: 'hermes' },
]

const CODEX_OPENAI_BLOCKS: DocBlock[] = [
  { type: 'heading', text: '1. 安装 Node.js' },
  {
    type: 'text',
    text: '请先安装 Node.js（版本 ≥ 18），安装完成后在终端执行以下命令验证：',
  },
  { type: 'code', code: 'node -v' },
  { type: 'heading', text: '2. 安装 Codex' },
  { type: 'text', text: '使用 npm 全局安装 Codex：' },
  { type: 'code', code: 'npm install -g @openai/codex' },
  { type: 'heading', text: '3. 配置 Codex' },
  {
    type: 'text',
    text: '在用户目录下创建 `~/.codex` 文件夹，并新建 `config.toml` 配置文件，写入以下内容：',
  },
  {
    type: 'code',
    title: 'config.toml',
    code: `model = "gpt-5.4"
model_provider = "shunfeng"
model_reasoning_effort = "high"
disable_response_storage = true

[model_providers.shunfeng]
name = "shunfeng"
base_url = "${API_BASE_URL}/v1"
wire_api = "responses"`,
  },
  {
    type: 'text',
    text: '再在 `~/.codex` 目录下新建 `auth.json`，填入你的 API Key：',
  },
  {
    type: 'code',
    title: 'auth.json',
    code: `{
  "OPENAI_API_KEY": "你的 API Key"
}`,
  },
  { type: 'heading', text: '4. 启动 Codex' },
  { type: 'text', text: '配置完成后，在终端输入 `codex` 即可开始使用。' },
]

// Max 官渠 → Codex（照图还原；provider krill→shunfeng，域名替换为本站 /v1，模型 claude-opus-4-6）
const CODEX_MAX_BLOCKS: DocBlock[] = [
  {
    type: 'text',
    text: '1\\. 安装或更新 Node.js（v18.0 或更高版本）。',
  },
  {
    type: 'text',
    text: '2\\. 在终端中执行下列命令，安装 Codex。',
  },
  { type: 'code', code: 'npm install -g @openai/codex' },
  {
    type: 'text',
    text: '3\\. 运行以下命令验证安装。若有版本号输出，则表示安装成功。',
  },
  { type: 'code', code: 'codex --version' },
  {
    type: 'text',
    text: '4\\. 创建并打开配置文件 `C:\\Users\\<用户名>\\.codex\\config.toml`。如果 `.codex` 目录不存在，需要先行创建：',
  },
  { type: 'code', code: 'mkdir C:\\Users\\<用户名>\\.codex' },
  { type: 'text', text: '然后打开配置文件：' },
  { type: 'code', code: 'notepad C:\\Users\\<用户名>\\.codex\\config.toml' },
  {
    type: 'text',
    text: '5\\. 编辑配置文件，将以下内容写入并保存。',
  },
  {
    type: 'code',
    title: 'C:\\Users\\<用户名>\\.codex\\config.toml',
    code: `disable_response_storage = true
model = "claude-opus-4-6"
model_provider = "shunfeng"
model_reasoning_effort = "high"
model_verbosity = "high"
web_search = "live"

[model_providers.shunfeng]
base_url = "${API_BASE_URL}/v1"
name = "shunfeng"
requires_openai_auth = true
wire_api = "responses"`,
  },
  {
    type: 'text',
    text: '6\\. 创建并打开 API Key 文件 `C:\\Users\\<用户名>\\.codex\\auth.json`。',
  },
  { type: 'code', code: 'notepad C:\\Users\\<用户名>\\.codex\\auth.json' },
  { type: 'text', text: '将以下内容写入并保存。' },
  {
    type: 'code',
    title: 'C:\\Users\\<用户名>\\.codex\\auth.json',
    code: `{
  "OPENAI_API_KEY": "你的API Key"
}`,
  },
]

const CHERRY_STUDIO_OPENAI_BLOCKS: DocBlock[] = [
  { type: 'text', text: '1\\. 在 Api 页面创建一个 Key。' },
  {
    type: 'text',
    text: '2\\. 在 Cherry Studio 中创建提供商类型为 OpenAI 的提供商。',
  },
  { type: 'mockup', name: 'cherry-add-provider' },
  {
    type: 'text',
    text: '3\\. API 地址填入以下地址，API 密钥填入你的 API Key，点击获取模型列表。',
  },
  { type: 'code', code: `${API_BASE_URL}/v1` },
  { type: 'mockup', name: 'cherry-api-config' },
  { type: 'text', text: '4\\. 点击获取模型列表，即可看到可用模型。' },
  { type: 'mockup', name: 'cherry-model-list' },
  {
    type: 'text',
    text: '5\\. 选择模型后，在对话界面发送消息，看到正常回复即表示配置完成。',
  },
  { type: 'mockup', name: 'cherry-chat' },
]

// Max 官渠 → Cherry Studio（照图还原；提供商类型 Anthropic，裸域名，预览 /v1/messages，模型 claude-opus-4-6）
const CHERRY_STUDIO_MAX_BLOCKS: DocBlock[] = [
  { type: 'text', text: '1\\. 在 Api 页面创建一个 Key。' },
  {
    type: 'text',
    text: '2\\. 在 Cherry Studio 中创建提供商类型为 Anthropic 的提供商。',
  },
  { type: 'mockup', name: 'cherry-add-provider-max' },
  {
    type: 'text',
    text: '3\\. API 地址填入以下地址，API 密钥填入你的 API Key，点击获取模型列表。',
  },
  { type: 'code', code: `${API_BASE_URL}` },
  { type: 'mockup', name: 'cherry-api-config-max' },
  { type: 'text', text: '4\\. 点击获取模型列表，即可看到可用模型。' },
  { type: 'mockup', name: 'cherry-model-list-max' },
  {
    type: 'text',
    text: '5\\. 选择模型后，在对话界面发送消息，看到正常回复即表示配置完成。',
  },
  { type: 'mockup', name: 'cherry-chat-max' },
]

const CODE_CALL_OPENAI_BLOCKS: DocBlock[] = [
  { type: 'text', text: '1\\. 安装 OpenAI Python SDK。' },
  { type: 'code', code: 'pip install openai' },
  { type: 'text', text: '2\\. 使用以下代码调用对话接口。' },
  {
    type: 'code',
    title: 'Python',
    code: `from openai import OpenAI

client = OpenAI(
    base_url="${API_BASE_URL}/v1",
    api_key="你的API Key",
)
completion = client.chat.completions.create(
    model="gpt-5.4",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello!"},
    ],
)
print(completion.choices[0].message)`,
  },
  {
    type: 'code',
    title: 'curl',
    code: `curl -X POST "${API_BASE_URL}/v1/chat/completions" \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer 你的API Key" \\
-d '{
        "model": "gpt-5.4",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello!"}
        ]
    }'`,
  },
]

export const DOC_TABS: DocTab[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    clients: [
      { id: 'codex', name: 'Codex', icon: 'Codex.Avatar', blocks: CODEX_OPENAI_BLOCKS },
      { id: 'cursor', name: 'Cursor', icon: 'Cursor.Avatar', blocks: CURSOR_OPENAI_BLOCKS },
      { id: 'trae-solo', name: 'TRAE SOLO', icon: 'Trae.Avatar', blocks: TRAE_SOLO_OPENAI_BLOCKS },
      { id: 'claude-code', name: 'Claude Code', icon: 'ClaudeCode.Avatar', blocks: CLAUDE_CODE_OPENAI_BLOCKS },
      { id: 'opencode', name: 'OpenCode', icon: 'OpenCode.Avatar', blocks: OPENCODE_OPENAI_BLOCKS },
      { id: 'openclaw', name: 'OpenClaw', icon: 'OpenClaw.Avatar', blocks: OPENCLAW_OPENAI_BLOCKS },
      { id: 'hermes', name: 'Hermes', icon: 'NousResearch.Avatar', blocks: HERMES_OPENAI_BLOCKS },
      { id: 'cherry-studio', name: 'Cherry Studio', icon: 'CherryStudio.Avatar', blocks: CHERRY_STUDIO_OPENAI_BLOCKS },
      { id: 'code-call', name: '代码调用', blocks: CODE_CALL_OPENAI_BLOCKS },
    ],
  },
  {
    id: 'max',
    label: 'Anthropic',
    clients: [
      { id: 'claude-code', name: 'Claude Code', icon: 'ClaudeCode.Avatar', blocks: CLAUDE_CODE_MAX_BLOCKS },
      { id: 'codex', name: 'Codex', icon: 'Codex.Avatar', blocks: CODEX_MAX_BLOCKS },
      { id: 'opencode', name: 'OpenCode', icon: 'OpenCode.Avatar', blocks: OPENCODE_MAX_BLOCKS },
      { id: 'openclaw', name: 'OpenClaw', icon: 'OpenClaw.Avatar', blocks: OPENCLAW_MAX_BLOCKS },
      { id: 'hermes', name: 'Hermes', icon: 'NousResearch.Avatar', blocks: HERMES_MAX_BLOCKS },
      { id: 'cherry-studio', name: 'Cherry Studio', icon: 'CherryStudio.Avatar', blocks: CHERRY_STUDIO_MAX_BLOCKS },
      { id: 'trae-solo', name: 'TRAE SOLO', icon: 'Trae.Avatar', blocks: TRAE_SOLO_MAX_BLOCKS },
    ],
  },
  {
    id: 'faq',
    label: '常见问题',
    blocks: [...EMPTY],
  },
]
