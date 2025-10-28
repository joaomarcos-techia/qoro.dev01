

'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getOrganizationDetails, updateOrganizationDetails } from '@/ai/flows/user-management';
import { createBillingPortalSession } from '@/ai/flows/billing-flow';
import { UpdateOrganizationDetailsSchema, OrganizationProfile } from '@/ai/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, CheckCircle, Building, FileText, Mail, Phone, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const formatCNPJ = (value: string) => {
    if (!value) return "";
    value = value.replace(/\D/g, ''); 
    value = value.replace(/^(\d{2})(\d)/, '$1.$2');
    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
    value = value.replace(/(\d{4})(\d)/, '$1-$2');
    return value.slice(0, 18); 
};

export function OrganizationForm() {
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [organization, setOrganization] = useState<OrganizationProfile | null>(null);
    const [isLoading, setIsLoading] = useState({ page: true, form: false });
    const [feedback, setFeedback] = useState<{ type: 'error' | 'success', message: string } | null>(null);
    
    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors },
      } = useForm<z.infer<typeof UpdateOrganizationDetailsSchema>>({
        resolver: zodResolver(UpdateOrganizationDetailsSchema),
      });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        async function fetchDetails() {
            if (!currentUser) return;
            setIsLoading({ page: true, form: false });
            try {
                const details = await getOrganizationDetails({ actor: currentUser.uid });
                setOrganization(details);
                reset({
                    ...details,
                    cnpj: details.cnpj ? formatCNPJ(details.cnpj) : '',
                }); 
            } catch (error) {
                console.error("Failed to fetch organization details:", error);
                setFeedback({ type: 'error', message: 'Não foi possível carregar os dados da organização.' });
            } finally {
                setIsLoading(prev => ({...prev, page: false }));
            }
        }
        if (currentUser) {
            fetchDetails();
        }
    }, [currentUser, reset]);

    const onSubmit = async (data: z.infer<typeof UpdateOrganizationDetailsSchema>) => {
        if (!currentUser) {
            setFeedback({ type: 'error', message: 'Você precisa estar autenticado.' });
            return;
        }
        setIsLoading(prev => ({ ...prev, form: true }));
        setFeedback(null);
        try {
            const submissionData = {
                ...data,
                cnpj: data.cnpj?.replace(/\D/g, ''),
            };
            await updateOrganizationDetails({ ...submissionData, actor: currentUser.uid });
            setFeedback({ type: 'success', message: 'Dados da organização atualizados com sucesso!' });
        } catch (error) {
            console.error(error);
            setFeedback({ type: 'error', message: 'Falha ao atualizar os dados. Tente novamente.' });
        } finally {
            setIsLoading(prev => ({ ...prev, form: false }));
        }
    };
    
    if (isLoading.page) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="ml-4 text-muted-foreground">Carregando dados da organização...</p>
            </div>
        )
    }

    return (
        <div className="bg-card p-8 rounded-2xl border border-border max-w-2xl mx-auto">
            <div className="flex items-center mb-6">
                <div className="p-3 rounded-xl bg-primary text-black mr-4">
                    <Building className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Dados da Organização</h3>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome da Empresa</Label>
                        <div className="relative">
                            <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input id="name" {...register('name')} className="pl-12 bg-secondary rounded-xl"/>
                        </div>
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cnpj">CNPJ</Label>
                        <div className="relative">
                            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                             <Controller
                                name="cnpj"
                                control={control}
                                render={({ field }) => (
                                    <Input 
                                        id="cnpj" 
                                        {...field}
                                        onChange={(e) => field.onChange(formatCNPJ(e.target.value))}
                                        className="pl-12 bg-secondary rounded-xl"
                                    />
                                )}
                            />
                        </div>
                         {errors.cnpj && <p className="text-sm text-destructive">{errors.cnpj.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="contactEmail">E-mail de Contato</Label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input id="contactEmail" type="email" {...register('contactEmail')} className="pl-12 bg-secondary rounded-xl"/>
                        </div>
                         {errors.contactEmail && <p className="text-sm text-destructive">{errors.contactEmail.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="contactPhone">Telefone de Contato</Label>
                         <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input id="contactPhone" {...register('contactPhone')} className="pl-12 bg-secondary rounded-xl"/>
                        </div>
                        {errors.contactPhone && <p className="text-sm text-destructive">{errors.contactPhone.message}</p>}
                    </div>
                </div>

                {feedback && (
                    <div className={`p-4 rounded-lg flex items-center text-sm ${feedback.type === 'success' ? 'bg-green-800/20 border-l-4 border-green-500 text-green-300' : 'bg-red-800/20 border-l-4 border-red-500 text-red-300'}`}>
                        {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3" /> : <AlertCircle className="w-5 h-5 mr-3" />}
                        <span>{feedback.message}</span>
                    </div>
                )}
                
                <div className="flex justify-end pt-4">
                     <Button 
                        type="submit" 
                        disabled={isLoading.form} 
                        className="bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-all duration-200 border border-transparent hover:border-primary/50 flex items-center justify-center font-semibold disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                        {isLoading.form && <Loader2 className="mr-2 w-5 h-5 animate-spin" />}
                        {isLoading.form ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
