import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ErrorCode, ListResourcesRequestSchema, ListToolsRequestSchema, McpError, ReadResourceRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import dotenv from "dotenv";
// 加载环境变量
dotenv.config();
// 滴答清单API基础配置
const DIDA365_BASE_URL = "https://api.dida365.com/open/v1";
const DIDA365_TOKEN = process.env.DIDA365_TOKEN;
if (!DIDA365_TOKEN) {
    console.error("Error: DIDA365_TOKEN not found in environment variables");
    process.exit(1);
}
// 创建axios实例
const dida365Api = axios.create({
    baseURL: DIDA365_BASE_URL,
    headers: {
        "Content-Type": "application/json",
        Authorization: DIDA365_TOKEN,
    },
});
// 创建服务器实例
const server = new Server({
    name: "dida365-mcp-server",
    version: "1.0.0",
});
// 工具列表
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "create_task",
                description: "创建新任务",
                inputSchema: {
                    type: "object",
                    properties: {
                        title: {
                            type: "string",
                            description: "任务标题",
                        },
                        projectId: {
                            type: "string",
                            description: "项目ID",
                        },
                        content: {
                            type: "string",
                            description: "任务内容描述",
                        },
                        dueDate: {
                            type: "string",
                            description: "截止日期 (ISO 8601格式)",
                        },
                        priority: {
                            type: "number",
                            description: "优先级 (0-5)",
                        },
                    },
                    required: ["title", "projectId"],
                },
            },
            {
                name: "get_tasks",
                description: "获取任务列表",
                inputSchema: {
                    type: "object",
                    properties: {
                        projectId: {
                            type: "string",
                            description: "项目ID (可选)",
                        },
                        limit: {
                            type: "number",
                            description: "限制返回数量",
                        },
                        offset: {
                            type: "number",
                            description: "偏移量",
                        },
                    },
                    required: [],
                },
            },
            {
                name: "update_task",
                description: "更新任务",
                inputSchema: {
                    type: "object",
                    properties: {
                        taskId: {
                            type: "string",
                            description: "任务ID",
                        },
                        title: {
                            type: "string",
                            description: "任务标题",
                        },
                        content: {
                            type: "string",
                            description: "任务内容",
                        },
                        dueDate: {
                            type: "string",
                            description: "截止日期",
                        },
                        priority: {
                            type: "number",
                            description: "优先级",
                        },
                        status: {
                            type: "number",
                            description: "任务状态 (0: 未完成, 1: 已完成)",
                        },
                    },
                    required: ["taskId"],
                },
            },
            {
                name: "delete_task",
                description: "删除任务",
                inputSchema: {
                    type: "object",
                    properties: {
                        taskId: {
                            type: "string",
                            description: "任务ID",
                        },
                    },
                    required: ["taskId"],
                },
            },
            {
                name: "get_projects",
                description: "获取项目列表",
                inputSchema: {
                    type: "object",
                    properties: {},
                    required: [],
                },
            },
            {
                name: "create_project",
                description: "创建新项目",
                inputSchema: {
                    type: "object",
                    properties: {
                        name: {
                            type: "string",
                            description: "项目名称",
                        },
                        color: {
                            type: "string",
                            description: "项目颜色",
                        },
                        groupId: {
                            type: "string",
                            description: "项目组ID",
                        },
                    },
                    required: ["name"],
                },
            },
        ],
    };
});
// 工具调用处理器
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (!args) {
        throw new McpError(ErrorCode.InvalidRequest, "参数不能为空");
    }
    try {
        switch (name) {
            case "create_task": {
                const task = {
                    title: args.title,
                    projectId: args.projectId,
                };
                if (args.content)
                    task.content = args.content;
                if (args.dueDate)
                    task.dueDate = args.dueDate;
                if (args.priority !== undefined)
                    task.priority = args.priority;
                const response = await dida365Api.post("/task", task);
                return {
                    content: [
                        {
                            type: "text",
                            text: `任务创建成功: ${JSON.stringify(response.data, null, 2)}`,
                        },
                    ],
                };
            }
            case "get_tasks": {
                const params = {};
                if (args.projectId)
                    params.projectId = args.projectId;
                if (args.limit)
                    params.limit = args.limit;
                if (args.offset)
                    params.offset = args.offset;
                const response = await dida365Api.get("/task", { params });
                return {
                    content: [
                        {
                            type: "text",
                            text: `任务列表: ${JSON.stringify(response.data, null, 2)}`,
                        },
                    ],
                };
            }
            case "update_task": {
                const taskId = args.taskId;
                const updateData = {};
                if (args.title)
                    updateData.title = args.title;
                if (args.content)
                    updateData.content = args.content;
                if (args.dueDate)
                    updateData.dueDate = args.dueDate;
                if (args.priority !== undefined)
                    updateData.priority = args.priority;
                if (args.status !== undefined)
                    updateData.status = args.status;
                const response = await dida365Api.put(`/task/${taskId}`, updateData);
                return {
                    content: [
                        {
                            type: "text",
                            text: `任务更新成功: ${JSON.stringify(response.data, null, 2)}`,
                        },
                    ],
                };
            }
            case "delete_task": {
                const taskId = args.taskId;
                await dida365Api.delete(`/task/${taskId}`);
                return {
                    content: [
                        {
                            type: "text",
                            text: `任务 ${taskId} 删除成功`,
                        },
                    ],
                };
            }
            case "get_projects": {
                const response = await dida365Api.get("/project");
                return {
                    content: [
                        {
                            type: "text",
                            text: `项目列表: ${JSON.stringify(response.data, null, 2)}`,
                        },
                    ],
                };
            }
            case "create_project": {
                const project = {
                    name: args.name,
                    ...(args.color ? { color: args.color } : {}),
                    ...(args.groupId ? { groupId: args.groupId } : {}),
                };
                const response = await dida365Api.post("/project", project);
                return {
                    content: [
                        {
                            type: "text",
                            text: `项目创建成功: ${JSON.stringify(response.data, null, 2)}`,
                        },
                    ],
                };
            }
            default:
                throw new McpError(ErrorCode.MethodNotFound, `未知工具: ${name}`);
        }
    }
    catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.message;
            throw new McpError(ErrorCode.InternalError, `滴答清单API调用失败 (${status}): ${message}`);
        }
        throw new McpError(ErrorCode.InternalError, `工具执行失败: ${error instanceof Error ? error.message : String(error)}`);
    }
});
// 资源列表处理器
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: [
            {
                uri: "dida365://tasks",
                mimeType: "application/json",
                name: "滴答清单任务",
                description: "获取所有任务的概览",
            },
            {
                uri: "dida365://projects",
                mimeType: "application/json",
                name: "滴答清单项目",
                description: "获取所有项目的概览",
            },
        ],
    };
});
// 资源读取处理器
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    try {
        switch (uri) {
            case "dida365://tasks": {
                const response = await dida365Api.get("/task");
                return {
                    contents: [
                        {
                            uri,
                            mimeType: "application/json",
                            text: JSON.stringify(response.data, null, 2),
                        },
                    ],
                };
            }
            case "dida365://projects": {
                const response = await dida365Api.get("/project");
                return {
                    contents: [
                        {
                            uri,
                            mimeType: "application/json",
                            text: JSON.stringify(response.data, null, 2),
                        },
                    ],
                };
            }
            default:
                throw new McpError(ErrorCode.InvalidRequest, `未知资源URI: ${uri}`);
        }
    }
    catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.message;
            throw new McpError(ErrorCode.InternalError, `滴答清单API调用失败 (${status}): ${message}`);
        }
        throw new McpError(ErrorCode.InternalError, `资源获取失败: ${error instanceof Error ? error.message : String(error)}`);
    }
});
// 启动服务器
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("滴答清单 MCP 服务已启动");
}
main().catch((error) => {
    console.error("服务启动失败:", error);
    process.exit(1);
});
