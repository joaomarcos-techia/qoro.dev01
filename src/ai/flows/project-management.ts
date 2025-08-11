
'use server';
/**
 * @fileOverview Project management flows.
 * - createProject - Creates a new project.
 * - listProjects - Lists all projects for the user's organization.
 * - getProjectWithTasks - Retrieves a project and its associated tasks.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ProjectSchema, ProjectProfileSchema, TaskProfileSchema } from '@/ai/schemas';
import * as projectService from '@/services/projectService';

const ActorSchema = z.object({ actor: z.string() });

const ProjectDetailsOutputSchema = z.object({
    project: ProjectProfileSchema,
    tasks: z.array(TaskProfileSchema),
});

const GetProjectInputSchema = z.object({
    projectId: z.string(),
}).extend(ActorSchema.shape);


// Define flows
const createProjectFlow = ai.defineFlow(
    { 
        name: 'createProjectFlow', 
        inputSchema: ProjectSchema.extend(ActorSchema.shape), 
        outputSchema: z.object({ id: z.string() }) 
    },
    async (input) => projectService.createProject(input, input.actor)
);

const listProjectsFlow = ai.defineFlow(
    { 
        name: 'listProjectsFlow', 
        inputSchema: ActorSchema, 
        outputSchema: z.array(ProjectProfileSchema) 
    },
    async ({ actor }) => projectService.listProjects(actor)
);

const getProjectWithTasksFlow = ai.defineFlow(
    {
        name: 'getProjectWithTasksFlow',
        inputSchema: GetProjectInputSchema,
        outputSchema: ProjectDetailsOutputSchema,
    },
    async ({ projectId, actor }) => projectService.getProjectWithTasks(projectId, actor)
);


// Exported functions (client-callable wrappers)
export async function createProject(input: z.infer<typeof ProjectSchema> & z.infer<typeof ActorSchema>): Promise<{ id: string; }> {
    return createProjectFlow(input);
}

export async function listProjects(input: z.infer<typeof ActorSchema>): Promise<z.infer<typeof ProjectProfileSchema>[]> {
    return listProjectsFlow(input);
}

export async function getProjectWithTasks(input: z.infer<typeof GetProjectInputSchema>): Promise<z.infer<typeof ProjectDetailsOutputSchema>> {
    return getProjectWithTasksFlow(input);
}
