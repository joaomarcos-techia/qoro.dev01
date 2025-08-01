
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { TaskSchema, TaskProfileSchema } from '@/ai/schemas';
import { getAdminAndOrg } from './utils';

const db = getFirestore();

export const createTask = async (input: z.infer<typeof TaskSchema>, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);

    const newTaskData = {
        ...input,
        userId: actorUid,
        companyId: organizationId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };

    const taskRef = await db.collection('tasks').add(newTaskData);

    return { id: taskRef.id };
};

export const listTasks = async (actorUid: string): Promise<z.infer<typeof TaskProfileSchema>[]> => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    
    // Query for all tasks in the organization, for now.
    // Can be refined to query only for tasks assigned to the user (actorUid).
    const tasksSnapshot = await db.collection('tasks')
                                     .where('companyId', '==', organizationId)
                                     .orderBy('createdAt', 'desc')
                                     .get();
    
    if (tasksSnapshot.empty) {
        return [];
    }
    
    const tasks: z.infer<typeof TaskProfileSchema>[] = tasksSnapshot.docs.map(doc => {
        const data = doc.data();
        const dueDate = data.dueDate ? data.dueDate.toDate() : null;
        
        return TaskProfileSchema.parse({
            id: doc.id,
            ...data,
            dueDate,
            createdAt: data.createdAt.toDate().toISOString(),
            updatedAt: data.updatedAt.toDate().toISOString(),
        });
    });
    
    return tasks;
};

export const getDashboardMetrics = async (actorUid: string): Promise<{ pendingTasks: number }> => {
    const { organizationId } = await getAdminAndOrg(actorUid);

    const tasksSnapshot = await db.collection('tasks')
                                    .where('companyId', '==', organizationId)
                                    .where('status', 'in', ['todo', 'in_progress'])
                                    .count()
                                    .get();

    return {
        pendingTasks: tasksSnapshot.data().count,
    };
};
