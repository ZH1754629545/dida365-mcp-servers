# 滴答清单 MCP 服务

这是一个为滴答清单（TickTick/Dida365）开发的 Model Context Protocol (MCP) 服务器，使用 TypeScript 编写。该服务允许 AI 助手通过标准化接口与滴答清单 API 进行交互。

## 功能特性

- ✅ 创建、读取、更新、删除任务
- ✅ 管理项目和项目列表
- ✅ 支持任务优先级和截止日期
- ✅ 通过环境变量安全配置 API Token
- ✅ 完整的 TypeScript 类型支持
- ✅ 错误处理和API响应验证

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制示例环境变量文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，添加你的滴答清单 API Token：

```bash
DIDA365_TOKEN=Bearer your_token_here
```

### 3. 获取 API Token

1. 访问 [滴答清单开放平台](https://developer.dida365.com/)
2. 登录你的滴答清单账号
3. 创建新应用
4. 获取访问令牌（Access Token）
5. 将令牌添加到 `.env` 文件中

### 4. 构建和运行

开发模式：

```bash
npm run dev
```

生产模式：

```bash
npm run build
npm start
```

## 可用工具

### 任务管理

#### `create_task`

创建新任务

参数：

- `title` (必需): 任务标题
- `projectId` (必需): 项目ID
- `content` (可选): 任务内容描述
- `dueDate` (可选): 截止日期 (ISO 8601格式)
- `priority` (可选): 优先级 (0-5)

示例：

```json
{
  "title": "完成项目报告",
  "projectId": "6889c028e4b0c0adf7fbd502",
  "content": "需要包含数据分析和结论",
  "dueDate": "2024-12-31T23:59:59Z",
  "priority": 3
}
```

#### `get_tasks`

获取任务列表

参数：

- `projectId` (可选): 项目ID
- `limit` (可选): 限制返回数量
- `offset` (可选): 偏移量

#### `update_task`

更新任务

参数：

- `taskId` (必需): 任务ID
- `title` (可选): 任务标题
- `content` (可选): 任务内容
- `dueDate` (可选): 截止日期
- `priority` (可选): 优先级
- `status` (可选): 任务状态 (0: 未完成, 1: 已完成)

#### `delete_task`

删除任务

参数：

- `taskId` (必需): 任务ID

### 项目管理

#### `get_projects`

获取项目列表

无参数需要。

#### `create_project`

创建新项目

参数：

- `name` (必需): 项目名称
- `color` (可选): 项目颜色
- `groupId` (可选): 项目组ID

## 可用资源

### `dida365://tasks`

获取所有任务的JSON格式概览

### `dida365://projects`

获取所有项目的JSON格式概览

## 项目结构

```
├── src/
│   └── index.ts          # 主服务器文件
├── dist/                 # 编译输出目录
├── .env.example          # 环境变量示例
├── package.json          # 项目配置
├── tsconfig.json        # TypeScript 配置
└── README.md            # 项目文档
```

## API 接口说明

本服务使用滴答清单官方 API：

- 基础URL: `https://api.dida365.com/open/v1`
- 认证方式: Bearer Token
- 请求格式: JSON
- 官方文档: https://developer.dida365.com/api#/openap

### 请求示例

创建任务的HTTP请求：

```http
POST https://api.dida365.com/open/v1/task
Content-Type: application/json
Authorization: Bearer 76ff983e-1e86-430b-ada4-8d237c50b208

{
  "title": "测试日程",
  "projectId": "6889c028e4b0c0adf7fbd502"
}
```

## 错误处理

服务包含完整的错误处理机制：

- API 调用失败时返回详细错误信息
- 网络错误和超时处理
- 参数验证和类型检查
- Token 验证

## 开发说明

### 添加新功能

1. 在接口类型定义部分添加新的类型
2. 在工具列表中注册新工具
3. 在工具调用处理器中实现具体逻辑
4. 更新文档

### 调试

启用调试模式：

```bash
DEBUG=* npm run dev
```

### 测试

建议使用 MCP 客户端工具测试服务：

```bash
# 使用 MCP 检查器
npx @modelcontextprotocol/inspector
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 注意事项

- 确保你的滴答清单账号已启用开放平台功能
- API Token 具有一定的访问限制，请合理使用
- 建议在生产环境中使用更安全的环境变量管理方案
- 定期更新依赖包以获得安全修复