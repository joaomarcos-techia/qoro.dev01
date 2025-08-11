
'use server';
/**
 * @fileOverview Task management flows.
 * - createTask - Creates a new task.
 * - listTasks - Lists all tasks for the user's organization.
 * - getDashboardMetrics - Retrieves key metrics for the Task dashboard.
 * - updateTaskStatus - Updates the status of a task.
 * - deleteTask - Deletes a task permanently.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { TaskSchema, TaskProfileSchema } from '@/ai/schemas';
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

const getDashboardMetricsFlow = ai.defineFlow(
    {
        name: 'getTaskDashboardMetricsFlow',
        inputSchema: ActorSchema,
        outputSchema: DashboardMetricsOutputSchema
    },
    async ({ actor }) => taskService.getDashboardMetrics(actor)
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


// Exported functions (client-callable wrappers)
export async function createTask(input: z.infer<typeof TaskSchema> & z.infer<typeof ActorSchema>): Promise<{ id: string; }> {
    return createTaskFlow(input);
}

export async function listTasks(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof TaskProfileSchema>[]> {
    return listTasksFlow(input);
}

export async function getDashboardMetrics(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof DashboardMetricsOutputSchema>> {
    return getDashboardMetricsFlow(input);
}

export async function updateTaskStatus(input: z.infer<typeof UpdateTaskStatusInputSchema>): Promise<{ id: string; status: z.infer<typeof TaskProfileSchema>['status'] }> {
    return updateTaskStatusFlow(input);
}

export async function deleteTask(input: z.infer<typeof DeleteTaskInputSchema>): Promise<{ id: string; success: boolean }> {
    return deleteTaskFlow(input);
}
