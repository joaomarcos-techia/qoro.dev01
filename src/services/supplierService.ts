
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { SupplierSchema, SupplierProfileSchema, UpdateSupplierSchema } from '@/ai/schemas';
import { getAdminAndOrg } from './utils';
import { adminDb } from '@/lib/firebase-admin';

export const createSupplier = async (input: z.infer<typeof SupplierSchema>, actorUid: string) => {
    const adminOrgData = await getAdminAndOrg(actorUid);
    if (!adminOrgData) throw new Error("A organização do usuário não está pronta.");
    const { organizationId } = adminOrgData;

    const newSupplierData = {
        ...input,
        companyId: organizationId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };

    const supplierRef = await adminDb.collection('suppliers').add(newSupplierData);
    return { id: supplierRef.id };
};

export const updateSupplier = async (supplierId: string, input: z.infer<typeof UpdateSupplierSchema>, actorUid: string) => {
    const adminOrgData = await getAdminAndOrg(actorUid);
    if (!adminOrgData) throw new Error("A organização do usuário não está pronta.");
    const { organizationId } = adminOrgData;

    const supplierRef = adminDb.collection('suppliers').doc(supplierId);
    const doc = await supplierRef.get();
    if (!doc.exists || doc.data()?.companyId !== organizationId) {
        throw new Error('Fornecedor não encontrado ou acesso negado.');
    }

    const { id, ...updateData } = input;

    await supplierRef.update({
        ...updateData,
        updatedAt: FieldValue.serverTimestamp(),
    });

    return { id: supplierId };
};

export const listSuppliers = async (actorUid: string): Promise<z.infer<typeof SupplierProfileSchema>[]> => {
    const adminOrgData = await getAdminAndOrg(actorUid);
    if (!adminOrgData) return [];
    const { organizationId } = adminOrgData;
    
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

export const deleteSupplier = async (supplierId: string, actorUid: string) => {
    const adminOrgData = await getAdminAndOrg(actorUid);
    if (!adminOrgData) throw new Error("A organização do usuário não está pronta.");
    const { organizationId, userRole } = adminOrgData;

    if (userRole !== 'admin') {
        throw new Error("Permissão negada. Apenas administradores podem excluir fornecedores.");
    }
    
    const supplierRef = adminDb.collection('suppliers').doc(supplierId);
    const doc = await supplierRef.get();
    if (!doc.exists || doc.data()?.companyId !== organizationId) {
        throw new Error('Fornecedor não encontrado ou acesso negado.');
    }

    const billsQuery = await adminDb.collection('bills').where('entityId', '==', supplierId).limit(1).get();
    if (!billsQuery.empty) {
        throw new Error("Não é possível excluir o fornecedor, pois existem contas a pagar/receber associadas a ele.");
    }

    await supplierRef.delete();
    return { id: supplierId, success: true };
};
