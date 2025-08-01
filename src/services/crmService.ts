import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { CustomerSchema, CustomerProfileSchema, SaleLeadProfileSchema } from '@/ai/schemas';
import { getAdminAndOrg } from './utils';
import type { SaleLeadProfile } from '@/ai/schemas';

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
        const parsedData = {
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate().toISOString(),
        };
        // Safely parse, providing default for missing fields
        return CustomerProfileSchema.parse(parsedData);
    });
    
    return customers;
};

export const listSaleLeads = async (actorUid: string): Promise<SaleLeadProfile[]> => {
    const { organizationId } = await getAdminAndOrg(actorUid);

    const leadsSnapshot = await db.collection('sales_pipeline')
        .where('companyId', '==', organizationId)
        .orderBy('createdAt', 'desc')
        .get();

    if (leadsSnapshot.empty) {
        // You can create some dummy data here for testing if you want
        return [];
    }

    const customerIds = [...new Set(leadsSnapshot.docs.map(doc => doc.data().customerId).filter(id => id))];
    const customers: Record<string, { name?: string, email?: string }> = {};

    if (customerIds.length > 0) {
        const customersSnapshot = await db.collection('customers').where('__name__', 'in', customerIds).get();
        customersSnapshot.forEach(doc => {
            customers[doc.id] = {
                name: doc.data().name,
                email: doc.data().email,
            };
        });
    }

    const leads: SaleLeadProfile[] = leadsSnapshot.docs.map(doc => {
        const data = doc.data();
        const customerInfo = customers[data.customerId] || {};
        const expectedCloseDate = data.expectedCloseDate ? data.expectedCloseDate.toDate() : new Date();

        return SaleLeadProfileSchema.parse({
            id: doc.id,
            ...data,
            expectedCloseDate,
            createdAt: data.createdAt.toDate().toISOString(),
            updatedAt: data.updatedAt.toDate().toISOString(),
            customerName: customerInfo.name,
            customerEmail: customerInfo.email
        });
    });

    return leads;
};
