
'use server';
/**
 * @fileOverview Defines Genkit tools for the Task module.
 * These tools allow the AI agent (QoroPulse) to interact with task data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as taskService from '@/services/taskService';
import { TaskProfileSchema, TaskSchema } from '@/ai/schemas';

// Define the tool for listing tasks
export const listTasksTool = ai.defineTool(
    {
        name: 'listTasksTool',
        description: 'Lists all tasks for the organization. Use this to answer questions about tasks, projects, productivity, deadlines, or to-do items.',
        inputSchema: z.object({}), // No specific input needed from the AI
        outputSchema: z.array(TaskProfileSchema),
    },
    async (_, context) => {
        // The actor's UID is passed in the context by the flow
        if (!context?.actor) {
            throw new Error('User authentication is required to list tasks.');
        }
        return taskService.listTasks(context.actor);
    }
);

// Define the tool for creating a task
export const createTaskTool = ai.defineTool(
    {
        name: 'createTaskTool',
        description: 'Creates a new task for the user. Use this when the user asks to be reminded of something, to create a to-do item, or to schedule an activity.',
        inputSchema: TaskSchema.pick({ title: true, description: true, dueDate: true, priority: true, status: true }),
        outputSchema: z.object({ id: z.string() }),
    },
    async (input, context) => {
        if (!context?.actor) {
            throw new Error('User authentication is required to create a task.');
        }
        // The service expects the full TaskSchema, so we provide defaults for fields the AI doesn't set.
        const fullTaskData: z.infer<typeof TaskSchema> = {
            title: input.title,
            description: input.description || undefined,
            dueDate: input.dueDate || null,
            priority: input.priority || 'medium',
            status: input.status || 'todo',
        };
        return taskService.createTask(fullTaskData, context.actor);
    }
);
