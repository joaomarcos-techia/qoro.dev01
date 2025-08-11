
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { CustomerSchema, CustomerProfileSchema, SaleLeadProfileSchema, SaleLeadSchema, ProductSchema, ProductProfileSchema, QuoteSchema, QuoteProfileSchema, UpdateCustomerSchema, UpdateProductSchema, UpdateQuoteSchema } from '@/ai/schemas';
import { getAdminAndOrg } from './utils';
import type { SaleLeadProfile, QuoteProfile } from '@/ai/schemas';
import { adminDb } from '@/lib/firebase-admin';

export const createCustomer = async (input: z.infer<typeof CustomerSchema>, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);

    const newCustomerData = {
        ...input,
        companyId: organizationId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };

    const customerRef = await adminDb.collection('customers').add(newCustomerData);

    return { id: customerRef.id };
};

export const listCustomers = async (actorUid: string): Promise<z.infer<typeof CustomerProfileSchema>[]> => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    
    const customersSnapshot = await adminDb.collection('customers')
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
            birthDate: data.birthDate || null,
        };
        return CustomerProfileSchema.parse(parsedData);
    });
    
    return customers;
};

export const updateCustomer = async (customerId: string, input: z.infer<typeof UpdateCustomerSchema>, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const customerRef = adminDb.collection('customers').doc(customerId);

    const customerDoc = await customerRef.get();
    if (!customerDoc.exists || customerDoc.data()?.companyId !== organizationId) {
        throw new Error('Cliente não encontrado ou acesso negado.');
    }

    const { id, ...updateData } = input;

    await customerRef.update({
        ...updateData,
        updatedAt: FieldValue.serverTimestamp(),
    });

    return { id: customerId };
};

export const updateCustomerStatus = async (
    customerId: string, 
    status: z.infer<typeof CustomerProfileSchema>['status'], 
    actorUid: string
) => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const customerRef = adminDb.collection('customers').doc(customerId);
    
    const customerDoc = await customerRef.get();
    if (!customerDoc.exists || customerDoc.data()?.companyId !== organizationId) {
        throw new Error('Cliente não encontrado ou acesso negado.');
    }

    await customerRef.update({
        status: status,
        updatedAt: FieldValue.serverTimestamp(),
    });

    return { id: customerId, status };
};

export const deleteCustomer = async (customerId: string, actorUid: string) => {
    const { organizationId, userRole } = await getAdminAndOrg(actorUid);

    // Security Check: Only admins can delete customers.
    if (userRole !== 'admin') {
        throw new Error("Permissão negada. Apenas administradores podem excluir clientes.");
    }

    const customerRef = adminDb.collection('customers').doc(customerId);

    const customerDoc = await customerRef.get();
    if (!customerDoc.exists || customerDoc.data()?.companyId !== organizationId) {
        throw new Error('Cliente não encontrado ou acesso negado.');
    }

    await customerRef.delete();

    return { id: customerId, success: true };
};


export const createSaleLead = async (input: z.infer<typeof SaleLeadSchema>, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const newSaleLeadData = {
        ...input,
        companyId: organizationId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };
    const saleLeadRef = await adminDb.collection('sales_pipeline').add(newSaleLeadData);
    return { id: saleLeadRef.id };
};

export const listSaleLeads = async (actorUid: string): Promise<SaleLeadProfile[]> => {
    const { organizationId } = await getAdminAndOrg(actorUid);

    const leadsSnapshot = await adminDb.collection('sales_pipeline')
        .where('companyId', '==', organizationId)
        .get();

    if (leadsSnapshot.empty) {
        return [];
    }

    const customerIds = [...new Set(leadsSnapshot.docs.map(doc => doc.data().customerId).filter(id => id))];
    const customers: Record<string, { name?: string, email?: string }> = {};

    if (customerIds.length > 0) {
        const customersSnapshot = await adminDb.collection('customers').where('__name__', 'in', customerIds).get();
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
        
        const stageMap: Record<string, SaleLeadProfile['stage']> = {
            prospect: 'new',
            initial_contact: 'initial_contact',
            qualified: 'qualified',
            proposal: 'proposal',
            negotiation: 'negotiation',
            closed_won: 'won',
            closed_lost: 'lost',
            won: 'won',
            lost: 'lost',
            new: 'new',
        };
        const mappedStage = stageMap[data.stage] || 'new';

        const parsedData = SaleLeadProfileSchema.parse({
            id: doc.id,
            ...data,
            stage: mappedStage,
            expectedCloseDate: data.expectedCloseDate,
            createdAt: data.createdAt.toDate().toISOString(),
            updatedAt: data.updatedAt.toDate().toISOString(),
            customerName: customerInfo.name,
            customerEmail: customerInfo.email
        });
        
        return parsedData;
    });

    return leads;
};


export const getDashboardMetrics = async (actorUid: string): Promise<{ customers: z.infer<typeof CustomerProfileSchema>[], leads: SaleLeadProfile[] }> => {
    // This function is now simpler: it just fetches the raw data.
    // The calculation logic has been moved to the frontend for better control.
    const customers = await listCustomers(actorUid);
    const leads = await listSaleLeads(actorUid);
    
    return {
        customers,
        leads,
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
    const productRef = await adminDb.collection('products').add(newProductData);
    return { id: productRef.id };
};

export const listProducts = async (actorUid: string): Promise<z.infer<typeof ProductProfileSchema>[]> => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const productsSnapshot = await adminDb.collection('products')
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

export const updateProduct = async (productId: string, input: z.infer<typeof UpdateProductSchema>, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const productRef = adminDb.collection('products').doc(productId);

    const productDoc = await productRef.get();
    if (!productDoc.exists || productDoc.data()?.companyId !== organizationId) {
        throw new Error('Produto não encontrado ou acesso negado.');
    }

    const { id, ...updateData } = input;

    await productRef.update({
        ...updateData,
        updatedAt: FieldValue.serverTimestamp(),
    });

    return { id: productId };
};

export const deleteProduct = async (productId: string, actorUid: string) => {
    const { organizationId, userRole } = await getAdminAndOrg(actorUid);

    if (userRole !== 'admin') {
        throw new Error("Permissão negada. Apenas administradores podem excluir produtos.");
    }

    const productRef = adminDb.collection('products').doc(productId);

    const productDoc = await productRef.get();
    if (!productDoc.exists || productDoc.data()?.companyId !== organizationId) {
        throw new Error('Produto não encontrado ou acesso negado.');
    }

    await productRef.delete();

    return { id: productId, success: true };
};

export const createQuote = async (input: z.infer<typeof QuoteSchema>, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    
    const quoteNumber = `QT-${Date.now().toString().slice(-6)}`;
    
    const newQuoteData = {
        ...input,
        number: quoteNumber,
        companyId: organizationId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };
    const quoteRef = await adminDb.collection('quotes').add(newQuoteData);
    return { id: quoteRef.id, number: quoteNumber };
};

export const listQuotes = async (actorUid: string): Promise<QuoteProfile[]> => {
    const { organizationId } = await getAdminAndOrg(actorUid);

    const quotesSnapshot = await adminDb.collection('quotes')
        .where('companyId', '==', organizationId)
        .orderBy('createdAt', 'desc')
        .get();

    if (quotesSnapshot.empty) {
        return [];
    }

    const customerIds = [...new Set(quotesSnapshot.docs.map(doc => doc.data().customerId).filter(id => id))];
    const customers: Record<string, { name?: string }> = {};

    if (customerIds.length > 0) {
        const customersSnapshot = await adminDb.collection('customers').where('__name__', 'in', customerIds).get();
        customersSnapshot.forEach(doc => {
            customers[doc.id] = { name: doc.data().name };
        });
    }

    const quotes: QuoteProfile[] = quotesSnapshot.docs.map(doc => {
        const data = doc.data();
        const customerInfo = customers[data.customerId] || {};
        // Firestore timestamps can be tricky. This ensures we handle both Timestamp objects and ISO strings if they exist.
        const validUntilDate = data.validUntil ? new Date(data.validUntil.seconds ? data.validUntil.toDate() : data.validUntil) : new Date();

        const parsedData = QuoteProfileSchema.parse({
            id: doc.id,
            ...data,
            // Ensure the data being passed to the schema is a string, as expected.
            validUntil: validUntilDate.toISOString(), 
            createdAt: data.createdAt.toDate().toISOString(),
            updatedAt: data.updatedAt.toDate().toISOString(),
            customerName: customerInfo.name,
        });
        
        return parsedData;
    });

    return quotes;
};

export const updateQuote = async (quoteId: string, input: z.infer<typeof UpdateQuoteSchema>, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const quoteRef = adminDb.collection('quotes').doc(quoteId);

    const quoteDoc = await quoteRef.get();
    if (!quoteDoc.exists || quoteDoc.data()?.companyId !== organizationId) {
        throw new Error('Orçamento não encontrado ou acesso negado.');
    }

    const { id, ...updateData } = input;

    await quoteRef.update({
        ...updateData,
        updatedAt: FieldValue.serverTimestamp(),
    });

    return { id: quoteId, number: input.number || quoteDoc.data()?.number };
};
