'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Mail, Send, KeyRound, UserPlus, Building, AlertCircle, CheckCircle, ArrowLeft, User, Shield, Users, Loader2, Trash2, Phone, FileText } from 'lucide-react';
import { inviteUser, listUsers, updateUserPermissions, UserProfile, getOrganizationDetails, updateOrganizationDetails, OrganizationProfile } from '@/ai/flows/user-management';
import { changePassword } from '@/lib/auth';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';

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
    const [newPassword, setNewPassword] = useState('');
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [isLoading, setIsLoading] = useState({ invite: false, password: false, users: true, permissions: '', org: true, orgSave: false });
    const [feedback, setFeedback] = useState<{ type: 'error' | 'success', message: string, context: string } | null>(null);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [organization, setOrganization] = useState<Partial<OrganizationProfile>>({ name: '', cnpj: '', contactEmail: '', contactPhone: '' });

    const clearFeedback = (context: string) => {
        if (feedback?.context === context) {
            setFeedback(null);
        }
    };
    
    const fetchUsers = useCallback(async () => {
        setIsLoading(prev => ({ ...prev, users: true }));
        try {
            const userList = await listUsers();
            setUsers(userList);
        } catch (error) {
            console.error("Failed to fetch users:", error);
            setFeedback({ type: 'error', message: 'Não foi possível carregar a lista de usuários.', context: 'users' });
        } finally {
            setIsLoading(prev => ({ ...prev, users: false }));
        }
    }, []);
    
    const fetchOrganization = useCallback(async () => {
        setIsLoading(prev => ({ ...prev, org: true }));
        try {
            const orgDetails = await getOrganizationDetails();
            setOrganization(orgDetails);
        } catch (error) {
            console.error("Failed to fetch organization:", error);
            setFeedback({ type: 'error', message: 'Não foi possível carregar os dados da organização.', context: 'org' });
        } finally {
            setIsLoading(prev => ({ ...prev, org: false }));
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (currentUser) {
            if (activeTab === 'users') {
                fetchUsers();
            } else if (activeTab === 'organization') {
                fetchOrganization();
            }
        }
        setFeedback(null);
    }, [activeTab, currentUser, fetchUsers, fetchOrganization]);
    
    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
    };

    const handleInviteUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(prev => ({ ...prev, invite: true }));
        clearFeedback('invite');
        try {
            await inviteUser({ email: inviteEmail });
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

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            setFeedback({ type: 'error', message: 'A nova senha deve ter pelo menos 6 caracteres.', context: 'password' });
            return;
        }
        setIsLoading(prev => ({ ...prev, password: true }));
        clearFeedback('password');
        try {
            await changePassword(newPassword);
            setFeedback({ type: 'success', message: 'Senha alterada com sucesso!', context: 'password' });
            setNewPassword('');
        } catch (error: any) {
            console.error(error);
            setFeedback({ type: 'error', message: 'Falha ao alterar a senha. Tente novamente mais tarde.', context: 'password' });
        } finally {
            setIsLoading(prev => ({ ...prev, password: false }));
        }
    };

    const handlePermissionChange = async (userId: string, permission: AppPermission, isEnabled: boolean) => {
        setIsLoading(prev => ({ ...prev, permissions: userId }));
        clearFeedback(`permissions-${userId}`);
        const targetUser = users.find(u => u.uid === userId);
        if (!targetUser) return;

        const updatedPermissions = {
            ...targetUser.permissions,
            [permission]: isEnabled
        };

        try {
            await updateUserPermissions({ userId, permissions: updatedPermissions as any });
            setUsers(users.map(u => u.uid === userId ? { ...u, permissions: updatedPermissions } : u));
        } catch (error) {
            console.error("Failed to update permissions:", error);
            const friendlyMessage = error instanceof Error && error.message.includes("cannot change their own permissions")
                ? "Você não pode alterar suas próprias permissões."
                : 'Falha ao atualizar permissões.';
            setFeedback({ type: 'error', message: friendlyMessage, context: `permissions-${userId}` });
        } finally {
            setIsLoading(prev => ({ ...prev, permissions: '' }));
        }
    };

    const handleOrgDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setOrganization({
            ...organization,
            [e.target.name]: e.target.value
        });
    };

    const handleSaveOrgDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(prev => ({...prev, orgSave: true}));
        clearFeedback('org');
        try {
            await updateOrganizationDetails({
                name: organization.name || '',
                cnpj: organization.cnpj || '',
                contactEmail: organization.contactEmail || '',
                contactPhone: organization.contactPhone || '',
            });
            setFeedback({ type: 'success', message: 'Dados da organização salvos com sucesso!', context: 'org' });
        } catch (error) {
            console.error(error);
            setFeedback({ type: 'error', message: 'Não foi possível salvar os dados. Tente novamente.', context: 'org' });
        } finally {
            setIsLoading(prev => ({...prev, orgSave: false}));
        }
    }


    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-black mb-2">Configurações</h2>
                    <p className="text-gray-600">Gerencie sua conta, organização e convide novos membros.</p>
                </div>
                <Link href="/dashboard">
                    <div className="bg-white text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-neumorphism hover:shadow-neumorphism-hover flex items-center justify-center font-semibold">
                        <ArrowLeft className="mr-2 w-5 h-5" />
                        Voltar ao Dashboard
                    </div>
                </Link>
            </div>

            <div className="flex border-b border-gray-200 mb-8">
                <button onClick={() => handleTabChange('account')} className={`px-4 py-3 font-semibold flex items-center transition-all duration-300 ${activeTab === 'account' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-black'}`}>
                    <User className="mr-2 w-5 h-5"/> Minha Conta
                </button>
                 <button onClick={() => handleTabChange('users')} className={`px-4 py-3 font-semibold flex items-center transition-all duration-300 ${activeTab === 'users' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-black'}`}>
                    <Users className="mr-2 w-5 h-5"/> Gerenciar Usuários
                </button>
                <button onClick={() => handleTabChange('organization')} className={`px-4 py-3 font-semibold flex items-center transition-all duration-300 ${activeTab === 'organization' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-black'}`}>
                    <Building className="mr-2 w-5 h-5"/> Organização
                </button>
            </div>

            {/* Content Area */}
            <div>
                {activeTab === 'account' && (
                     <div className="bg-white p-8 rounded-2xl shadow-neumorphism border border-gray-200 max-w-2xl mx-auto">
                         <div className="flex items-start">
                            <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white mr-6 shadow-neumorphism">
                                <KeyRound className="w-6 h-6" />
                            </div>
                            <div className="flex-grow">
                                <h3 className="text-xl font-bold text-black mb-1">Configurações da Conta</h3>
                                <p className="text-gray-600 mb-6">Altere sua senha de acesso.</p>
                                <form onSubmit={handleChangePassword} className="space-y-4">
                                     <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input type="email" value={currentUser?.email || 'Carregando...'} disabled className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl shadow-neumorphism-inset cursor-not-allowed"/>
                                    </div>
                                     <div className="relative">
                                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input 
                                            type="password" 
                                            placeholder="Nova Senha (mínimo 6 caracteres)"
                                            value={newPassword}
                                            onChange={(e) => {setNewPassword(e.target.value); clearFeedback('password');}}
                                            required 
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl shadow-neumorphism-inset focus:ring-2 focus:ring-primary transition-all duration-300"/>
                                    </div>
                                    <div className="flex justify-end">
                                        <button 
                                            type="submit"
                                            disabled={isLoading.password}
                                            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-neumorphism hover:shadow-neumorphism-hover flex items-center justify-center font-semibold disabled:opacity-75 disabled:cursor-not-allowed">
                                            {isLoading.password ? 'Salvando...' : 'Salvar Alterações'}
                                        </button>
                                    </div>
                                </form>
                                 {feedback && feedback.context === 'password' && (
                                     <div className={`mt-4 p-4 rounded-lg flex items-center text-sm ${feedback.type === 'success' ? 'bg-green-100 border-l-4 border-green-500 text-green-800' : 'bg-red-100 border-l-4 border-red-500 text-red-700'}`}>
                                        {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3" /> : <AlertCircle className="w-5 h-5 mr-3" />}
                                        <span>{feedback.message}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'users' && (
                    <div>
                        {/* Invite User Section */}
                        <div className="bg-white p-8 rounded-2xl shadow-neumorphism border border-gray-200 mb-8">
                            <div className="flex items-start">
                                <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white mr-6 shadow-neumorphism">
                                    <UserPlus className="w-6 h-6" />
                                </div>
                                <div className="flex-grow">
                                    <h3 className="text-xl font-bold text-black mb-1">Convidar novo usuário</h3>
                                    <p className="text-gray-600 mb-6">O membro convidado terá acesso à organização com as permissões que você definir.</p>
                                    <form onSubmit={handleInviteUser} className="flex items-center gap-4">
                                        <div className="relative flex-grow">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="email"
                                                placeholder="E-mail do convidado"
                                                value={inviteEmail}
                                                onChange={(e) => {setInviteEmail(e.target.value); clearFeedback('invite');}}
                                                required
                                                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl shadow-neumorphism-inset focus:ring-2 focus:ring-primary transition-all duration-300"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isLoading.invite}
                                            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-neumorphism hover:shadow-neumorphism-hover flex items-center justify-center font-semibold disabled:opacity-75 disabled:cursor-not-allowed"
                                        >
                                            <Send className="mr-2 w-5 h-5" />
                                            {isLoading.invite ? 'Enviando...' : 'Enviar Convite'}
                                        </button>
                                    </form>
                                    {feedback && feedback.context === 'invite' && (
                                        <div className={`mt-4 p-4 rounded-lg flex items-center text-sm ${feedback.type === 'success' ? 'bg-green-100 border-l-4 border-green-500 text-green-800' : 'bg-red-100 border-l-4 border-red-500 text-red-700'}`}>
                                            {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3" /> : <AlertCircle className="w-5 h-5 mr-3" />}
                                            <span>{feedback.message}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* User List Section */}
                        <div className="bg-white p-8 rounded-2xl shadow-neumorphism border border-gray-200">
                             <h3 className="text-xl font-bold text-black mb-6">Usuários da Organização</h3>
                             {isLoading.users ? (
                                 <div className="flex justify-center items-center py-8">
                                     <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                     <p className="ml-4 text-gray-600">Carregando usuários...</p>
                                 </div>
                             ) : (
                                <div className="space-y-4">
                                    {users.map(user => (
                                        <div key={user.uid} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-gray-100 shadow-neumorphism-inset">
                                            <div>
                                                <p className="font-bold text-black">{user.name || user.email}</p>
                                                <p className="text-sm text-gray-500">{user.email}</p>
                                                <p className="text-xs text-gray-400 uppercase font-semibold mt-1">{user.role}</p>
                                            </div>
                                            <div className="flex items-center gap-4 mt-4 md:mt-0 relative">
                                                {Object.keys(appPermissionsMap).map(key => {
                                                    const perm = key as AppPermission;
                                                    const isSelf = user.uid === currentUser?.uid;
                                                    return (
                                                        <label key={perm} className={`flex items-center space-x-2 text-sm ${isSelf ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                                                            <input
                                                                type="checkbox"
                                                                className="form-checkbox h-5 w-5 rounded text-primary focus:ring-primary border-gray-300"
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
                    <div className="space-y-8">
                         {isLoading.org ? (
                             <div className="flex justify-center items-center py-8">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                <p className="ml-4 text-gray-600">Carregando dados da organização...</p>
                            </div>
                         ) : (
                            <>
                            {/* Organization Profile */}
                            <div className="bg-white p-8 rounded-2xl shadow-neumorphism border border-gray-200">
                                <div className="flex items-start">
                                    <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white mr-6 shadow-neumorphism">
                                        <Building className="w-6 h-6" />
                                    </div>
                                    <form onSubmit={handleSaveOrgDetails} className="flex-grow">
                                        <h3 className="text-xl font-bold text-black mb-1">Perfil da Organização</h3>
                                        <p className="text-gray-600 mb-6">Veja e gerencie as informações da sua organização.</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Nome da Organização */}
                                            <div className="relative">
                                                <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input type="text" name="name" placeholder="Nome da Organização" value={organization.name || ''} onChange={handleOrgDetailsChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl shadow-neumorphism-inset focus:ring-2 focus:ring-primary transition-all duration-300"/>
                                            </div>
                                            {/* CNPJ */}
                                            <div className="relative">
                                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input type="text" name="cnpj" placeholder="CNPJ" value={organization.cnpj || ''} onChange={handleOrgDetailsChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl shadow-neumorphism-inset focus:ring-2 focus:ring-primary transition-all duration-300"/>
                                            </div>
                                            {/* Email de Contato */}
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input type="email" name="contactEmail" placeholder="Email de Contato" value={organization.contactEmail || ''} onChange={handleOrgDetailsChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl shadow-neumorphism-inset focus:ring-2 focus:ring-primary transition-all duration-300"/>
                                            </div>
                                            {/* Telefone de Contato */}
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input type="tel" name="contactPhone" placeholder="Telefone de Contato" value={organization.contactPhone || ''} onChange={handleOrgDetailsChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl shadow-neumorphism-inset focus:ring-2 focus:ring-primary transition-all duration-300"/>
                                            </div>
                                        </div>
                                        <div className="flex justify-end mt-6">
                                            <button 
                                                type="submit"
                                                disabled={isLoading.orgSave}
                                                className="bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-neumorphism hover:shadow-neumorphism-hover flex items-center justify-center font-semibold disabled:opacity-75 disabled:cursor-not-allowed">
                                                {isLoading.orgSave ? 'Salvando...' : 'Salvar Alterações'}
                                            </button>
                                        </div>
                                        {feedback && feedback.context === 'org' && (
                                            <div className={`mt-4 p-4 rounded-lg flex items-center text-sm ${feedback.type === 'success' ? 'bg-green-100 border-l-4 border-green-500 text-green-800' : 'bg-red-100 border-l-4 border-red-500 text-red-700'}`}>
                                                {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3" /> : <AlertCircle className="w-5 h-5 mr-3" />}
                                                <span>{feedback.message}</span>
                                            </div>
                                        )}
                                    </form>
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="bg-white p-8 rounded-2xl shadow-neumorphism border border-red-300">
                                <div className="flex items-start">
                                    <div className="p-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white mr-6 shadow-neumorphism">
                                        <AlertCircle className="w-6 h-6" />
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="text-xl font-bold text-red-700 mb-1">Zona de Perigo</h3>
                                        <p className="text-gray-600 mb-6">Ações nesta área são perigosas e irreversíveis. Tenha certeza do que está fazendo.</p>
                                        <div className="flex justify-between items-center p-4 border border-red-200 rounded-xl bg-red-50/50">
                                            <div>
                                                <p className="font-bold text-black">Excluir esta organização</p>
                                                <p className="text-sm text-gray-600">Todo o conteúdo, usuários e configurações serão permanentemente deletados.</p>
                                            </div>
                                            <button 
                                                disabled // Feature desabilitada por segurança
                                                className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-all duration-300 shadow-neumorphism hover:shadow-neumorphism-hover flex items-center justify-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
                                            >
                                                <Trash2 className="mr-2 w-5 h-5"/>
                                                Excluir Organização
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            </>
                         )}
                    </div>
                )}
            </div>
        </div>
    );
}
