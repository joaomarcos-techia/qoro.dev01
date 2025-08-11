
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { AccountSchema, AccountProfileSchema, InvoiceSchema, InvoiceProfileSchema } from '@/ai/schemas';
import { getAdminAndOrg } from './utils';
import { adminDb } from '@/lib/firebase-admin';

export const createAccount = async (input: z.infer<typeof AccountSchema>, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);

    const newAccountData = {
        ...input,
        companyId: organizationId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };
    
    try {
        const accountRef = await adminDb.collection('accounts').add(newAccountData);
        return { id: accountRef.id };
    } catch (error: any) {
        console.error("Erro ao criar conta no Firestore:", error, error.stack);
        throw new Error("Falha ao salvar a conta no banco de dados. Tente novamente mais tarde.");
    }
};


export const listAccounts = async (actorUid: string): Promise<z.infer<typeof AccountProfileSchema>[]> => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    
    try {
        const accountsSnapshot = await adminDb.collection('accounts')
                                         .where('companyId', '==', organizationId)
                                         .orderBy('createdAt', 'desc')
                                         .get();
        
        if (accountsSnapshot.empty) {
            return [];
        }
        
        const accounts: z.infer<typeof AccountProfileSchema>[] = accountsSnapshot.docs.map(doc => {
            const data = doc.data();
            const parsedData = {
                id: doc.id,
                ...data,
                createdAt: data.createdAt.toDate().toISOString(),
            };
    
            return AccountProfileSchema.parse(parsedData);
        });
        
        return accounts;
    } catch (error) {
        console.error("Erro ao buscar contas:", error);
        // Lançar um erro mais genérico para o cliente, mas logar o erro real no servidor
        throw new Error("Não foi possível carregar as contas financeiras devido a um erro no servidor.");
    }
};

export const getDashboardMetrics = async (actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);

    const accountsRef = adminDb.collection('accounts').where('companyId', '==', organizationId);
    const transactionsRef = adminDb.collection('transactions').where('companyId', '==', organizationId);

    // Get date range for the current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const accountsSnapshot = await accountsRef.get();
    const totalBalance = accountsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().balance || 0), 0);
    
    const incomePromise = transactionsRef
        .where('type', '==', 'income')
        .where('date', '>=', startOfMonth)
        .where('date', '<=', endOfMonth)
        .get();

    const expensePromise = transactionsRef
        .where('type', '==', 'expense')
        .where('date', '>=', startOfMonth)
        .where('date', '<=', endOfMonth)
        .get();

    const [incomeSnapshot, expenseSnapshot] = await Promise.all([incomePromise, expensePromise]);

    const totalIncome = incomeSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
    const totalExpense = expenseSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
    const netProfit = totalIncome - totalExpense;
    
    return {
        totalBalance,
        totalIncome,
        totalExpense,
        netProfit,
    };
};

export const createInvoiceFromQuote = async (quoteId: string, actorUid: string) => {
    const { organizationId } = await getAdminAndOrg(actorUid);
    const quoteRef = adminDb.collection('quotes').doc(quoteId);

    const quoteDoc = await quoteRef.get();
    if (!quoteDoc.exists || quoteDoc.data()?.companyId !== organizationId) {
        throw new Error('Orçamento não encontrado ou acesso negado.');
    }

    const quoteData = quoteDoc.data()!;
    if (quoteData.status !== 'accepted') {
        throw new Error('Apenas orçamentos aceitos podem ser convertidos em faturas.');
    }
    
    const issueDate = new Date();
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 30); // Default due date: 30 days from now

    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

    const newInvoiceData: z.infer<typeof InvoiceSchema> = {
        customerId: quoteData.customerId,
        quoteId: quoteId,
        items: quoteData.items,
        subtotal: quoteData.subtotal,
        discount: quoteData.discount,
        total: quoteData.total,
        issueDate: issueDate.toISOString(),
        dueDate: dueDate.toISOString(),
        paymentStatus: 'pending',
        notes: quoteData.notes,
    };

    const invoiceRef = await adminDb.collection('invoices').add({
        ...newInvoiceData,
        number: invoiceNumber,
        companyId: organizationId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });

    // Optionally, create a pending transaction
    // This part can be expanded later
    const defaultAccount = await adminDb.collection('accounts').where('companyId', '==', organizationId).limit(1).get();
    if (!defaultAccount.empty) {
        const defaultAccountId = defaultAccount.docs[0].id;
        await adminDb.collection('transactions').add({
            companyId: organizationId,
            accountId: defaultAccountId,
            type: 'income',
            amount: quoteData.total,
            description: `Fatura ${invoiceNumber} para ${quoteData.customerName}`,
            date: dueDate,
            category: 'Vendas',
            status: 'pending',
            paymentMethod: 'boleto',
            customerId: quoteData.customerId,
            invoiceId: invoiceRef.id,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });
    }

    return { id: invoiceRef.id, number: invoiceNumber };
};

export const listInvoices = async (actorUid: string): Promise<z.infer<typeof InvoiceProfileSchema>[]> => {
    const { organizationId } = await getAdminAndOrg(actorUid);

    const invoicesSnapshot = await adminDb.collection('invoices')
                                     .where('companyId', '==', organizationId)
                                     .orderBy('createdAt', 'desc')
                                     .get();
    
    if (invoicesSnapshot.empty) {
        return [];
    }

    const customerIds = [...new Set(invoicesSnapshot.docs.map(doc => doc.data().customerId).filter(id => id))];
    const customers: Record<string, { name?: string }> = {};

    if (customerIds.length > 0) {
        const customersSnapshot = await adminDb.collection('customers').where('__name__', 'in', customerIds).get();
        customersSnapshot.forEach(doc => {
            customers[doc.id] = { name: doc.data().name };
        });
    }
    
    const invoices: z.infer<typeof InvoiceProfileSchema>[] = invoicesSnapshot.docs.map(doc => {
        const data = doc.data();
        const customerInfo = customers[data.customerId] || {};
        const parsedData = {
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate().toISOString(),
            updatedAt: data.updatedAt.toDate().toISOString(),
            customerName: customerInfo.name,
        };
        return InvoiceProfileSchema.parse(parsedData);
    });
    
    return invoices;
};
