
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
    const newComments = (comments || []).filter(c =>
      !existingComments.some((ec: any) => ec.id === c.id)
    );

    newComments.forEach(c => {
      c.authorId = actorUid;
      c.authorName = userData.name || userData.email;
      c.createdAt = new Date();
    });

    const commentsWithISODates = newComments.map(c => ({
        ...c,
        createdAt: (c.createdAt as Date).toISOString(),
    }));

    await taskRef.update({
      ...updateData,
      dueDate: updateData.dueDate ? new Date(updateData.dueDate) : null,
      updatedAt: FieldValue.serverTimestamp(),
      ...(commentsWithISODates.length > 0 ? { comments: FieldValue.arrayUnion(...commentsWithISODates) } : {})
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
  try {
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) return parsed.toISOString();
  } catch (e) {}
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

            const parsedData = {
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
            
            const validatedTask = TaskProfileSchema.parse(parsedData);
            validTasks.push(validatedTask);

        } catch (err) {
            console.error('❌ Erro ao parsear tarefa:', doc.id, err);
            // Ignora a tarefa com erro e continua com as outras
        }
    });

    return validTasks;
  } catch (error) {
    console.error('🔥 Erro crítico em listTasks:', error);
    throw new Error('Falha ao carregar tarefas.');
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
    const { organizationId } = await getAdminAndOrg(actorUid);
    const baseRef = adminDb.collection('tasks').where('companyId', '==', organizationId);

    const [totalSnap, doneSnap, inProgSnap, pendingSnap, allSnap] = await Promise.all([
      baseRef.count().get(),
      baseRef.where('status', '==', 'done').count().get(),
      baseRef.where('status', '==', 'in_progress').count().get(),
      baseRef.where('status', 'in', ['todo', 'review']).count().get(),
      baseRef.get(),
    ]);

    const allDocs = allSnap.docs.map(d => d.data() as any);
    const overdueTasks = allDocs.filter(d =>
      d.status !== 'done' && d.dueDate?.toDate?.() < new Date()
    ).length;

    const tasksByPriority = allDocs.reduce((acc: Record<string, number>, d) => {
      const prio = d.priority || 'medium';
      acc[prio] = (acc[prio] || 0) + 1;
      return acc;
    }, {});

    return {
      totalTasks: totalSnap.data().count,
      completedTasks: doneSnap.data().count,
      inProgressTasks: inProgSnap.data().count,
      pendingTasks: pendingSnap.data().count,
      overdueTasks,
      tasksByPriority,
    };
  } catch (error) {
    console.error('🚨 Erro em getDashboardMetrics:', error);
    throw new Error('Falha ao carregar métricas.');
  }
};

    