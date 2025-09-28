
'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { CustomerSchema, CustomerProfileSchema, ProductSchema, ProductProfileSchema, QuoteSchema, QuoteProfileSchema, UpdateCustomerSchema, UpdateProductSchema, UpdateQuoteSchema, BillSchema, ServiceSchema, ServiceProfileSchema, UpdateServiceSchema } from '@/ai/schemas';
import { getAdminAndOrg } from './utils';
import type { QuoteProfile, CustomerProfile } from '@/ai/schemas';
import { adminDb } from '@/lib/firebase-admin';
import * as billService from './billService';

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
        // Garantir que a data seja sempre uma string ISO para consistência
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
        const birthDate = data.birthDate ? (data.birthDate.toDate ? data.birthDate.toDate().toISOString() : data.birthDate) : null;

        const parsedData = {
            id: doc.id,
            ...data,
            createdAt: createdAt,
            birthDate: birthDate,
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

    if (userRole !== 'admin') {
        throw new Error("Permissão negada. Apenas administradores podem excluir clientes.");
    }

    const customerRef = adminDb.collection('customers').doc(customerId);
    const customerDoc = await customerRef.get();
    if (!customerDoc.exists || customerDoc.data()?.companyId !== organizationId) {
        throw new Error('Cliente não encontrado ou acesso negado.');
    }

    // Security Check: Re-add dependency checks for data integrity
    const quotesQuery = adminDb.collection('quotes').where('customerId', '==', customerId).limit(1).get();
    const transactionsQuery = adminDb.collection('transactions').where('customerId', '==', customerId).limit(1).get();
    const [quotesSnapshot, transactionsSnapshot] = await Promise.all([quotesQuery, transactionsQuery]);
    
    if (!quotesSnapshot.empty) {
        throw new Error('Não é possível excluir o cliente pois existem orçamentos associados a ele.');
    }
    if (!transactionsSnapshot.empty) {
        throw new Error('Não é possível excluir o cliente pois existem transações associadas a ele.');
    }

    await customerRef.delete();

    return { id: customerId, success: true };
};

export const getCrmDashboardMetrics = async (actorUid: string) => {
    const customers = await listCustomers(actorUid);
    const leadStatuses: CustomerProfile['status'][] = ['new', 'initial_contact', 'qualification', 'proposal', 'negotiation'];
    const activeLeads = customers.filter(c => leadStatuses.includes(c.status)).length;
    
    return {
        totalCustomers: customers.length,
        activeLeads: activeLeads,
    };
};

export const getOrganizationDetails = async (actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const orgDoc = await adminDb.collection('organizations').doc(organizationId).get();
    if (!orgDoc.exists) {
        throw new Error('Organização não encontrada.');
    }
    return { id: orgDoc.id, ...orgDoc.data() };
}

// Product services
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
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
        return ProductProfileSchema.parse({
            id: doc.id,
            ...data,
            createdAt: createdAt,
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
    const { organizationId } = await getAdminAndOrg(actorUid);

    const productRef = adminDb.collection('products').doc(productId);

    const productDoc = await productRef.get();
    if (!productDoc.exists || productDoc.data()?.companyId !== organizationId) {
        throw new Error('Produto não encontrado ou acesso negado.');
    }

    await productRef.delete();

    return { id: productId, success: true };
};


// Service services
export const createService = async (input: z.infer<typeof ServiceSchema>, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const newServiceData = {
        ...input,
        companyId: organizationId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };
    const serviceRef = await adminDb.collection('services').add(newServiceData);
    return { id: serviceRef.id };
};

export const listServices = async (actorUid: string): Promise<z.infer<typeof ServiceProfileSchema>[]> => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const servicesSnapshot = await adminDb.collection('services')
                                     .where('companyId', '==', organizationId)
                                     .orderBy('createdAt', 'desc')
                                     .get();
    if (servicesSnapshot.empty) {
        return [];
    }
    const services: z.infer<typeof ServiceProfileSchema>[] = servicesSnapshot.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
        return ServiceProfileSchema.parse({
            id: doc.id,
            ...data,
            createdAt: createdAt,
        });
    });
    return services;
};

export const updateService = async (serviceId: string, input: z.infer<typeof UpdateServiceSchema>, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const serviceRef = adminDb.collection('services').doc(serviceId);

    const serviceDoc = await serviceRef.get();
    if (!serviceDoc.exists || serviceDoc.data()?.companyId !== organizationId) {
        throw new Error('Serviço não encontrado ou acesso negado.');
    }

    const { id, ...updateData } = input;

    await serviceRef.update({
        ...updateData,
        updatedAt: FieldValue.serverTimestamp(),
    });

    return { id: serviceId };
};

export const deleteService = async (serviceId: string, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const serviceRef = adminDb.collection('services').doc(serviceId);

    const serviceDoc = await serviceRef.get();
    if (!serviceDoc.exists || serviceDoc.data()?.companyId !== organizationId) {
        throw new Error('Serviço não encontrado ou acesso negado.');
    }

    await serviceRef.delete();
    return { id: serviceId, success: true };
};


// Quote Services
export const createQuote = async (input: z.infer<typeof QuoteSchema>, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    
    const quoteNumber = `QT-${Date.now().toString().slice(-6)}`;
    
    const newQuoteData = {
        ...input,
        number: quoteNumber,
        status: 'draft',
        companyId: organizationId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };
    const quoteRef = await adminDb.collection('quotes').add(newQuoteData);
    return { id: quoteRef.id, number: quoteNumber };
};

export const listQuotes = async (actorUid: string): Promise<QuoteProfile[]> => {
    const { organizationId, organizationName } = await getAdminAndOrg(actorUid);

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
        
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
        const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString();
        const validUntil = data.validUntil?.toDate ? data.validUntil.toDate().toISOString() : null;

        const parsedData = {
            id: doc.id,
            ...data,
            validUntil: validUntil,
            createdAt: createdAt,
            updatedAt: updatedAt,
            customerName: customerInfo.name,
            organizationName
        };
        
        return QuoteProfileSchema.parse(parsedData);
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

    const oldStatus = quoteDoc.data()?.status;
    const { id, ...updateData } = input;

    await quoteRef.update({
        ...updateData,
        updatedAt: FieldValue.serverTimestamp(),
    });

    // If status changed to 'accepted'
    if (updateData.status === 'accepted' && oldStatus !== 'accepted') {
        const quoteData = quoteDoc.data();
        if (!quoteData) throw new Error("Dados do orçamento não encontrados após a atualização.");

        const billData: z.infer<typeof BillSchema> = {
            description: `Orçamento #${quoteData.number}`,
            amount: updateData.total,
            type: 'receivable',
            dueDate: new Date(updateData.validUntil || Date.now()), // Ensure dueDate is a valid Date
            status: 'pending',
            entityType: 'customer',
            entityId: updateData.customerId,
            notes: `Gerado a partir do orçamento ${quoteData.number}.\n${updateData.notes || ''}`,
            tags: [`quote-${quoteId}`]
        };
        await billService.createBill(billData, actorUid);
    }

    return { id: quoteId, number: quoteDoc.data()?.number };
};

export const deleteQuote = async (quoteId: string, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const quoteRef = adminDb.collection('quotes').doc(quoteId);

    const doc = await quoteRef.get();
    if (!doc.exists || doc.data()?.companyId !== organizationId) {
        throw new Error('Orçamento não encontrado ou acesso negado.');
    }

    await quoteRef.delete();
    return { id: quoteId, success: true };
};

    