
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth, FirebaseAuthError, UserRecord } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { 
    SignUpSchema, 
    UpdateUserPermissionsSchema, 
    UpdateOrganizationDetailsSchema, 
    UserProfile,
    OrganizationProfileSchema 
} from '@/ai/schemas';
import { config } from 'dotenv';
import { getAdminAndOrg } from './utils';

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

const auth = getAuth(app);
const db = getFirestore(app);


export const signUp = async (input: z.infer<typeof SignUpSchema>): Promise<UserRecord> => {
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

        return userRecord;
    } catch (error) {
        const firebaseError = error as FirebaseAuthError;
        if (firebaseError.code === 'auth/email-already-exists') {
            throw new Error('Este e-mail já está em uso.');
        }
        console.error("Error during sign up in organizationService:", firebaseError);
        throw new Error("Ocorreu um erro inesperado durante o cadastro.");
    }
};

export const inviteUser = async (email: string, actor: string): Promise<{ uid: string; email: string; organizationId: string; }> => {
    const { organizationId, adminUid } = await getAdminAndOrg(actor);
    
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
        qoroPulse: false,
        qoroTask: true,
        qoroFinance: false,
      }
    });
    
    try {
        const link = await auth.generatePasswordResetLink(email);
        console.log(`Link de configuração de senha enviado para ${email}. Em um aplicativo real, este link seria enviado por meio de um serviço de e-mail.`);
    } catch(error){
        console.error("Falha ao gerar o link de definição de senha:", error);
    }

    return {
      uid: userRecord.uid,
      email: userRecord.email!,
      organizationId,
    };
};

export const listUsers = async (actor: string): Promise<UserProfile[]> => {
    const { organizationId } = await getAdminAndOrg(actor);
    
    const usersSnapshot = await db.collection('users').where('organizationId', '==', organizationId).get();
    
    const users: UserProfile[] = [];
    usersSnapshot.forEach(doc => {
        const data = doc.data();
        const defaultPermissions = { qoroCrm: false, qoroPulse: false, qoroTask: false, qoroFinance: false };
        users.push({
            uid: doc.id,
            email: data.email,
            name: data.name,
            organizationId: data.organizationId,
            role: data.role,
            permissions: { ...defaultPermissions, ...data.permissions },
        });
    });
    
    return users;
};

export const updateUserPermissions = async (input: z.infer<typeof UpdateUserPermissionsSchema>, actor: string): Promise<{ success: boolean }> => {
    const { organizationId, adminUid } = await getAdminAndOrg(actor);
    const { userId, permissions } = input;
    
    const targetUserRef = db.collection('users').doc(userId);
    const targetUserDoc = await targetUserRef.get();

    if (!targetUserDoc.exists || targetUserDoc.data()?.organizationId !== organizationId) {
        throw new Error("Usuário alvo não encontrado nesta organização.");
    }

    if (adminUid === userId) {
        throw new Error("Administradores não podem alterar as próprias permissões.");
    }

    await targetUserRef.update({ permissions });

    return { success: true };
};

export const getOrganizationDetails = async (actor: string): Promise<z.infer<typeof OrganizationProfileSchema>> => {
    const { organizationId } = await getAdminAndOrg(actor);
    const orgDoc = await db.collection('organizations').doc(organizationId).get();

    if (!orgDoc.exists) {
        throw new Error('Organização não encontrada.');
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

export const updateOrganizationDetails = async (details: z.infer<typeof UpdateOrganizationDetailsSchema>, actor: string): Promise<{ success: boolean }> => {
    const { organizationId } = await getAdminAndOrg(actor);
    
    const updateData: any = {};
    if(details.name) updateData.name = details.name;
    if(details.cnpj) updateData.cnpj = details.cnpj;
    if(details.contactEmail) updateData.contactEmail = details.contactEmail;
    if(details.contactPhone) updateData.contactPhone = details.contactPhone;

    await db.collection('organizations').doc(organizationId).update(updateData);

    return { success: true };
};

    