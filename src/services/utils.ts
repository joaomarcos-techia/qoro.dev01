
'use server';

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Tipo de retorno modificado para ser um objeto simples (POJO)
type AdminOrgResult = {
    userData: { [key: string]: any }; // Plain object
    cnpj: string;
    companyId: string;
    organizationId: string;
    organizationName: string;
    userRole: string;
    adminUid: string;
    planId: 'free' | 'growth' | 'performance';
    stripeCustomerId: string | null;
} | null;


export const getAdminAndOrg = async (actorUid: string): Promise<AdminOrgResult> => {
    if (!actorUid || typeof actorUid !== 'string' || actorUid.trim() === '') {
        throw new Error('O ID do ator (actorUid) é inválido ou não foi fornecido.');
    }
    
    const userDocRef = adminDb.collection('users').doc(actorUid);
    const userDoc = await userDocRef.get();
    
    if (!userDoc.exists) {
        return null;
    }
    
    const userData = userDoc.data()!;
    const companyId = userData.organizationId;
    const userRole = userData.role || 'member'; 
    const planId = userData.planId || 'free'; 
    
    if (!companyId) {
        return null;
    }
    
    const orgDocRef = adminDb.collection('organizations').doc(companyId);
    const orgDoc = await orgDocRef.get();
    
    if (!orgDoc.exists) {
        throw new Error(`Organization with ID ${companyId} not found, but is referenced by user ${actorUid}.`);
    }
    const orgData = orgDoc.data()!;

    // Convert any complex objects (like Timestamps) to plain types
    const plainUserData = JSON.parse(JSON.stringify(userData, (key, value) => {
        if (value instanceof Timestamp) {
            return value.toDate().toISOString();
        }
        return value;
    }));

    return { 
        userData: plainUserData,
        companyId: companyId, 
        organizationId: companyId,
        organizationName: orgData.name, 
        userRole, 
        adminUid: actorUid,
        planId,
        stripeCustomerId: orgData.stripeCustomerId || null,
        cnpj: orgData.cnpj || null,
    };
};
