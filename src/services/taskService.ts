

'use server';
/**
 * @fileOverview Task management services.
 */
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import { TaskSchema, TaskProfileSchema, UpdateTaskSchema, UserProfile } from '@/ai/schemas';
import { getAdminAndOrg } from './utils';
import { adminDb } from '@/lib/firebase-admin';

const FREE_PLAN_LIMITS = {
    tasks: 5,
};

// Helper function to safely convert Firestore Timestamps or ISO strings to a Date object string.
const toISOStringSafe = (date: any): string | null => {
    if (!date) return null;
    if (date instanceof Timestamp) return date.toDate().toISOString();
    if (date instanceof Date) return date.toISOString();
    if (typeof date === 'string') {
        try {
            const parsedDate = new Date(date);
            if (!isNaN(parsedDate.getTime())) {
                return parsedDate.toISOString();
            }
        } catch (e) {
            console.error(`Could not parse date string: ${date}`, e);
            return null;
        }
    }
    console.warn(`Unsupported date type for conversion: ${typeof date}`);
    return null;
};


export const createTask = async (
  input: z.infer<typeof TaskSchema>, 
  actorUid: string
) => {
  try {
    const { organizationId, planId } = await getAdminAndOrg(actorUid);

    if (planId === 'free') {
        const query = adminDb.collection('tasks').where('companyId', '==', organizationId);
        const snapshot = await query.count().get();
        const count = snapshot.data().count;
        if (count >= FREE_PLAN_LIMITS.tasks) {
            throw new Error(`Limite de ${FREE_PLAN_LIMITS.tasks} tarefas atingido no plano gratuito. Faça upgrade para adicionar mais.`);
        }
    }

    const newTaskData = {
      ...input,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      creatorId: actorUid,
      companyId: organizationId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      completedAt: null,
      subtasks: input.subtasks || [],
      comments: [], // Comments are not created with the task
      recurrence: input.recurrence || null,
    };
    const taskRef = await adminDb.collection('tasks').add(newTaskData);
    return { id: taskRef.id };
  } catch (error) {
    console.error('🚨 Erro em createTask:', error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('Falha ao criar a tarefa.');
  }
};

export const updateTask = async (
  taskId: string, 
  input: z.infer<typeof UpdateTaskSchema> & { __commentOnlyUpdate?: boolean }, 
  actorUid: string
) => {
  try {
    const { organizationId, userData } = await getAdminAndOrg(actorUid);
    const taskRef = adminDb.collection('tasks').doc(taskId);
    const taskDoc = await taskRef.get();
    const data = taskDoc.data() || {};

    if (!taskDoc.exists || data.companyId !== organizationId) {
      throw new Error('Tarefa não encontrada ou acesso negado.');
    }

    // If only adding a comment, update only the comments field
    if (input.__commentOnlyUpdate) {
        if (input.comments) {
             const commentsWithDate = input.comments.map(c => ({...c, createdAt: new Date(c.createdAt as string)}));
             await taskRef.update({
                comments: commentsWithDate,
                updatedAt: FieldValue.serverTimestamp(),
             });
             return { id: taskId };
        }
    }


    const { id, comments, ...updateData } = input;
    
    // For full updates, we still manage comments safely.
    const existingComments = (Array.isArray(data.comments) ? data.comments : []).map(c => ({
        ...c,
        createdAt: toISOStringSafe(c.createdAt)
    }));

    // Prevent overwriting existing timestamps if not explicitly provided
    const payload = {
        ...updateData,
        dueDate: updateData.dueDate ? new Date(updateData.dueDate) : data.dueDate,
        updatedAt: FieldValue.serverTimestamp(),
        comments: existingComments.map(c => ({...c, createdAt: new Date(c.createdAt!)})),
    };


    await taskRef.update(payload);

    return { id: taskId };
  } catch (error) {
    console.error('🚨 Erro em updateTask:', error);
    throw new Error('Falha ao atualizar a tarefa.');
  }
};


export const listTasks = async (
  actorUid: string
): Promise<z.infer<typeof TaskProfileSchema>[]> => {
  if (!actorUid) {
      console.error('🔥 Erro crítico em listTasks: actorUid não foi fornecido.');
      throw new Error('Identificação do usuário é necessária para listar tarefas.');
  }
  try {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const tasksSnapshot = await adminDb.collection('tasks')
      .where('companyId', '==', organizationId)
      .orderBy('createdAt', 'desc')
      .get();

    if (tasksSnapshot.empty) return [];
    
    const userIds = [...new Set(tasksSnapshot.docs.map(doc => doc.data().responsibleUserId).filter(Boolean))];
    const users: Record<string, UserProfile> = {};

    if (userIds.length > 0) {
        const usersSnapshot = await adminDb.collection('users').where('__name__', 'in', userIds).get();
        usersSnapshot.forEach(doc => {
            users[doc.id] = doc.data() as UserProfile;
        });
    }

    const validTasks: z.infer<typeof TaskProfileSchema>[] = [];
    
    tasksSnapshot.docs.forEach(doc => {
        try {
            const data = doc.data();
            const responsibleUser = data.responsibleUserId ? users[data.responsibleUserId] : null;

            const preProcessedData = {
                id: doc.id,
                title: data.title,
                description: data.description || '',
                status: data.status || 'todo',
                priority: data.priority || 'medium',
                responsibleUserId: data.responsibleUserId || undefined,
                subtasks: data.subtasks || [],
                recurrence: data.recurrence || undefined,
                createdAt: toISOStringSafe(data.createdAt),
                updatedAt: toISOStringSafe(data.updatedAt),
                creatorId: data.creatorId,
                dueDate: toISOStringSafe(data.dueDate),
                completedAt: toISOStringSafe(data.completedAt),
                responsibleUserName: responsibleUser?.name || responsibleUser?.email || undefined,
                comments: (data.comments || []).map((c: any) => ({
                  ...c,
                  createdAt: toISOStringSafe(c.createdAt),
                }))
            };
            
            const validatedTask = TaskProfileSchema.parse(preProcessedData);
            validTasks.push(validatedTask);

        } catch (err) {
            console.error(`❌ Erro ao processar a tarefa ${doc.id}:`, err);
        }
    });

    return validTasks;
  } catch (error) {
    console.error('🔥 Erro crítico em listTasks:', error);
    throw new Error('Falha ao carregar tarefas do servidor.');
  }
};

export const updateTaskStatus = async (
  taskId: string, 
  status: z.infer<typeof TaskProfileSchema>['status'], 
  actorUid: string
) => {
  try {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const taskRef = adminDb.collection('tasks').doc(taskId);
    const taskDoc = await taskRef.get();
    const data = taskDoc.data() || {};

    if (!taskDoc.exists || data.companyId !== organizationId) {
      throw new Error('Tarefa não encontrada ou acesso negado.');
    }

    const updatePayload: any = {
      status,
      updatedAt: FieldValue.serverTimestamp(),
    };
    
    if (status === 'done' && data.status !== 'done') {
        updatePayload.completedAt = FieldValue.serverTimestamp();
    } else if (status !== 'done' && data.status === 'done') {
        updatePayload.completedAt = null;
    }

    await taskRef.update(updatePayload);

    return { id: taskId, status };
  } catch (error) {
    console.error('🚨 Erro em updateTaskStatus:', error);
    throw new Error('Falha ao atualizar status da tarefa.');
  }
};

export const deleteTask = async (
  taskId: string, 
  actorUid: string
) => {
  try {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const taskRef = adminDb.collection('tasks').doc(taskId);
    const taskDoc = await taskRef.get();
    const data = taskDoc.data() || {};

    if (!taskDoc.exists || data.companyId !== organizationId) {
      throw new Error('Tarefa não encontrada ou acesso negado.');
    }

    await taskRef.delete();
    return { id: taskId, success: true };
  } catch (error) {
    console.error('🚨 Erro em deleteTask:', error);
    throw new Error('Falha ao excluir a tarefa.');
  }
};

export const getTaskDashboardMetrics = async (actorUid: string) => {
    try {
        const allTasks = await listTasks(actorUid);
        const pendingTasks = allTasks.filter(t => 
            (t.status === 'todo' || t.status === 'in_progress' || t.status === 'review')
        ).length;

        const totalTasks = allTasks.length;
        const completedTasks = allTasks.filter(t => t.status === 'done').length;
        const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const overdueTasks = allTasks.filter(t => 
            t.status !== 'done' && t.dueDate && new Date(t.dueDate) < startOfToday
        ).length;
        
        const tasksByPriority = allTasks.reduce((acc: Record<string, number>, t) => {
            const prio = t.priority || 'medium';
            acc[prio] = (acc[prio] || 0) + 1;
            return acc;
        }, {});

        return { 
            pendingTasks,
            totalTasks,
            completedTasks,
            inProgressTasks,
            overdueTasks,
            tasksByPriority
        };
    } catch (error) {
        console.error('🚨 Erro em getTaskDashboardMetrics (Tasks):', error);
        throw new Error('Falha ao carregar métricas de tarefas.');
    }
};

export const getOverviewMetrics = async (actorUid: string) => {
    try {
        const allTasks = await listTasks(actorUid);
        const metrics = await getTaskDashboardMetrics(actorUid);
        
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfWeek = new Date(startOfToday);
        endOfWeek.setDate(endOfWeek.getDate() + 7);

        const overdue = allTasks
            .filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < startOfToday)
            .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
        
        const dueSoon = allTasks
            .filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) >= startOfToday && new Date(t.dueDate) <= endOfWeek)
            .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

        return {
            ...metrics,
            overdue,
            dueSoon
        };

    } catch (error) {
        console.error('🚨 Erro em getOverviewMetrics (Tasks):', error);
        throw new Error('Falha ao carregar a visão geral de tarefas.');
    }
};
