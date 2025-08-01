
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { CustomerSchema, CustomerProfileSchema, SaleLeadProfileSchema, SaleLeadSchema } from '@/ai/schemas';
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
            // Ensure createdAt is an ISO string for client-side date parsing
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
        .get();

    if (leadsSnapshot.empty) {
        return [];
    }

    const customerIds = [...new Set(leadsSnapshot.docs.map(doc => doc.data().customerId).filter(id => id))];
    const customers: Record<string, { name?: string, email?: string }> = {};

    if (customerIds.length > 0) {
        // Firestore 'in' queries are limited to 30 items. For larger sets, chunk the array.
        // For this app's scale, we'll assume it's under 30 for now.
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
        // Firestore timestamps need to be converted to Date objects for Zod schema
        const expectedCloseDate = data.expectedCloseDate ? data.expectedCloseDate.toDate() : new Date();

        const parsedData = SaleLeadProfileSchema.parse({
            id: doc.id,
            ...data,
            expectedCloseDate, // This is now a Date object
            // Convert other timestamps to ISO strings for client-side date parsing
            createdAt: data.createdAt.toDate().toISOString(),
            updatedAt: data.updatedAt.toDate().toISOString(),
            customerName: customerInfo.name,
            customerEmail: customerInfo.email
        });
        
        // Convert Date object back to ISO string for the client
        return {
            ...parsedData,
            expectedCloseDate: parsedData.expectedCloseDate.toISOString()
        };
    });

    return leads;
};


export const getDashboardMetrics = async (actorUid: string): Promise<{ totalCustomers: number, totalLeads: number }> => {
    const { organizationId } = await getAdminAndOrg(actorUid);

    const customersPromise = db.collection('customers')
                                .where('companyId', '==', organizationId)
                                .count()
                                .get();

    const leadsPromise = db.collection('sales_pipeline')
                             .where('companyId', '==', organizationId)
                             .where('stage', 'not-in', ['closed_won', 'closed_lost'])
                             .count()
                             .get();
    
    const [customersSnapshot, leadsSnapshot] = await Promise.all([customersPromise, leadsPromise]);

    return {
        totalCustomers: customersSnapshot.data().count,
        totalLeads: leadsSnapshot.data().count,
    };
};
