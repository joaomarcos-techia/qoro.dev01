
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { CustomerSchema, CustomerProfileSchema } from '@/ai/schemas';
import { getAdminAndOrg } from './utils';

const db = getFirestore();

export const createCustomer = async (input: z.infer<typeof CustomerSchema>, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);

    const newCustomerData = {
        ...input,
        companyId: organizationId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };

    const customerRef = await db.collection('customers').add(newCustomerData);

    return { id: customerRef.id };
};

export const listCustomers = async (actorUid: string): Promise<z.infer<typeof CustomerProfileSchema>[]> => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    
    const customersSnapshot = await db.collection('customers')
                                     .where('companyId', '==', organizationId)
                                     .orderBy('createdAt', 'desc')
                                     .get();
    
    if (customersSnapshot.empty) {
        return [];
    }
    
    const customers: z.infer<typeof CustomerProfileSchema>[] = customersSnapshot.docs.map(doc => {
        const data = doc.data();
        return CustomerProfileSchema.parse({
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate().toISOString(),
            updatedAt: data.updatedAt.toDate().toISOString(),
        });
    });
    
    return customers;
};
