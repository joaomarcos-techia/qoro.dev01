
'use server';
/**
 * @fileOverview Task management flows.
 * - createTask - Creates a new task.
 * - listTasks - Lists all tasks for the user's organization.
 * - getTaskDashboardMetrics - Retrieves key metrics for the Task dashboard.
 * - getOverviewMetrics - Retrieves metrics and task lists for the Overview page.
 * - updateTaskStatus - Updates the status of a task.
 * - deleteTask - Deletes a task permanently.
 * - updateTask - Updates the details of a task.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { TaskSchema, TaskProfileSchema, UpdateTaskSchema } from '@/ai/schemas';
import * as taskService from '@/services/taskService';

const ActorSchema = z.object({ actor: z.string() });

const UpdateTaskStatusInputSchema = z.object({
    taskId: z.string(),
    status: TaskProfileSchema.shape.status,
}).extend(ActorSchema.shape);

const DeleteTaskInputSchema = z.object({
    taskId: z.string(),
}).extend(ActorSchema.shape);

const DashboardMetricsOutputSchema = z.object({
    totalTasks: z.number(),
    completedTasks: z.number(),
    inProgressTasks: z.number(),
    pendingTasks: z.number(),
    overdueTasks: z.number(),
    tasksByPriority: z.record(z.number()),
});

const OverviewMetricsOutputSchema = DashboardMetricsOutputSchema.extend({
    overdue: z.array(TaskProfileSchema),
    dueSoon: z.array(TaskProfileSchema),
});


// Define flows
const createTaskFlow = ai.defineFlow(
    { 
        name: 'createTaskFlow', 
        inputSchema: TaskSchema.extend(ActorSchema.shape), 
        outputSchema: z.object({ id: z.string() }) 
    },
    async (input) => taskService.createTask(input, input.actor)
);

const listTasksFlow = ai.defineFlow(
    { 
        name: 'listTasksFlow', 
        inputSchema: ActorSchema, 
        outputSchema: z.array(TaskProfileSchema) 
    },
    async ({ actor }) => taskService.listTasks(actor)
);

const getTaskDashboardMetricsFlow = ai.defineFlow(
    {
        name: 'getTaskDashboardMetricsFlow',
        inputSchema: ActorSchema,
        outputSchema: DashboardMetricsOutputSchema
    },
    async ({ actor }) => taskService.getTaskDashboardMetrics(actor)
);

const getOverviewMetricsFlow = ai.defineFlow(
    {
        name: 'getTaskOverviewMetricsFlow',
        inputSchema: ActorSchema,
        outputSchema: OverviewMetricsOutputSchema,
    },
    async ({ actor }) => taskService.getOverviewMetrics(actor)
);

const updateTaskStatusFlow = ai.defineFlow(
    {
        name: 'updateTaskStatusFlow',
        inputSchema: UpdateTaskStatusInputSchema,
        outputSchema: z.object({ id: z.string(), status: TaskProfileSchema.shape.status })
    },
    async (input) => taskService.updateTaskStatus(input.taskId, input.status, input.actor)
);

const deleteTaskFlow = ai.defineFlow(
    {
        name: 'deleteTaskFlow',
        inputSchema: DeleteTaskInputSchema,
        outputSchema: z.object({ id: z.string(), success: z.boolean() })
    },
    async (input) => taskService.deleteTask(input.taskId, input.actor)
);

const updateTaskFlow = ai.defineFlow(
    {
        name: 'updateTaskFlow',
        inputSchema: UpdateTaskSchema.extend(ActorSchema.shape),
        outputSchema: z.object({ id: z.string() })
    },
    async (input) => taskService.updateTask(input.id, input, input.actor)
);


// Exported functions (client-callable wrappers)
export async function createTask(input: z.infer<typeof TaskSchema> & z.infer<typeof ActorSchema>): Promise<{ id: string; }> {
    return createTaskFlow(input);
}

export async function listTasks(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof TaskProfileSchema>[]> {
    return listTasksFlow(input);
}

export async function getTaskDashboardMetrics(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof DashboardMetricsOutputSchema>> {
    return getTaskDashboardMetricsFlow(input);
}

export async function getOverviewMetrics(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof OverviewMetricsOutputSchema>> {
    return getOverviewMetricsFlow(input);
}

export async function updateTaskStatus(input: z.infer<typeof UpdateTaskStatusInputSchema>): Promise<{ id: string; status: z.infer<typeof TaskProfileSchema>['status'] }> {
    return updateTaskStatusFlow(input);
}

export async function deleteTask(input: z.infer<typeof DeleteTaskInputSchema>): Promise<{ id: string; success: boolean }> {
    return deleteTaskFlow(input);
}

export async function updateTask(input: z.infer<typeof UpdateTaskSchema> & z.infer<typeof ActorSchema>): Promise<{ id: string; }> {
    return updateTaskFlow(input);
}
