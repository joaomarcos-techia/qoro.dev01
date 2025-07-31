
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth, FirebaseAuthError } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { 
    SignUpSchema, 
    InviteUserSchema, 
    UpdateUserPermissionsSchema, 
    UpdateOrganizationDetailsSchema, 
    UserProfile,
    OrganizationProfileSchema 
} from '@/ai/schemas';
import { getActor } from 'genkit';
import { config } from 'dotenv';

config({ path: `.env` });

// Adicionando logs para debugging, como sugerido.
console.log('Firebase Config Check:', {
  projectId: process.env.FIREBASE_PROJECT_ID ? 'SET' : 'MISSING',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'MISSING',
  privateKey: process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'MISSING',
});

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

const auth = getAuth(app);
const db = getFirestore(app);

const getAdminAndOrg = async () => {
    const actor = getActor();
    const actorUid = actor?.uid;

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
        throw new Error('User does not have admin privileges.');
    }

    return { adminDocRef, adminData, organizationId, adminUid: actorUid };
};


export const signUp = async (input: z.infer<typeof SignUpSchema>): Promise<{ uid: string }> => {
    const { email, password, name, organizationName, cnpj, contactEmail, contactPhone } = input;
    
    try {
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: name || '',
            emailVerified: false, 
        });

        const orgRef = await db.collection('organizations').add({
            name: organizationName,
            owner: userRecord.uid,
            createdAt: FieldValue.serverTimestamp(),
            cnpj: cnpj,
            contactEmail: contactEmail || null,
            contactPhone: contactPhone || null,
        });

        await db.collection('users').doc(userRecord.uid).set({
            name: name || '',
            email,
            organizationId: orgRef.id,
            role: 'admin',
            createdAt: FieldValue.serverTimestamp(),
            permissions: {
                qoroCrm: true,
                qoroPulse: true,
                qoroTask: true,
                qoroFinance: true,
            },
        });

        console.log(`User ${email} created with emailVerified: false. Firebase will send verification email if template is enabled.`);

        return { uid: userRecord.uid };
    } catch (error) {
        const firebaseError = error as FirebaseAuthError;
        if (firebaseError.code === 'auth/email-already-exists') {
            throw new Error('Este e-mail já está em uso.');
        }
        console.error("Error during sign up in organizationService:", firebaseError);
        // Lança outros erros para serem tratados
        throw new Error("Ocorreu um erro inesperado durante o cadastro.");
    }
};

export const inviteUser = async (input: z.infer<typeof InviteUserSchema>): Promise<{ uid: string; email: string; organizationId: string; }> => {
    const { organizationId, adminUid } = await getAdminAndOrg();
    const { email } = input;
    
    const userRecord = await auth.createUser({
      email,
      emailVerified: false,
    });

    await db.collection('users').doc(userRecord.uid).set({
      email,
      organizationId,
      invitedBy: adminUid,
      createdAt: FieldValue.serverTimestamp(),
      role: 'member',
      permissions: {
        qoroCrm: true,
        qoroPulse: true,
        qoroTask: true,
        qoroFinance: true,
      }
    });
    
    try {
        // This will trigger the password reset email, which for a new user,
        // acts as an account setup and verification email.
        const link = await auth.generatePasswordResetLink(email);
        console.log(`Setup/password reset link sent to ${email}. This link can be customized in Firebase Console to be a welcome email.`);
    } catch(error){
        console.error("Falha ao gerar o link de definição de senha:", error);
    }


    return {
      uid: userRecord.uid,
      email: userRecord.email!,
      organizationId,
    };
};

export const listUsers = async (): Promise<UserProfile[]> => {
    const { organizationId } = await getAdminAndOrg();
    
    const usersSnapshot = await db.collection('users').where('organizationId', '==', organizationId).get();
    
    const users: UserProfile[] = [];
    usersSnapshot.forEach(doc => {
        const data = doc.data();
        users.push({
            uid: doc.id,
            email: data.email,
            name: data.name,
            organizationId: data.organizationId,
            role: data.role,
            permissions: data.permissions,
        });
    });
    
    return users;
};

export const updateUserPermissions = async (input: z.infer<typeof UpdateUserPermissionsSchema>): Promise<{ success: boolean }> => {
    const { organizationId, adminUid } = await getAdminAndOrg();
    const { userId, permissions } = input;
    
    const targetUserRef = db.collection('users').doc(userId);
    const targetUserDoc = await targetUserRef.get();

    if (!targetUserDoc.exists || targetUserDoc.data()?.organizationId !== organizationId) {
        throw new Error("Target user not found in this organization.");
    }

    if (adminUid === userId) {
        throw new Error("Administradores não podem alterar as próprias permissões.");
    }

    await targetUserRef.update({ permissions });

    return { success: true };
};

export const getOrganizationDetails = async (): Promise<z.infer<typeof OrganizationProfileSchema>> => {
    const { organizationId } = await getAdminAndOrg();
    const orgDoc = await db.collection('organizations').doc(organizationId).get();

    if (!orgDoc.exists) {
        throw new Error('Organization not found.');
    }
    const orgData = orgDoc.data()!;
    return {
        id: orgDoc.id,
        name: orgData.name,
        cnpj: orgData.cnpj,
        contactEmail: orgData.contactEmail,
        contactPhone: orgData.contactPhone,
    };
};

export const updateOrganizationDetails = async (details: z.infer<typeof UpdateOrganizationDetailsSchema>): Promise<{ success: boolean }> => {
    const { organizationId } = await getAdminAndOrg();
    
    const updateData = {
        name: details.name,
        cnpj: details.cnpj || null,
        contactEmail: details.contactEmail || null,
        contactPhone: details.contactPhone || null,
    };

    await db.collection('organizations').doc(organizationId).update(updateData);

    return { success: true };
};
