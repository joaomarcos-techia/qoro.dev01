
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
        completedAt: null,
        isArchived: false,
    };

    const taskRef = await adminDb.collection('tasks').add(newTaskData);

    return { id: taskRef.id };
};

export const listTasks = async (actorUid: string): Promise<z.infer<typeof TaskProfileSchema>[]> => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    
    try {
        const tasksQuery = adminDb.collection('tasks')
                                 .where('companyId', '==', organizationId)
                                 .where('isArchived', '==', false)
                                 .orderBy('createdAt', 'desc');

        const tasksSnapshot = await tasksQuery.get();
        
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
        
        // Filter out tasks completed more than 24 hours ago
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const tasks: z.infer<typeof TaskProfileSchema>[] = tasksSnapshot.docs
        .map(doc => {
            const data = doc.data();
            if (data.status === 'done' && data.completedAt && data.completedAt.toDate() < twentyFourHoursAgo) {
                return null;
            }

            const dueDate = data.dueDate ? data.dueDate.toDate().toISOString() : null;
            const completedAt = data.completedAt ? data.completedAt.toDate().toISOString() : null;
            const responsibleUserInfo = data.responsibleUserId ? users[data.responsibleUserId] : {};

            return TaskProfileSchema.parse({
                id: doc.id,
                ...data,
                dueDate,
                completedAt,
                creatorId: data.creatorId,
                createdAt: data.createdAt.toDate().toISOString(),
                updatedAt: data.updatedAt.toDate().toISOString(),
                responsibleUserName: responsibleUserInfo?.name,
            });
        })
        .filter((task): task is z.infer<typeof TaskProfileSchema> => task !== null);
        
        return tasks;
    } catch (error) {
        console.error("Erro ao listar tarefas no Firestore:", error);
        // Lançar um erro mais informativo que pode ser tratado pelo frontend se necessário
        throw new Error("Falha ao buscar tarefas. Verifique se o índice do Firestore foi criado corretamente.");
    }
};

export const updateTaskStatus = async (
    taskId: string, 
    status: z.infer<typeof TaskProfileSchema>['status'], 
    actorUid: string
) => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const taskRef = adminDb.collection('tasks').doc(taskId);
    
    const taskDoc = await taskRef.get();
    if (!taskDoc.exists || taskDoc.data()?.companyId !== organizationId) {
        throw new Error('Tarefa não encontrada ou acesso negado.');
    }

    const updateData: { status: string, completedAt?: FieldValue | null, updatedAt: FieldValue } = {
        status: status,
        updatedAt: FieldValue.serverTimestamp(),
    };

    if (status === 'done') {
        updateData.completedAt = FieldValue.serverTimestamp();
    } else {
        updateData.completedAt = null;
    }

    await taskRef.update(updateData);

    return { id: taskId, status };
};

export const archiveTask = async (taskId: string, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const taskRef = adminDb.collection('tasks').doc(taskId);
    
    const taskDoc = await taskRef.get();
    if (!taskDoc.exists || taskDoc.data()?.companyId !== organizationId) {
        throw new Error('Tarefa não encontrada ou acesso negado.');
    }

    await taskRef.update({
        isArchived: true,
        updatedAt: FieldValue.serverTimestamp(),
    });

    return { id: taskId, success: true };
}


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
