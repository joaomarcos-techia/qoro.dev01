
'use server';
/**
 * @fileOverview Task management services.
 */

import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { TaskSchema, TaskProfileSchema, UpdateTaskSchema } from '@/ai/schemas';
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
        subtasks: input.subtasks || [],
        comments: input.comments || [],
        recurrence: input.recurrence || null,
    };

    const taskRef = await adminDb.collection('tasks').add(newTaskData);

    return { id: taskRef.id };
};

export const updateTask = async (taskId: string, input: z.infer<typeof UpdateTaskSchema>, actorUid: string) => {
    const { organizationId, userData } = await getAdminAndOrg(actorUid);
    const taskRef = adminDb.collection('tasks').doc(taskId);

    const taskDoc = await taskRef.get();
    if (!taskDoc.exists || taskDoc.data()?.companyId !== organizationId) {
        throw new Error('Tarefa não encontrada ou acesso negado.');
    }

    const { id, comments, ...updateData } = input;
    
    const existingComments = taskDoc.data()?.comments || [];
    const newComments = comments?.filter(c => !existingComments.some((ec: any) => ec.id === c.id)) || [];

    newComments.forEach(comment => {
        comment.authorId = actorUid;
        comment.authorName = userData.name || userData.email;
        comment.createdAt = new Date();
    });

    await taskRef.update({
        ...updateData,
        dueDate: updateData.dueDate ? new Date(updateData.dueDate) : null,
        updatedAt: FieldValue.serverTimestamp(),
        comments: FieldValue.arrayUnion(...newComments)
    });

    if (input.subtasks) {
        await taskRef.update({ subtasks: input.subtasks });
    }


    return { id: taskId };
};

export const listTasks = async (actorUid: string): Promise<z.infer<typeof TaskProfileSchema>[]> => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    
    try {
        // SIMPLIFIED QUERY: Removed all .orderBy() clauses to prevent index-related errors.
        // Sorting will be handled on the client-side.
        const tasksQuery = adminDb.collection('tasks')
            .where('companyId', '==', organizationId);
                                 
        const tasksSnapshot = await tasksQuery.get();
        
        if (tasksSnapshot.empty) {
            return [];
        }
        
        const tasks: z.infer<typeof TaskProfileSchema>[] = tasksSnapshot.docs
        .map(doc => {
            const data = doc.data();
            const dueDate = data.dueDate ? data.dueDate.toDate().toISOString() : null;
            const completedAt = data.completedAt ? data.completedAt.toDate().toISOString() : null;
            
            return TaskProfileSchema.parse({
                id: doc.id,
                ...data,
                dueDate,
                completedAt,
                creatorId: data.creatorId,
                createdAt: data.createdAt.toDate().toISOString(),
                updatedAt: data.updatedAt.toDate().toISOString(),
                responsibleUserId: data.responsibleUserId || undefined,
                subtasks: data.subtasks || [],
                comments: (data.comments || []).map((c: any) => ({...c, createdAt: c.createdAt.toDate().toISOString()})),
            });
        });
        
        return tasks;
    } catch (error: any) {
        console.error("Critical error in listTasks:", error, error.stack);
        throw new Error("Falha ao carregar tarefas. Ocorreu um erro no servidor.");
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

export const deleteTask = async (taskId: string, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const taskRef = adminDb.collection('tasks').doc(taskId);
    
    const taskDoc = await taskRef.get();
    if (!taskDoc.exists || taskDoc.data()?.companyId !== organizationId) {
        throw new Error('Tarefa não encontrada ou acesso negado.');
    }

    await taskRef.delete();

    return { id: taskId, success: true };
}


export const getDashboardMetrics = async (actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const tasksRef = adminDb.collection('tasks').where('companyId', '==', organizationId);
    
    try {
        const totalTasksSnapshot = await tasksRef.count().get();
        const completedTasksSnapshot = await tasksRef.where('status', '==', 'done').count().get();
        const inProgressTasksSnapshot = await tasksRef.where('status', '==', 'in_progress').count().get();
        const pendingTasksSnapshot = await tasksRef.where('status', 'in', ['todo', 'review']).count().get();
        
        // This part remains tricky without an index, so we handle it on the client
        // or accept a potentially less performant query for this specific metric.
        // For now, we will perform it on all tasks fetched separately.
        const allTasksForOverdueCheck = await tasksRef.get();
        const overdueTasks = allTasksForOverdueCheck.docs.filter(doc => {
            const data = doc.data();
            return data.status !== 'done' && data.dueDate && data.dueDate.toDate() < new Date()
        }).length;
        
        // This is inefficient but avoids complex indexed queries.
        const tasksByPriority = allTasksForOverdueCheck.docs.reduce((acc, doc) => {
            const task = doc.data();
            const priority = task.priority || 'medium';
            acc[priority] = (acc[priority] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            totalTasks: totalTasksSnapshot.data().count,
            completedTasks: completedTasksSnapshot.data().count,
            inProgressTasks: inProgressTasksSnapshot.data().count,
            pendingTasks: pendingTasksSnapshot.data().count,
            overdueTasks,
            tasksByPriority,
        };
    } catch (error) {
        console.error("Error fetching task dashboard metrics:", error);
        throw new Error("Falha ao carregar as métricas de tarefas.");
    }
};
