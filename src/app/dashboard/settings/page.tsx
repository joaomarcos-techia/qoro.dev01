

'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Mail, Send, KeyRound, UserPlus, Building, AlertCircle, CheckCircle, ArrowLeft, User, Shield, Users, Loader2, ExternalLink, Trash2, Lock } from 'lucide-react';
import { inviteUser, listUsers, updateUserPermissions, deleteUser } from '@/ai/flows/user-management';
import { sendPasswordResetEmail } from '@/lib/auth';
import { createBillingPortalSession } from '@/ai/flows/billing-flow';
import { UserProfile, InviteUserSchema } from '@/ai/schemas';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { OrganizationForm } from '@/components/dashboard/settings/OrganizationForm';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePlan } from '@/contexts/PlanContext';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type AppPermission = 'qoroCrm' | 'qoroPulse' | 'qoroTask' | 'qoroFinance';

const appPermissionsMap: Record<AppPermission, string> = {
    qoroCrm: 'QoroCRM',
    qoroPulse: 'QoroPulse',
    qoroTask: 'QoroTask',
    qoroFinance: 'QoroFinance',
};

const planNames: Record<string, string> = {
    free: 'Essencial',
    growth: 'Growth',
    performance: 'Performance'
};

const FREE_PLAN_USER_LIMIT = 2;

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('account');
    const [inviteEmail, setInviteEmail] = useState('');
    const [invitePassword, setInvitePassword] = useState('');
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [isLoading, setIsLoading] = useState({ invite: false, password: false, users: true, permissions: '', portal: false, deleteUser: '' });
    const [feedback, setFeedback] = useState<{ type: 'error' | 'success', message: string, context: string } | null>(null);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const { planId, isLoading: isPlanLoading, role: userRole } = usePlan();

    const isUserLimitReached = planId === 'free' && users.length >= FREE_PLAN_USER_LIMIT;
    const isAdmin = userRole === 'admin';


    const clearFeedback = (context: string) => {
        if (feedback?.context === context) {
            setFeedback(null);
        }
    };
    
    const fetchUsers = useCallback(async () => {
        if (!currentUser) return;
        setIsLoading(prev => ({ ...prev, users: true }));
        try {
            const userList = await listUsers({ actor: currentUser.uid });
            // Ordena a lista para colocar o admin no topo
            userList.sort((a, b) => {
                if (a.role === 'admin') return -1;
                if (b.role === 'admin') return 1;
                return (a.name || a.email).localeCompare(b.name || b.email);
            });
            setUsers(userList);
        } catch (error) {
            console.error("Failed to fetch users:", error);
            setFeedback({ type: 'error', message: 'Não foi possível carregar a lista de usuários.', context: 'users' });
        } finally {
            setIsLoading(prev => ({ ...prev, users: false }));
        }
    }, [currentUser]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (currentUser && activeTab === 'users' && isAdmin) {
            fetchUsers();
        }
    }, [activeTab, currentUser, fetchUsers, isAdmin]);
    
    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setFeedback(null); // Clear feedback when changing tabs
    };

    const handlePasswordReset = async () => {
        if (!currentUser?.email) return;
        setIsLoading(prev => ({ ...prev, password: true }));
        clearFeedback('password');
        try {
            await sendPasswordResetEmail(currentUser.email);
            setFeedback({ type: 'success', message: 'E-mail para redefinição de senha enviado com sucesso!', context: 'password' });
        } catch (error: any) {
            setFeedback({ type: 'error', message: error.message, context: 'password' });
        } finally {
             setIsLoading(prev => ({ ...prev, password: false }));
        }
    };

    const handleInviteUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !isAdmin || isUserLimitReached) return;
        
        setIsLoading(prev => ({ ...prev, invite: true }));
        clearFeedback('invite');
        try {
            await inviteUser({ email: inviteEmail, password: invitePassword, actor: currentUser.uid });
            setFeedback({ type: 'success', message: `Usuário criado! Um e-mail de verificação e boas-vindas foi enviado.`, context: 'invite' });
            setInviteEmail('');
            setInvitePassword('');
            fetchUsers(); // Refresh user list
        } catch (error: any) {
            console.error(error);
            setFeedback({ type: 'error', message: error.message || 'Falha ao criar usuário. Verifique os dados ou se o e-mail já existe.', context: 'invite' });
        } finally {
            setIsLoading(prev => ({ ...prev, invite: false }));
        }
    };
    
    const handleDeleteUser = async (userId: string) => {
        if (!currentUser || !isAdmin) return;
        setIsLoading(prev => ({ ...prev, deleteUser: userId }));
        try {
            await deleteUser({ userId, actor: currentUser.uid });
            setFeedback({ type: 'success', message: 'Usuário removido com sucesso.', context: 'users' });
            fetchUsers(); // Refresh the list
        } catch (error: any) {
            console.error("Failed to delete user:", error);
            setFeedback({ type: 'error', message: error.message || 'Falha ao remover usuário.', context: 'users' });
        } finally {
            setIsLoading(prev => ({ ...prev, deleteUser: '' }));
        }
    };

    const redirectToCustomerPortal = async () => {
        if (!currentUser) return;
        setIsLoading(prev => ({...prev, portal: true}));
        setFeedback(null);
        try {
            const { url } = await createBillingPortalSession({ actor: currentUser.uid });
            window.location.assign(url);
        } catch (error: any) {
            console.error("Failed to create billing portal session:", error);
            setFeedback({ type: 'error', message: "Não foi possível acessar o portal de assinaturas.", context: 'portal' });
        } finally {
             setIsLoading(prev => ({...prev, portal: false}));
        }
    };

    const handlePermissionChange = async (userId: string, permission: AppPermission, isEnabled: boolean) => {
        const targetUser = users.find(u => u.uid === userId);
        if (!targetUser || !currentUser || !isAdmin) return;
    
        setIsLoading(prev => ({ ...prev, permissions: userId }));
        clearFeedback(`permissions-${userId}`);
    
        const updatedPermissions = {
            ...(targetUser.permissions || {}),
            [permission]: isEnabled,
        };
    
        try {
            await updateUserPermissions({ userId, permissions: updatedPermissions as any, actor: currentUser.uid });
            setUsers(prevUsers => 
                prevUsers.map(u => 
                    u.uid === userId ? { ...u, permissions: updatedPermissions } : u
                )
            );
            setFeedback({ type: 'success', message: 'Permissões atualizadas com sucesso!', context: `permissions-${userId}` });
        } catch (error: any) {
            console.error("Failed to update permissions:", error);
            const friendlyMessage = error instanceof Error && error.message.includes("Administradores não podem alterar as próprias permissões.")
                ? "Você não pode alterar suas próprias permissões."
                : 'Falha ao atualizar permissões.';
            setFeedback({ type: 'error', message: friendlyMessage, context: `permissions-${userId}` });
        } finally {
            setIsLoading(prev => ({ ...prev, permissions: '' }));
            setTimeout(() => clearFeedback(`permissions-${userId}`), 3000);
        }
    };


    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-foreground mb-2">Configurações</h2>
                    <p className="text-muted-foreground">Gerencie sua conta, organização e convide novos membros.</p>
                </div>
                <Link href="/dashboard">
                    <div className="bg-secondary text-secondary-foreground px-4 py-2 rounded-xl hover:bg-secondary/80 transition-all duration-200 border border-border flex items-center justify-center font-semibold">
                        <ArrowLeft className="mr-2 w-5 h-5" />
                        Voltar ao Dashboard
                    </div>
                </Link>
            </div>

            <div className="flex border-b border-border mb-8">
                <button onClick={() => handleTabChange('account')} className={`px-4 py-3 font-semibold flex items-center transition-all duration-300 ${activeTab === 'account' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                    <User className="mr-2 w-5 h-5"/> Minha Conta
                </button>
                 {isAdmin && (
                    <>
                        <button onClick={() => handleTabChange('users')} className={`px-4 py-3 font-semibold flex items-center transition-all duration-300 ${activeTab === 'users' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                            <Users className="mr-2 w-5 h-5"/> Gerenciar Usuários
                        </button>
                        <button onClick={() => handleTabChange('organization')} className={`px-4 py-3 font-semibold flex items-center transition-all duration-300 ${activeTab === 'organization' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                            <Building className="mr-2 w-5 h-5"/> Organização
                        </button>
                    </>
                 )}
            </div>
            
            {feedback?.context === 'portal' && (
                <div className="mb-4 bg-red-800/20 text-red-300 p-4 rounded-lg flex items-center text-sm">
                    <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span>{feedback.message}</span>
                </div>
            )}

            <div>
                {activeTab === 'account' && (
                    <div className="bg-card p-8 rounded-2xl border border-border">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* Account Info */}
                            <div>
                                <div className="flex items-center mb-6">
                                    <div className="p-3 rounded-xl bg-primary text-black mr-4"><User className="w-6 h-6" /></div>
                                    <h3 className="text-xl font-bold text-foreground">Minha Conta</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <Input type="email" value={currentUser?.email || 'Carregando...'} disabled className="w-full pl-12 pr-4 py-3 bg-secondary rounded-xl border-border cursor-not-allowed"/>
                                    </div>
                                    <div className="bg-secondary rounded-xl p-4 border border-border">
                                        <p className="text-sm text-muted-foreground mb-1">Seu plano atual:</p>
                                        {isPlanLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                        ) : (
                                            <p className="text-lg font-bold text-primary">{planId ? planNames[planId] : 'Não identificado'}</p>
                                        )}
                                    </div>
                                    {planId !== 'free' && (
                                        <Button type="button" variant="outline" onClick={redirectToCustomerPortal} disabled={isLoading.portal} className="w-full">
                                            {isLoading.portal && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                            {isLoading.portal ? 'Acessando...' : 'Gerenciar Assinatura'}
                                            {!isLoading.portal && <ExternalLink className="ml-2 h-4 w-4" />}
                                        </Button>
                                    )}
                                </div>
                            </div>
                            {/* Password Change */}
                            <div>
                                <div className="flex items-center mb-6">
                                    <div className="p-3 rounded-xl bg-secondary text-primary mr-4"><KeyRound className="w-6 h-6" /></div>
                                    <h3 className="text-xl font-bold text-foreground">Segurança</h3>
                                </div>
                                <div className='bg-secondary p-6 rounded-xl border border-border'>
                                    <h4 className="text-md font-semibold text-foreground mb-2">Alterar senha</h4>
                                    <p className="text-muted-foreground text-sm mb-4">Um link para redefinição de senha será enviado para o seu e-mail de login.</p>
                                    {feedback && feedback.context === 'password' && (
                                        <div className={`mb-4 p-3 rounded-lg flex items-center text-sm ${feedback.type === 'success' ? 'bg-green-800/20 text-green-300' : 'bg-red-800/20 text-red-300'}`}>
                                            {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3" /> : <AlertCircle className="w-5 h-5 mr-3" />}
                                            <span>{feedback.message}</span>
                                        </div>
                                    )}
                                    <Button onClick={handlePasswordReset} disabled={isLoading.password} className="w-full bg-primary text-primary-foreground">
                                        {isLoading.password && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
                                        {isLoading.password ? 'Enviando...' : 'Enviar e-mail para redefinir senha'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'users' && isAdmin && (
                    <div>
                        <div className="bg-card p-8 rounded-2xl border border-border mb-8">
                            <div className="flex items-start">
                                <div className="p-3 rounded-xl bg-primary text-black mr-6"><UserPlus className="w-6 h-6" /></div>
                                <div className="flex-grow">
                                    <h3 className="text-xl font-bold text-foreground mb-1">Convidar novo usuário</h3>
                                    <p className="text-muted-foreground mb-6">Crie a conta e informe a senha ao membro. Um e-mail de verificação será enviado.</p>
                                    <form onSubmit={handleInviteUser} className="flex flex-col md:flex-row items-start md:items-center gap-4">
                                        <div className="relative flex-grow w-full md:w-auto">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                            <Input type="email" placeholder="E-mail do convidado" value={inviteEmail} onChange={(e) => {setInviteEmail(e.target.value); clearFeedback('invite');}} required disabled={isUserLimitReached || isLoading.invite} className="w-full pl-12 pr-4 py-3 bg-input rounded-xl border-border"/>
                                        </div>
                                        <div className="relative flex-grow w-full md:w-auto">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                            <Input type="password" placeholder="Senha" value={invitePassword} onChange={(e) => {setInvitePassword(e.target.value); clearFeedback('invite');}} required disabled={isUserLimitReached || isLoading.invite} className="w-full pl-12 pr-4 py-3 bg-input rounded-xl border-border"/>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button type="submit" disabled={isLoading.invite || isUserLimitReached} className="bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 font-semibold disabled:opacity-50 w-full md:w-auto flex items-center justify-center">
                                                {isLoading.invite ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <Send className="w-5 h-5 mr-2" />}
                                                Convidar
                                            </Button>
                                            {isUserLimitReached && (
                                                <div className="relative group">
                                                    <Lock className="w-5 h-5 text-yellow-400 cursor-help" />
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1 bg-secondary text-sm rounded-lg border border-border opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Upgrade para adicionar mais usuários.
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </form>
                                    {feedback && feedback.context === 'invite' && (
                                        <div className={`mt-4 p-4 rounded-lg flex items-center text-sm ${feedback.type === 'success' ? 'bg-green-800/20 text-green-300' : 'bg-red-800/20 text-red-300'}`}>
                                            {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3" /> : <AlertCircle className="w-5 h-5 mr-3" />}
                                            <span>{feedback.message}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-card p-8 rounded-2xl border border-border">
                             <h3 className="text-xl font-bold text-foreground mb-6">Usuários da Organização</h3>
                             <div className="space-y-4">
                                {isLoading.users ? (
                                    <div className="flex justify-center items-center py-8">
                                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                    </div>
                                ) : (
                                    users.map((user) => {
                                        const isSelf = user.uid === currentUser?.uid;
                                        const isAdminRow = user.role === 'admin';
                                        
                                        return (
                                            <div key={user.uid} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-border bg-secondary/50">
                                                <div className="flex-grow mb-4 md:mb-0">
                                                    <div className="flex items-center gap-4">
                                                        <p className="font-bold text-foreground">{user.name || user.email}</p>
                                                        {isAdminRow && <span className="text-xs font-bold px-2 py-1 bg-primary/20 text-primary rounded-full flex items-center"><Shield className="w-3 h-3 mr-1.5"/>Admin</span>}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                                </div>
                                                
                                                {!isSelf && (
                                                    <AlertDialog>
                                                        <div className="flex items-center gap-2">
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" className='text-muted-foreground hover:text-destructive rounded-xl' disabled={isLoading.deleteUser === user.uid}>
                                                                    {isLoading.deleteUser === user.uid ? <Loader2 className='w-4 h-4 animate-spin'/> : <Trash2 className="w-4 h-4" />}
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                        </div>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Esta ação é irreversível. O usuário <span className='font-bold'>{user.name || user.email}</span> será permanentemente removido da organização.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteUser(user.uid)} className="bg-destructive hover:bg-destructive/90">
                                                                    Sim, excluir
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                )}
                 {activeTab === 'organization' && isAdmin && <OrganizationForm />}
            </div>
        </div>
    );
}
