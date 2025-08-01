
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { config } from 'dotenv';

config({ path: `.env` });

let app: App;

if (!getApps().length) {
    try {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
            throw new Error("As variáveis de ambiente do Firebase Admin não estão configuradas corretamente.");
        }

        app = initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
    } catch (e) {
        console.error("Firebase Admin SDK initialization failed.", e);
        throw new Error("Could not initialize Firebase Admin SDK. Ensure environment is configured correctly.");
    }
} else {
    app = getApps()[0];
}

const db = getFirestore(app);

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
