
'use server';
/**
 * @fileOverview Task management services.
 */
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import { TaskSchema, TaskProfileSchema, UpdateTaskSchema, UserProfile } from '@/ai/schemas';
import { getAdminAndOrg } from './utils';
import { adminDb } from '@/lib/firebase-admin';

export const createTask = async (
  input: z.infer<typeof TaskSchema>, 
  actorUid: string
) => {
  try {
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
  } catch (error) {
    console.error('🚨 Erro em createTask:', error);
    throw new Error('Falha ao criar a tarefa.');
  }
};

export const updateTask = async (
  taskId: string, 
  input: z.infer<typeof UpdateTaskSchema>, 
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

    const { id, comments, ...updateData } = input;
    const existingComments = Array.isArray(data.comments) ? data.comments : [];
    
    // Garantir que todos os comentários tenham data
    const safeExistingComments = existingComments.map(c => ({...c, createdAt: c.createdAt || new Date()}));

    const newComments = (comments || [])
      .filter(c => !safeExistingComments.some((ec: any) => ec.id === c.id))
      .map(c => ({
        ...c,
        authorId: actorUid,
        authorName: userData.name || userData.email || 'Usuário',
        createdAt: new Date(),
      }));


    const allComments = [...safeExistingComments, ...newComments];
    const commentsForFirestore = allComments.map(c => ({
        ...c,
        createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
    }));


    await taskRef.update({
      ...updateData,
      dueDate: updateData.dueDate ? new Date(updateData.dueDate) : null,
      updatedAt: FieldValue.serverTimestamp(),
      comments: commentsForFirestore,
    });

    if (input.subtasks) {
      await taskRef.update({ subtasks: input.subtasks });
    }

    return { id: taskId };
  } catch (error) {
    console.error('🚨 Erro em updateTask:', error);
    throw new Error('Falha ao atualizar a tarefa.');
  }
};

const toISOStringSafe = (date: any): string | null => {
  if (!date) return null;
  if (date instanceof Timestamp) return date.toDate().toISOString();
  if (date instanceof Date) return date.toISOString();
  if (typeof date === 'string') {
    try {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) return parsed.toISOString();
    } catch (e) {}
  }
  return null;
};


export const listTasks = async (
  actorUid: string
): Promise<z.infer<typeof TaskProfileSchema>[]> => {
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
            const data = doc.data() as any;
            const responsibleUser = data.responsibleUserId ? users[data.responsibleUserId] : null;

            // Prepare the object with all necessary fields before parsing
            const preProcessedData = {
                id: doc.id,
                ...data,
                createdAt: toISOStringSafe(data.createdAt),
                updatedAt: toISOStringSafe(data.updatedAt),
                dueDate: toISOStringSafe(data.dueDate),
                completedAt: toISOStringSafe(data.completedAt),
                responsibleUserId: data.responsibleUserId || undefined,
                responsibleUserName: responsibleUser?.name || responsibleUser?.email || undefined,
                subtasks: Array.isArray(data.subtasks) ? data.subtasks : [],
                comments: Array.isArray(data.comments)
                    ? data.comments.map((c: any) => ({
                        ...c,
                        createdAt: toISOStringSafe(c.createdAt),
                    }))
                    : [],
            };
            
            const validatedTask = TaskProfileSchema.parse(preProcessedData);
            validTasks.push(validatedTask);

        } catch (err) {
            console.error(`❌ Erro ao processar a tarefa ${doc.id}:`, err);
            // Ignore a tarefa com erro e continua com as outras
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
      completedAt: status === 'done' ? FieldValue.serverTimestamp() : null,
    };

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

export const getDashboardMetrics = async (actorUid: string) => {
  try {
    const allTasks = await listTasks(actorUid);

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'done').length;
    const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;
    const pendingTasks = allTasks.filter(t => ['todo', 'review'].includes(t.status)).length;
    const overdueTasks = allTasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < new Date()).length;
    
    const tasksByPriority = allTasks.reduce((acc: Record<string, number>, t) => {
      const prio = t.priority || 'medium';
      acc[prio] = (acc[prio] || 0) + 1;
      return acc;
    }, {});


    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      overdueTasks,
      tasksByPriority,
    };
  } catch (error) {
    console.error('🚨 Erro em getDashboardMetrics (Tasks):', error);
    throw new Error('Falha ao carregar métricas de tarefas.');
  }
};
