
'use server';
/**
 * @fileOverview Project management services.
 */

import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { ProjectSchema, ProjectProfileSchema, TaskProfileSchema } from '@/ai/schemas';
import { getAdminAndOrg } from './utils';
import { adminDb } from '@/lib/firebase-admin';

export const createProject = async (input: z.infer<typeof ProjectSchema>, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);

    const newProjectData = {
        ...input,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        ownerId: actorUid,
        companyId: organizationId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };

    const projectRef = await adminDb.collection('projects').add(newProjectData);
    return { id: projectRef.id };
};

export const listProjects = async (actorUid: string): Promise<z.infer<typeof ProjectProfileSchema>[]> => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    
    const projectsSnapshot = await adminDb.collection('projects')
        .where('companyId', '==', organizationId)
        .orderBy('createdAt', 'desc')
        .get();

    if (projectsSnapshot.empty) return [];

    const projectIds = projectsSnapshot.docs.map(doc => doc.id);
    const tasksSnapshot = await adminDb.collection('tasks')
        .where('companyId', '==', organizationId)
        .where('projectId', 'in', projectIds)
        .get();
        
    const tasksByProject = tasksSnapshot.docs.reduce((acc, doc) => {
        const task = doc.data();
        const projectId = task.projectId;
        if (!acc[projectId]) {
            acc[projectId] = [];
        }
        acc[projectId].push(task);
        return acc;
    }, {} as Record<string, any[]>);

    const projects: z.infer<typeof ProjectProfileSchema>[] = projectsSnapshot.docs.map(doc => {
        const data = doc.data();
        const projectTasks = tasksByProject[doc.id] || [];
        const completedTasks = projectTasks.filter(t => t.status === 'done').length;
        const totalTasks = projectTasks.length;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        
        return ProjectProfileSchema.parse({
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate().toISOString(),
            updatedAt: data.updatedAt.toDate().toISOString(),
            dueDate: data.dueDate ? data.dueDate.toDate().toISOString() : null,
            taskCount: totalTasks,
            completedTaskCount: completedTasks,
            progress: Math.round(progress),
        });
    });

    return projects;
};

export const getProjectWithTasks = async (projectId: string, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    
    const projectRef = adminDb.collection('projects').doc(projectId);
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists || projectDoc.data()?.companyId !== organizationId) {
        throw new Error("Projeto não encontrado ou acesso negado.");
    }
    
    const projectData = projectDoc.data()!;
    const projectTasks = await adminDb.collection('tasks')
        .where('companyId', '==', organizationId)
        .where('projectId', '==', projectId)
        .get();
    
    const taskCount = projectTasks.docs.length;
    const completedTaskCount = projectTasks.docs.filter(doc => doc.data().status === 'done').length;
    const progress = taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0;

    const projectProfile = ProjectProfileSchema.parse({
        id: projectDoc.id,
        ...projectData,
        createdAt: projectData.createdAt.toDate().toISOString(),
        updatedAt: projectData.updatedAt.toDate().toISOString(),
        dueDate: projectData.dueDate ? projectData.dueDate.toDate().toISOString() : null,
        taskCount,
        completedTaskCount,
        progress,
    });
    
    const tasks: z.infer<typeof TaskProfileSchema>[] = projectTasks.docs.map(doc => {
         const data = doc.data();
         return TaskProfileSchema.parse({
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate().toISOString(),
            updatedAt: data.updatedAt.toDate().toISOString(),
            dueDate: data.dueDate ? data.dueDate.toDate().toISOString() : null,
            completedAt: data.completedAt ? data.completedAt.toDate().toISOString() : null,
        });
    });

    return { project: projectProfile, tasks };
};
