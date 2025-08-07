
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { SupplierSchema, SupplierProfileSchema } from '@/ai/schemas';
import { getAdminAndOrg } from './utils';
import { adminDb } from '@/lib/firebase-admin';

export const createSupplier = async (input: z.infer<typeof SupplierSchema>, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);

    const newSupplierData = {
        ...input,
        companyId: organizationId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };

    const supplierRef = await adminDb.collection('suppliers').add(newSupplierData);

    return { id: supplierRef.id };
};

export const listSuppliers = async (actorUid: string): Promise<z.infer<typeof SupplierProfileSchema>[]> => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    
    const suppliersSnapshot = await adminDb.collection('suppliers')
                                     .where('companyId', '==', organizationId)
                                     .orderBy('createdAt', 'desc')
                                     .get();
    
    if (suppliersSnapshot.empty) {
        return [];
    }
    
    const suppliers: z.infer<typeof SupplierProfileSchema>[] = suppliersSnapshot.docs.map(doc => {
        const data = doc.data();
        return SupplierProfileSchema.parse({
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate().toISOString(),
        });
    });
    
    return suppliers;
};
