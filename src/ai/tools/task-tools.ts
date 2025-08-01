
'use server';
/**
 * @fileOverview Defines Genkit tools for the Task module.
 * These tools allow the AI agent (QoroPulse) to interact with task data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as taskService from '@/services/taskService';
import { TaskProfileSchema } from '@/ai/schemas';

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
