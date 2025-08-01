
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { AccountSchema, AccountProfileSchema } from '@/ai/schemas';
import { getAdminAndOrg } from './utils';

const db = getFirestore();

export const createAccount = async (input: z.infer<typeof AccountSchema>, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);

    const newAccountData = {
        ...input,
        companyId: organizationId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };

    const accountRef = await db.collection('accounts').add(newAccountData);

    return { id: accountRef.id };
};


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
