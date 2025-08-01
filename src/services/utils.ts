
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

export const getAdminAndOrg = async (actorUid: string) => {
    if (!actorUid) {
        throw new Error('User must be authenticated to perform this action.');
    }
    
    const adminDocRef = db.collection('users').doc(actorUid);
    const adminDoc = await adminDocRef.get();
    
    if (!adminDoc.exists) {
        throw new Error('Admin user not found in Firestore.');
    }
    
    const adminData = adminDoc.data()!;
    const organizationId = adminData.organizationId;
    
    if (!organizationId) {
        throw new Error('Admin user does not belong to an organization.');
    }
    
    if (adminData.role !== 'admin') {
        // For now, let's allow non-admins to perform some actions,
        // but we can tighten this later.
        // For example, only admins can invite users, but members can view customers.
        // throw new Error('User does not have admin privileges.');
    }

    return { adminDocRef, adminData, organizationId, adminUid: actorUid };
};
