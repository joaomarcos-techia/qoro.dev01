
import { getFirestore } from 'firebase-admin/firestore';
import { z } from 'zod';
import { AccountProfileSchema } from '@/ai/schemas';
import { getAdminAndOrg } from './utils';

const db = getFirestore();

export const listAccounts = async (actorUid: string): Promise<z.infer<typeof AccountProfileSchema>[]> => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    
    const accountsSnapshot = await db.collection('accounts')
                                     .where('companyId', '==', organizationId)
                                     .orderBy('createdAt', 'desc')
                                     .get();
    
    if (accountsSnapshot.empty) {
        return [];
    }
    
    const accounts: z.infer<typeof AccountProfileSchema>[] = accountsSnapshot.docs.map(doc => {
        const data = doc.data();
        return AccountProfileSchema.parse({
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate().toISOString(),
        });
    });
    
    return accounts;
};
