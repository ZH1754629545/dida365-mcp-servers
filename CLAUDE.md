# 项目指南

## 项目概述

滴答清单（TickTick/Dida365）MCP 服务器，使用 TypeScript 编写。通过 MCP 协议为 AI 助手提供任务管理、项目管理和专注时间记录等功能。

## 技术栈

- TypeScript 5.8 + Node.js >= 18
- MCP SDK 0.5.0（`@modelcontextprotocol/sdk`）
- Axios（HTTP 客户端）
- Jest（测试框架）

## 常用命令

```bash
npm install        # 安装依赖
npm run build      # 构建项目（tsc 编译 + chmod）
npm run watch      # 开发模式，监听文件变化
npm start          # 运行 MCP 服务器
```

## 项目结构

- `src/index.ts` — 主入口文件，包含所有 MCP 工具定义、接口类型和请求处理逻辑
- `dist/` — 编译输出目录
- `.env` — 环境变量配置（不可提交）
- `.env.example` — 环境变量模板
- `test_*.js` — 手动集成测试脚本

## 代码规范

- 启用 TypeScript 严格模式（`strict: true`）
- 命名约定：变量/函数 `camelCase`，接口/类型 `PascalCase`，MCP 工具名 `snake_case`
- 注释和错误信息使用中文
- 编译目标：ES2022，模块系统：ESNext

## API 说明

项目使用两套 API：

| 版本 | 基础 URL | 认证方式 | 用途 |
|------|----------|----------|------|
| v1 | `https://api.dida365.com/open/v1` | Bearer Token | 任务和项目的增删改查 |
| v2 | `https://api.dida365.com/api/v2` | Cookie | 专注时间统计与记录 |

## 环境变量

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `DIDA365_TOKEN` | v1 API 访问令牌（Bearer token） | 是 |
| `DIDA365_COOKIE` | v2 API 的 Session Cookie | 使用 v2 功能时需要 |

## 注意事项

- `.env` 文件包含敏感凭据，绝对不要提交到版本库
- 所有业务代码集中在 `src/index.ts` 单文件中
- 修改代码后需运行 `npm run build` 重新编译
- 项目通过 npm 发布为 `dida365-mcp-servers` 包
