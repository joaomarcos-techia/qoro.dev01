'use server';

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Tipo de retorno modificado para incluir a possibilidade de um usuário pendente
type AdminOrgResult = {
    userDocRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>;
    userData: FirebaseFirestore.DocumentData;
    companyId: string;
    organizationId: string;
    organizationName: string;
    userRole: string;
    adminUid: string;
    planId: 'free' | 'growth' | 'performance';
} | null;


export const getAdminAndOrg = async (actorUid: string): Promise<AdminOrgResult> => {
    if (!actorUid) {
        // Ainda lançamos erro se o UID não for fornecido
        throw new Error('User must be authenticated to perform this action.');
    }
    
    const userDocRef = adminDb.collection('users').doc(actorUid);
    const userDoc = await userDocRef.get();
    
    // Se o documento do usuário não existe, não é mais um erro.
    // Retornamos null para que o chamador possa lidar com o estado pendente.
    if (!userDoc.exists) {
        console.warn(`User document not found for UID: ${actorUid}. Might be pending webhook processing.`);
        return null;
    }
    
    const userData = userDoc.data()!;
    const companyId = userData.organizationId;
    const userRole = userData.role || 'member'; 
    
    // Se a organizationId ainda não foi definida, também tratamos como pendente.
    if (!companyId) {
        console.warn(`OrganizationId not found for user UID: ${actorUid}. Might be pending webhook processing.`);
        return null;
    }
    
    const orgDocRef = adminDb.collection('organizations').doc(companyId);
    const orgDoc = await orgDocRef.get();
    
    if (!orgDoc.exists) {
        // Se a organização não existe, isso é um erro de integridade de dados.
        throw new Error(`Organization with ID ${companyId} not found, but is referenced by user ${actorUid}.`);
    }
    const orgData = orgDoc.data()!;

    let planId: 'free' | 'growth' | 'performance' = 'free';

    const performancePriceId = process.env.NEXT_PUBLIC_STRIPE_PERFORMANCE_PLAN_PRICE_ID;
    const growthPriceId = process.env.NEXT_PUBLIC_STRIPE_GROWTH_PLAN_PRICE_ID;

    // A lógica para determinar o plano permanece a mesma
    if (orgData.stripePriceId === performancePriceId) {
        planId = 'performance';
    } else if (orgData.stripePriceId === growthPriceId) {
        planId = 'growth';
    }

    return { 
        userDocRef, 
        userData, 
        companyId: companyId, 
        organizationId: companyId,
        organizationName: orgData.name, 
        userRole, 
        adminUid: actorUid,
        planId
    };
};
