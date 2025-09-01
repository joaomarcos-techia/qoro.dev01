
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
    
    // Handle new comments
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

    // Handle subtask updates separately if they are not part of the main update payload
    if (input.subtasks) {
        await taskRef.update({ subtasks: input.subtasks });
    }


    return { id: taskId };
};

export const listTasks = async (actorUid: string): Promise<z.infer<typeof TaskProfileSchema>[]> => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    
    try {
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
        if (error.code === 'FAILED_PRECONDITION' || (error.message && error.message.includes("index"))) {
             throw new Error("O índice do banco de dados para tarefas ainda está sendo criado. Por favor, aguarde alguns minutos e recarregue a página.");
        }
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


export const getDashboardMetrics = async (actorUid: string): Promise<{ totalTasks: number; completedTasks: number; inProgressTasks: number; pendingTasks: number; overdueTasks: number; tasksByPriority: Record<string, number> }> => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const tasksRef = adminDb.collection('tasks').where('companyId', '==', organizationId);

    try {
        const totalTasksPromise = tasksRef.count().get();
        const completedTasksPromise = tasksRef.where('status', '==', 'done').count().get();
        const inProgressTasksPromise = tasksRef.where('status', '==', 'in_progress').count().get();
        const pendingTasksPromise = tasksRef.where('status', '==', 'todo').count().get();
        const overdueTasksPromise = tasksRef.where('status', '!=', 'done').where('dueDate', '<', new Date()).get();
        const allTasksForPriorityPromise = tasksRef.get();

        const [
            totalTasksSnapshot,
            completedTasksSnapshot,
            inProgressTasksSnapshot,
            pendingTasksSnapshot,
            overdueTasksSnapshot,
            allTasksForPrioritySnapshot
        ] = await Promise.all([
            totalTasksPromise,
            completedTasksPromise,
            inProgressTasksPromise,
            pendingTasksPromise,
            overdueTasksPromise,
            allTasksForPriorityPromise
        ]);

        const tasksByPriority = allTasksForPrioritySnapshot.docs.reduce((acc, doc) => {
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
            overdueTasks: overdueTasksSnapshot.size,
            tasksByPriority,
        };
    } catch (error) {
        console.error("Error fetching task dashboard metrics:", error);
        throw new Error("Falha ao carregar as métricas de tarefas.");
    }
};

