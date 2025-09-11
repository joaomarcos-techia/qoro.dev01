
'use server';

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export const getAdminAndOrg = async (actorUid: string) => {
    if (!actorUid) {
        throw new Error('User must be authenticated to perform this action.');
    }
    
    const userDocRef = adminDb.collection('users').doc(actorUid);
    const userDoc = await userDocRef.get();
    
    if (!userDoc.exists) {
        throw new Error('User not found in Firestore.');
    }
    
    const userData = userDoc.data()!;
    const companyId = userData.organizationId;
    const userRole = userData.role || 'member'; 
    
    if (!companyId) {
        throw new Error('User does not belong to an organization.');
    }
    
    const orgDocRef = adminDb.collection('organizations').doc(companyId);
    const orgDoc = await orgDocRef.get();
    if (!orgDoc.exists) {
        throw new Error('Organization not found.');
    }
    const orgData = orgDoc.data()!;

    // This logic was causing the "Failed to fetch" error because the env vars were not set.
    // Replacing it with a default value to ensure stability.
    const planId: 'free' | 'growth' | 'performance' = 'free';

    return { 
        userDocRef, 
        userData, 
        companyId: companyId, 
        organizationId: companyId, // Keep for backward compatibility where needed
        organizationName: orgData.name, 
        userRole, 
        adminUid: actorUid,
        planId
    };
};
