import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ErrorCode,
    ListResourcesRequestSchema,
    ListToolsRequestSchema,
    McpError,
    ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios, { AxiosResponse } from "axios";
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

// 接口类型定义
interface ChecklistItem {
    id?: string;                     // Subtask identifier
    title?: string;                  // Subtask title
    status?: 0 | 1 |number;                  // Completion status: Normal: 0, Completed: 1
    completedTime?: string;          // Completed time in "yyyy-MM-dd'T'HH:mm:ssZ"
    isAllDay?: boolean;              // All day
    sortOrder?: number;              // Subtask sort order
    startDate?: string;              // Start date time in "yyyy-MM-dd'T'HH:mm:ssZ"
    timeZone?: string;               // Subtask timezone
}

interface Task {
    id?: string;                     // Task identifier
    projectId?: string;              // Task project id
    title?: string;                  // Task title
    isAllDay?: boolean;              // All day
    completedTime?: string;          // Task completed time in "yyyy-MM-dd'T'HH:mm:ssZ"
    content?: string;                // Task content
    desc?: string;                   // Task description of checklist
    dueDate?: string;                // Task due date time in "yyyy-MM-dd'T'HH:mm:ssZ"
    items?: ChecklistItem[];         // Subtasks of Task
    priority?: 0 | 1 | 3 | 5 | number;        // Task priority: None:0, Low:1, Medium:3, High:5
    reminders?: string[];            // List of reminder triggers
    repeatFlag?: string;             // Recurring rules of task
    sortOrder?: number;              // Task sort order
    startDate?: string;              // Start date time in "yyyy-MM-dd'T'HH:mm:ssZ"
    status?: 0 | 2 | number;                  // Task completion status: Normal: 0, Completed: 2
    timeZone?: string;               // Task timezone
}

interface Project {
    id?: string;
    name?: string;
    color?: string;
    sortOrder?: number;
    viewMode? : string;
    kind? :string;
    closed?:boolean;
    groupId?: string;
    permission?:string;



}

interface TaskListResponse {
    tasks: Task[];
    total: number;
}

interface ProjectListResponse {
    projects: Project[];
}

// 创建服务器实例
const server = new Server(
    {
        name: "dida365-mcp-server",
        version: "1.0.0",
    },
);

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
                name: "get_task_by_projectId_and_taskId",
                description: "通过项目ID和任务ID获取任务",
                inputSchema: {
                    type: "object",
                    properties: {
                        projectId: {
                            type: "string",
                            description: "项目ID",
                        },
                        taskId: {
                            type: "string",
                            description: "任务ID"
                        }
                    },
                    required: ["projectId","taskId"]
                }
            },
            {
                name: "get_tasks_by_projectId",
                description: "通过项目ID获取项目中的任务列表",
                inputSchema: {
                    type: "object",
                    properties: {
                        projectId: {
                            type: "string",
                            description: "项目ID",
                        },
                    },
                    required: ["projectId"],
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
                        projectId: {
                            type: "string",
                            description: "项目ID"
                        }
                    },
                    required: ["taskId","projectId"],
                },
            },
            {
                name: "complete_task",
                description: "完成任务",
                inputSchema: {
                    type: "object",
                    properties: {
                        taskId: {
                            type: "string",
                            description: "任务ID",
                        },
                        projectId: {
                            type: "string",
                            description: "项目ID"
                        }
                    },
                    required: ["taskId","projectId"],
                },
            },
            {
                name: "get_projects",
                description: "获取项目列表",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
                required: [],
            },
            {
                name: "get_project_by_projectId",
                description: "根据项目ID获取项目",
                inputSchema: {  // 修正为 inputSchema
                    type: "object",
                    properties: {
                        projectId: {
                            type: "string",
                            description: "项目ID"
                        }
                    },
                    required: ["projectId"]
                }
            },
            {
                name: "create_project",
                description: "创建新项目",
                inputSchema: {
                    type: "object",
                    properties: {
                        name: {
                            type: "string",
                            description: "name of the project",
                        },
                        color: {
                            type: "string",
                            description: 'color of project, eg. "#F18181"',
                        },
                        sortOrder:{
                            type:"integer (int64)",
                            description:"sort order value, default 0"
                        },
                        viewMode:{
                            type:"string",
                            description:'view mode, "list", "kanban", "timeline"'
                        },
                        kind:{
                            type:"string",
                            description:'project kind, "TASK", "NOTE"'
                        }
                    },
                    required: ["name"],
                },
            },
            {
                name: "update_project_by_projectID",
                description: "根据projectId更新项目",
                inputSchema: {
                    type: "object",
                    properties: {
                        projectId:{
                            type: "string",
                            description: "项目Id"
                        },
                        name: {
                            type: "string",
                            description: "项目名称"
                        },
                        color: {
                            type: "string",
                            description: "项目颜色",
                        },
                        sortOrder:{
                            type:"integer (int64)",
                            description:"sort order value, default 0"
                        },
                        viewMode:{
                            type:"string",
                            description:'view mode, "list", "kanban", "timeline"'
                        },
                        kind:{
                            type:"string",
                            description:'project kind, "TASK", "NOTE"'
                        }
                    },
                    required: ["projectId"],
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
                const task: Task = {
                    title: args.title as string,
                    projectId: args.projectId as string,
                };

                if (args.content) task.content = args.content as string;
                if (args.dueDate) task.dueDate = args.dueDate as string;
                if (args.priority !== undefined) task.priority = args.priority as number;

                const response: AxiosResponse = await dida365Api.post("/task", task);

                return {
                    content: [
                        {
                            type: "text",
                            text: `任务创建成功: ${JSON.stringify(response.data, null, 2)}`,
                        },
                    ],
                };
            }
            case "get_task_by_projectId_and_taskId":{
                const params: Record<string, any> = {};
                if(!args.projectId||!args.taskId) throw new McpError(ErrorCode.InvalidRequest, "项目ID或任务ID为空")
                if (args.projectId) params.projectId = args.projectId;
                if (args.taskId) params.taskId = args.taskId;
                const response = await dida365Api.get(`/project/${params.projectId}/task/${params.taskId}`);

                return {
                    content: [
                        {
                            type: "text",
                            text: `任务: ${JSON.stringify(response.data, null, 2)}`,
                        },
                    ],
                };
            }
            case "get_tasks_by_projectId": {
                const params: Record<string, any> = {};
                if (args.projectId) params.projectId = args.projectId;
                else throw new McpError(ErrorCode.InvalidRequest, "项目名称为空");
                const response = await dida365Api.get(`/project/${params.projectId}/data`);

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
                const taskId = args.taskId as string;
                const updateData: Partial<Task> = {};

                if (args.title) updateData.title = args.title as string;
                if (args.content) updateData.content = args.content as string;
                if (args.dueDate) updateData.dueDate = args.dueDate as string;
                if (args.priority !== undefined) updateData.priority = args.priority as number;
                if (args.status !== undefined) updateData.status = args.status as number;

                const response: AxiosResponse = await dida365Api.put(`/task/${taskId}`, updateData);

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
                const taskId = args.taskId as string;
                const projectId = args.projectId as string;
                throwValidError(projectId,taskId);
                await dida365Api.delete(`/project/${projectId}/task/${taskId}`);

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
                const response: AxiosResponse<ProjectListResponse> = await dida365Api.get("/project");

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
                const project: Project = {
                    name: args.name as string,
                    ...(args.color ? {color: args.color as string} : {}),
                    ...(args.sortOrder ? {sortOrder: args.sortOrder as number} : 0),
                    ...(args.viewMode ? {viewMode: args.viewMode as string} : {}),
                    ...(args.kind ? {kind: args.kind as string} : {}),
                };

                const response: AxiosResponse = await dida365Api.post("/project", project);

                return {
                    content: [
                        {
                            type: "text",
                            text: `项目创建成功: ${JSON.stringify(response.data, null, 2)}`,
                        },
                    ],
                };
            }
            case "update_project_by_projectID":{
                const project: Project = {
                    id : args.projectId as string,
                    name: args.name as string,
                    ...(args.color ? { color: args.color as string } : {}),
                    ...(args.sortOrder ? {sortOrder: args.sortOrder as number}:0),
                    ...(args.viewMode ? {viewMode: args.viewMode as string}:{}),
                    ...(args.kind ? {kind:args.kind as string}:{})
                };
                throwValidError(args.projectId as string,"1");
                const response: AxiosResponse = await dida365Api.post("/project", project);

                return {
                    content: [
                        {
                            type: "text",
                            text: `项目创建成功: ${JSON.stringify(response.data, null, 2)}`,
                        },
                    ],
                };
            }
            case "complete_task":{
                const taskId = args.taskId as string;
                const projectId = args.projectId as string;
                throwValidError(projectId,taskId);

                const response: AxiosResponse = await  dida365Api.post(`/project/${projectId}/task/${taskId}/complete`)

                return {
                    content:[
                        {
                            type:"text",
                            text: `任务更新: ${JSON.stringify(response.data, null, 2)}`
                        }
                    ]
                }
            }
            case "get_project_by_projectId":{
                const projectId = args.projectId as string;
                throwValidError(projectId,"1");
                const response: AxiosResponse = await  dida365Api.get(`project/${projectId}`);
                return {
                    content:[
                        {
                            type:"text",
                            text: `获取project成功: ${JSON.stringify(response.data, null, 2)}`
                        }
                    ]
                }
            }

            default:
                throw new McpError(
                    ErrorCode.MethodNotFound,
                    `未知工具: ${name}`
                );
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.message;
            throw new McpError(
                ErrorCode.InternalError,
                `滴答清单API调用失败 (${status}): ${message}`
            );
        }
        throw new McpError(
            ErrorCode.InternalError,
            `工具执行失败: ${error instanceof Error ? error.message : String(error)}`
        );
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
                const response: AxiosResponse<TaskListResponse> = await dida365Api.get("/task");
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
                const response: AxiosResponse<ProjectListResponse> = await dida365Api.get("/project");
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
                throw new McpError(
                    ErrorCode.InvalidRequest,
                    `未知资源URI: ${uri}`
                );
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.message;
            throw new McpError(
                ErrorCode.InternalError,
                `滴答清单API调用失败 (${status}): ${message}`
            );
        }
        throw new McpError(
            ErrorCode.InternalError,
            `资源获取失败: ${error instanceof Error ? error.message : String(error)}`
        );
    }
});
function throwValidError(projectId : string,taskId : string){
    if(!projectId&&!taskId) throw new McpError(ErrorCode.InvalidRequest,"projectId 和 taskId 为空")
    if(!projectId) throw new McpError(ErrorCode.InvalidRequest,"projectId 为空")
    if(!taskId) throw new McpError(ErrorCode.InvalidRequest,"taskId 为空")
}

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