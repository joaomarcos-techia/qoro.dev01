
'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Mail, Send, KeyRound, UserPlus, Building, AlertCircle, CheckCircle, ArrowLeft, User, Shield, Users, Loader2 } from 'lucide-react';
import { inviteUser, listUsers, updateUserPermissions } from '@/ai/flows/user-management';
import { UserProfile } from '@/ai/schemas';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { OrganizationForm } from '@/components/dashboard/settings/OrganizationForm';
import { Input } from '@/components/ui/input';

type AppPermission = 'qoroCrm' | 'qoroPulse' | 'qoroTask' | 'qoroFinance';

const appPermissionsMap: Record<AppPermission, string> = {
    qoroCrm: 'QoroCRM',
    qoroPulse: 'QoroPulse',
    qoroTask: 'QoroTask',
    qoroFinance: 'QoroFinance',
};

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('account');
    const [inviteEmail, setInviteEmail] = useState('');
    const [password, setPassword] = useState('');
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [isLoading, setIsLoading] = useState({ invite: false, password: false, users: true, permissions: '' });
    const [feedback, setFeedback] = useState<{ type: 'error' | 'success', message: string, context: string } | null>(null);
    const [users, setUsers] = useState<UserProfile[]>([]);

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
        if (currentUser && activeTab === 'users') {
            fetchUsers();
        }
    }, [activeTab, currentUser, fetchUsers]);
    
    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setFeedback(null); // Clear feedback when changing tabs
    };

    const handleInviteUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        setIsLoading(prev => ({ ...prev, invite: true }));
        clearFeedback('invite');
        try {
            await inviteUser({ email: inviteEmail, actor: currentUser.uid });
            setFeedback({ type: 'success', message: `Convite enviado com sucesso para ${inviteEmail}!`, context: 'invite' });
            setInviteEmail('');
            fetchUsers(); // Refresh user list
        } catch (error) {
            console.error(error);
            setFeedback({ type: 'error', message: 'Falha ao enviar convite. Verifique o e-mail ou se o usuário já existe.', context: 'invite' });
        } finally {
            setIsLoading(prev => ({ ...prev, invite: false }));
        }
    };

    const handlePermissionChange = async (userId: string, permission: AppPermission, isEnabled: boolean) => {
        const targetUser = users.find(u => u.uid === userId);
        if (!targetUser || !targetUser.permissions || !currentUser) return;
    
        setIsLoading(prev => ({ ...prev, permissions: userId }));
        clearFeedback(`permissions-${userId}`);
    
        const updatedPermissions = {
            ...targetUser.permissions,
            [permission]: isEnabled,
        };
    
        try {
            await updateUserPermissions({ userId, permissions: updatedPermissions, actor: currentUser.uid });
            // Update state only on success
            setUsers(prevUsers => 
                prevUsers.map(u => 
                    u.uid === userId ? { ...u, permissions: updatedPermissions } : u
                )
            );
        } catch (error) {
            console.error("Failed to update permissions:", error);
            const friendlyMessage = error instanceof Error && error.message.includes("Administradores não podem alterar as próprias permissões.")
                ? "Você não pode alterar suas próprias permissões."
                : 'Falha ao atualizar permissões.';
            setFeedback({ type: 'error', message: friendlyMessage, context: `permissions-${userId}` });
        } finally {
            setIsLoading(prev => ({ ...prev, permissions: '' }));
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
                 <button onClick={() => handleTabChange('users')} className={`px-4 py-3 font-semibold flex items-center transition-all duration-300 ${activeTab === 'users' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                    <Users className="mr-2 w-5 h-5"/> Gerenciar Usuários
                </button>
                <button onClick={() => handleTabChange('organization')} className={`px-4 py-3 font-semibold flex items-center transition-all duration-300 ${activeTab === 'organization' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                    <Building className="mr-2 w-5 h-5"/> Organização
                </button>
            </div>

            {/* Content Area */}
            <div>
                {activeTab === 'account' && (
                    <div className="bg-card p-8 rounded-2xl border border-border max-w-lg mx-auto">
                        <div className="flex items-center mb-6">
                            <div className="p-3 rounded-xl bg-primary text-black mr-4">
                                <User className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground">Minha Conta</h3>
                        </div>
                         <div className="space-y-4">
                             <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input type="email" value={currentUser?.email || 'Carregando...'} disabled className="w-full pl-12 pr-4 py-3 bg-secondary rounded-xl border-border cursor-not-allowed"/>
                            </div>
                             <div className="relative">
                                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input type="password" placeholder="Nova Senha" className="w-full pl-12 pr-4 py-3 bg-secondary rounded-xl border-border focus:ring-2 focus:ring-primary transition-all duration-200"/>
                            </div>
                         </div>
                    </div>
                )}
                {activeTab === 'users' && (
                    <div>
                        {/* Invite User Section */}
                        <div className="bg-card p-8 rounded-2xl border border-border mb-8">
                            <div className="flex items-start">
                                <div className="p-3 rounded-xl bg-primary text-black mr-6">
                                    <UserPlus className="w-6 h-6" />
                                </div>
                                <div className="flex-grow">
                                    <h3 className="text-xl font-bold text-foreground mb-1">Convidar novo usuário</h3>
                                    <p className="text-muted-foreground mb-6">O membro convidado receberá um e-mail para definir sua senha e acessar a organização.</p>
                                    <form onSubmit={handleInviteUser} className="flex items-center gap-4">
                                        <div className="relative flex-grow">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                            <Input
                                                type="email"
                                                placeholder="E-mail do convidado"
                                                value={inviteEmail}
                                                onChange={(e) => {setInviteEmail(e.target.value); clearFeedback('invite');}}
                                                required
                                                className="w-full pl-12 pr-4 py-3 bg-secondary rounded-xl border-border focus:ring-2 focus:ring-primary transition-all duration-200"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isLoading.invite}
                                            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-all duration-200 flex items-center justify-center font-semibold disabled:opacity-75 disabled:cursor-not-allowed"
                                        >
                                            <Send className="mr-2 w-5 h-5" />
                                            {isLoading.invite ? 'Enviando...' : 'Enviar Convite'}
                                        </button>
                                    </form>
                                    {feedback && feedback.context === 'invite' && (
                                        <div className={`mt-4 p-4 rounded-lg flex items-center text-sm ${feedback.type === 'success' ? 'bg-green-800/20 border-l-4 border-green-500 text-green-300' : 'bg-red-800/20 border-l-4 border-red-500 text-red-300'}`}>
                                            {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3" /> : <AlertCircle className="w-5 h-5 mr-3" />}
                                            <span>{feedback.message}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* User List Section */}
                        <div className="bg-card p-8 rounded-2xl border-border">
                             <h3 className="text-xl font-bold text-foreground mb-6">Usuários da Organização</h3>
                             {isLoading.users ? (
                                 <div className="flex justify-center items-center py-8">
                                     <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                     <p className="ml-4 text-muted-foreground">Carregando usuários...</p>
                                 </div>
                             ) : (
                                <div className="space-y-4">
                                    {users.map(user => (
                                        <div key={user.uid} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-border bg-secondary/50">
                                            <div>
                                                <p className="font-bold text-foreground">{user.name || user.email}</p>
                                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                                <p className="text-xs text-primary uppercase font-semibold mt-1">{user.role}</p>
                                            </div>
                                            <div className="flex items-center gap-4 mt-4 md:mt-0 relative">
                                                {Object.keys(appPermissionsMap).map(key => {
                                                    const perm = key as AppPermission;
                                                    const isSelf = user.uid === currentUser?.uid;
                                                    return (
                                                        <label key={perm} className={`flex items-center space-x-2 text-sm ${isSelf ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                                                            <input
                                                                type="checkbox"
                                                                className="form-checkbox h-5 w-5 rounded text-primary focus:ring-primary border-gray-600 bg-secondary"
                                                                checked={!!user.permissions?.[perm]}
                                                                onChange={(e) => handlePermissionChange(user.uid, perm, e.target.checked)}
                                                                disabled={isLoading.permissions === user.uid || isSelf}
                                                            />
                                                            <span>{appPermissionsMap[perm]}</span>
                                                        </label>
                                                    )
                                                })}
                                                {isLoading.permissions === user.uid && <Loader2 className="absolute -right-7 w-5 h-5 text-primary animate-spin" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             )}
                        </div>
                    </div>
                )}
                 {activeTab === 'organization' && (
                     <OrganizationForm />
                )}
            </div>
        </div>
    );
}

    
