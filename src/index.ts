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
    },{
        capabilities: {
            tools: {},
            resources: {},
        },
    }
);

// 工具列表
// 工具列表
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "create_task",
                description: "Create a new task in Dida365 with specified details including title, project ID, content, due date and priority. The task will be created under the specified project. Requires at least title and projectId. Returns the created task details.",
                inputSchema: {
                    type: "object",
                    properties: {
                        title: {
                            type: "string",
                            description: "The title/name of the task (required)",
                        },
                        projectId: {
                            type: "string",
                            description: "The ID of the project where this task belongs (required)",
                        },
                        content: {
                            type: "string",
                            description: "Detailed description/content of the task",
                        },
                        dueDate: {
                            type: "string",
                            description: "Due date in ISO 8601 format (e.g., 2023-12-31T23:59:59Z)",
                        },
                        priority: {
                            type: "number",
                            description: "Priority level from 0 (none) to 5 (highest)",
                        },
                    },
                    required: ["title", "projectId"],
                },
            },
            {
                name: "get_task_by_projectId_and_taskId",
                description: "Retrieve a specific task's details by providing both the project ID and task ID. Returns complete task information including title, content, status, due date, priority, and subtasks if any.",
                inputSchema: {
                    type: "object",
                    properties: {
                        projectId: {
                            type: "string",
                            description: "The ID of the project containing the task (required)"
                        },
                        taskId: {
                            type: "string",
                            description: "The ID of the task to retrieve (required)"
                        }
                    },
                    required: ["projectId","taskId"]
                }
            },
            {
                name: "get_tasks_by_projectId",
                description: "Get all tasks belonging to a specific project by project ID. Returns a list of tasks with their basic information. Useful for viewing all tasks in a project.",
                inputSchema: {
                    type: "object",
                    properties: {
                        projectId: {
                            type: "string",
                            description: "The ID of the project whose tasks you want to list (required)",
                        },
                    },
                    required: ["projectId"],
                },
            },
            {
                name: "update_task",
                description: "Modify an existing task's properties. Can update title, content, due date, priority or status. At least taskId is required. Returns the updated task details.",
                inputSchema: {
                    type: "object",
                    properties: {
                        taskId: {
                            type: "string",
                            description: "The ID of the task to update (required)",
                        },
                        title: {
                            type: "string",
                            description: "New title for the task",
                        },
                        content: {
                            type: "string",
                            description: "New content/description for the task",
                        },
                        dueDate: {
                            type: "string",
                            description: "New due date in ISO 8601 format",
                        },
                        priority: {
                            type: "number",
                            description: "Updated priority level (0-5)",
                        },
                        status: {
                            type: "number",
                            description: "Task completion status (0: incomplete, 1: complete)",
                        },
                    },
                    required: ["taskId"],
                },
            },
            {
                name: "delete_task",
                description: "Permanently delete a task from a project. Requires both task ID and project ID for confirmation. Returns success message upon deletion.",
                inputSchema: {
                    type: "object",
                    properties: {
                        taskId: {
                            type: "string",
                            description: "The ID of the task to delete (required)",
                        },
                        projectId: {
                            type: "string",
                            description: "The ID of the project containing the task (required)"
                        }
                    },
                    required: ["taskId","projectId"],
                },
            },
            {
                name: "complete_task",
                description: "Mark a task as completed. Requires both task ID and project ID. Updates the task's status to completed and sets completion timestamp.",
                inputSchema: {
                    type: "object",
                    properties: {
                        taskId: {
                            type: "string",
                            description: "The ID of the task to mark as complete (required)",
                        },
                        projectId: {
                            type: "string",
                            description: "The ID of the project containing the task (required)"
                        }
                    },
                    required: ["taskId","projectId"],
                },
            },
            {
                name: "get_projects",
                description: "Retrieve a list of all projects in the Dida365 account. Returns project details including ID, name, color, view mode and sort order. No parameters required.",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
                required: [],
            },
            {
                name: "get_project_by_projectId",
                description: "Get detailed information about a specific project by its ID. Returns project metadata including name, color, view mode, kind and sort order.",
                inputSchema: {
                    type: "object",
                    properties: {
                        projectId: {
                            type: "string",
                            description: "The ID of the project to retrieve (required)"
                        }
                    },
                    required: ["projectId"]
                }
            },
            {
                name: "create_project",
                description: "Create a new project in Dida365. Requires at least a project name. Can specify color, view mode, kind and sort order. Returns the created project details.",
                inputSchema: {
                    type: "object",
                    properties: {
                        name: {
                            type: "string",
                            description: "Name of the new project (required)",
                        },
                        color: {
                            type: "string",
                            description: 'Hex color code for the project (e.g., "#F18181")',
                        },
                        sortOrder:{
                            type:"integer",
                            description:"Numerical sort order value (default 0)"
                        },
                        viewMode:{
                            type:"string",
                            description:'View mode: "list", "kanban", or "timeline"'
                        },
                        kind:{
                            type:"string",
                            description:'Project type: "TASK" or "NOTE"'
                        }
                    },
                    required: ["name"],
                },
            },
            {
                name: "update_project_by_projectID",
                description: "Update an existing project's properties. Requires project ID. Can modify name, color, view mode, kind and sort order. Returns updated project details.",
                inputSchema: {
                    type: "object",
                    properties: {
                        projectId:{
                            type: "string",
                            description: "The ID of the project to update (required)"
                        },
                        name: {
                            type: "string",
                            description: "New name for the project"
                        },
                        color: {
                            type: "string",
                            description: "New hex color code for the project",
                        },
                        sortOrder:{
                            type:"integer",
                            description:"Updated sort order value"
                        },
                        viewMode:{
                            type:"string",
                            description:'Updated view mode: "list", "kanban", or "timeline"'
                        },
                        kind:{
                            type:"string",
                            description:'Updated project kind: "TASK" or "NOTE"'
                        }
                    },
                    required: ["projectId"],
                },
            },
            {
                name: "delete_project_by_projectID",
                description: "Permanently delete a project by its ID. This will also delete all tasks within the project. Returns success message upon deletion.",
                inputSchema: {
                    type: "object",
                    properties: {
                        projectId:{
                            type: "string",
                            description: "The ID of the project to delete (required)"
                        }
                    },
                    required: ["projectId"],
                },
            }
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
            case "delete_project_by_projectID":{
                const projectId:string = args.projectId as string;
                throwValidError(projectId,"1");

                const response: AxiosResponse = await dida365Api.delete(`/project/${projectId}`);
                return {
                    content: [
                        {
                            type: "text",
                            text: `删除项目成功: ${JSON.stringify(response.data, null, 2)}`,
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