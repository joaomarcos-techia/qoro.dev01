
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { CustomerSchema, CustomerProfileSchema, SaleLeadProfileSchema, SaleLeadSchema, ProductSchema, ProductProfileSchema, QuoteProfileSchema } from '@/ai/schemas';
import { getAdminAndOrg } from './utils';
import type { SaleLeadProfile, QuoteProfile } from '@/ai/schemas';

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


export const getDashboardMetrics = async (actorUid: string): Promise<{ totalCustomers: number, totalLeads: number, conversionRate: number, totalRevenueWon: number }> => {
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

    const leadsDataPromise = db.collection('sales_pipeline')
                               .where('companyId', '==', organizationId)
                               .get();
    
    const [customersSnapshot, leadsSnapshot, leadsDataSnapshot] = await Promise.all([customersPromise, leadsPromise, leadsDataPromise]);

    let totalRevenueWon = 0;
    let closedWonCount = 0;
    let closedLostCount = 0;

    leadsDataSnapshot.forEach(doc => {
        const lead = doc.data();
        if(lead.stage === 'closed_won') {
            totalRevenueWon += lead.value || 0;
            closedWonCount++;
        } else if (lead.stage === 'closed_lost') {
            closedLostCount++;
        }
    });

    const totalClosedDeals = closedWonCount + closedLostCount;
    const conversionRate = totalClosedDeals > 0 ? (closedWonCount / totalClosedDeals) * 100 : 0;

    return {
        totalCustomers: customersSnapshot.data().count,
        totalLeads: leadsSnapshot.data().count,
        conversionRate: parseFloat(conversionRate.toFixed(1)),
        totalRevenueWon,
    };
};

export const createProduct = async (input: z.infer<typeof ProductSchema>, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const newProductData = {
        ...input,
        companyId: organizationId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };
    const productRef = await db.collection('products').add(newProductData);
    return { id: productRef.id };
};

export const listProducts = async (actorUid: string): Promise<z.infer<typeof ProductProfileSchema>[]> => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const productsSnapshot = await db.collection('products')
                                     .where('companyId', '==', organizationId)
                                     .orderBy('createdAt', 'desc')
                                     .get();
    if (productsSnapshot.empty) {
        return [];
    }
    const products: z.infer<typeof ProductProfileSchema>[] = productsSnapshot.docs.map(doc => {
        const data = doc.data();
        return ProductProfileSchema.parse({
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate().toISOString(),
        });
    });
    return products;
};

export const listQuotes = async (actorUid: string): Promise<QuoteProfile[]> => {
    const { organizationId } = await getAdminAndOrg(actorUid);

    const quotesSnapshot = await db.collection('quotes')
        .where('companyId', '==', organizationId)
        .orderBy('createdAt', 'desc')
        .get();

    if (quotesSnapshot.empty) {
        return [];
    }

    const customerIds = [...new Set(quotesSnapshot.docs.map(doc => doc.data().customerId).filter(id => id))];
    const customers: Record<string, { name?: string }> = {};

    if (customerIds.length > 0) {
        const customersSnapshot = await db.collection('customers').where('__name__', 'in', customerIds).get();
        customersSnapshot.forEach(doc => {
            customers[doc.id] = { name: doc.data().name };
        });
    }

    const quotes: QuoteProfile[] = quotesSnapshot.docs.map(doc => {
        const data = doc.data();
        const customerInfo = customers[data.customerId] || {};
        const validUntil = data.validUntil ? data.validUntil.toDate() : new Date();

        const parsedData = QuoteProfileSchema.parse({
            id: doc.id,
            ...data,
            validUntil,
            createdAt: data.createdAt.toDate().toISOString(),
            updatedAt: data.updatedAt.toDate().toISOString(),
            customerName: customerInfo.name,
        });
        
        return {
            ...parsedData,
            validUntil: parsedData.validUntil.toISOString()
        };
    });

    return quotes;
};
