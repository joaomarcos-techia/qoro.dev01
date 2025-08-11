
'use server';
/**
 * @fileOverview Task management services.
 */

import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { TaskSchema, TaskProfileSchema } from '@/ai/schemas';
import { getAdminAndOrg } from './utils';
import { adminDb } from '@/lib/firebase-admin';


export const createTask = async (input: z.infer<typeof TaskSchema>, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);

    const newTaskData = {
        ...input,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        creatorId: actorUid,
        companyId: organizationId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };

    const taskRef = await adminDb.collection('tasks').add(newTaskData);

    return { id: taskRef.id };
};

export const listTasks = async (actorUid: string): Promise<z.infer<typeof TaskProfileSchema>[]> => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    
    const tasksSnapshot = await adminDb.collection('tasks')
                                     .where('companyId', '==', organizationId)
                                     .orderBy('createdAt', 'desc')
                                     .get();
    
    if (tasksSnapshot.empty) {
        return [];
    }

    const userIds = [...new Set(tasksSnapshot.docs.map(doc => doc.data().responsibleUserId).filter(Boolean))];
    const users: Record<string, { name?: string }> = {};

    if (userIds.length > 0) {
        const usersSnapshot = await adminDb.collection('users').where('__name__', 'in', userIds).get();
        usersSnapshot.forEach(doc => {
            users[doc.id] = { name: doc.data().name };
        });
    }
    
    const tasks: z.infer<typeof TaskProfileSchema>[] = tasksSnapshot.docs.map(doc => {
        const data = doc.data();
        const dueDate = data.dueDate ? data.dueDate.toDate().toISOString() : null;
        const responsibleUserInfo = data.responsibleUserId ? users[data.responsibleUserId] : {};

        return TaskProfileSchema.parse({
            id: doc.id,
            ...data,
            dueDate,
            creatorId: data.creatorId,
            createdAt: data.createdAt.toDate().toISOString(),
            updatedAt: data.updatedAt.toDate().toISOString(),
            responsibleUserName: responsibleUserInfo?.name,
        });
    });
    
    return tasks;
};

export const getDashboardMetrics = async (actorUid: string): Promise<{ totalTasks: number; completedTasks: number; inProgressTasks: number; pendingTasks: number; }> => {
    const { organizationId } = await getAdminAndOrg(actorUid);

    const tasksRef = adminDb.collection('tasks').where('companyId', '==', organizationId);

    const totalPromise = tasksRef.count().get();
    const completedPromise = tasksRef.where('status', '==', 'done').count().get();
    const inProgressPromise = tasksRef.where('status', '==', 'in_progress').count().get();
    const pendingPromise = tasksRef.where('status', '==', 'todo').count().get();
    
    const [
        totalSnapshot,
        completedSnapshot,
        inProgressSnapshot,
        pendingSnapshot,
    ] = await Promise.all([
        totalPromise, 
        completedPromise, 
        inProgressPromise, 
        pendingPromise
    ]);

    return {
        totalTasks: totalSnapshot.data().count,
        completedTasks: completedSnapshot.data().count,
        inProgressTasks: inProgressSnapshot.data().count,
        pendingTasks: pendingSnapshot.data().count,
    };
};
