
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createCustomer, updateCustomer } from '@/ai/flows/crm-management';
import { CustomerSchema, CustomerProfile } from '@/ai/schemas';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2, AlertCircle, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

type CustomerFormProps = {
  onCustomerAction: () => void;
  customer?: CustomerProfile | null;
};

const FormSchema = CustomerSchema.extend({
    birthDate: z.string().optional().nullable(),
});
type FormValues = z.infer<typeof FormSchema>;

// --- Funções de formatação ---
const formatCPF = (value: string) => {
    if (!value) return "";
    const onlyDigits = value.replace(/\D/g, '');
    
    if (onlyDigits.length <= 3) return onlyDigits;
    if (onlyDigits.length <= 6) return `${onlyDigits.slice(0, 3)}.${onlyDigits.slice(3)}`;
    if (onlyDigits.length <= 9) return `${onlyDigits.slice(0, 3)}.${onlyDigits.slice(3, 6)}.${onlyDigits.slice(6)}`;
    return `${onlyDigits.slice(0, 3)}.${onlyDigits.slice(3, 6)}.${onlyDigits.slice(6, 9)}-${onlyDigits.slice(9, 11)}`;
};


const formatCNPJ = (value: string) => {
    if (!value) return "";
    value = value.replace(/\D/g, '');
    value = value.replace(/^(\d{2})(\d)/, '$1.$2');
    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
    value = value.replace(/(\d{4})(\d)/, '$1-$2');
    return value.slice(0, 18);
};

const formatPhone = (value: string) => {
    if (!value) return "";
    value = value.replace(/\D/g, '');
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
    value = value.replace(/(\d{5})(\d)/, '$1-$2');
    return value.slice(0, 15);
};
// -----------------------------

export function CustomerForm({ onCustomerAction, customer }: CustomerFormProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!customer;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '', email: '', phone: '', company: '', cpf: '', cnpj: '',
      birthDate: null, address: { street: '', number: '', neighborhood: '', city: '', state: '', zipCode: '' },
      tags: [], source: '', status: 'new', customFields: {}
    }
  });

  useEffect(() => {
    if (customer) {
        const birthDate = customer.birthDate ? format(parseISO(customer.birthDate as string), 'yyyy-MM-dd') : null;
        reset({ ...customer, birthDate });
    } else {
        reset({
            name: '', email: '', phone: '', company: '', cpf: '', cnpj: '',
            birthDate: null, address: { street: '', number: '', neighborhood: '', city: '', state: '', zipCode: '' },
            tags: [], source: '', status: 'new', customFields: {}
        });
    }
  }, [customer, reset]);

  const onSubmit = async (data: FormValues) => {
    if (!currentUser) {
      setError('Você precisa estar autenticado para executar esta ação.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const submissionData = {
        ...data,
        cpf: data.cpf?.replace(/\D/g, ''),
        cnpj: data.cnpj?.replace(/\D/g, ''),
        phone: data.phone?.replace(/\D/g, ''),
        birthDate: data.birthDate ? new Date(data.birthDate).toISOString() : undefined,
      };

      if (isEditMode) {
        await updateCustomer({ ...submissionData, id: customer.id, actor: currentUser.uid });
      } else {
        await createCustomer({ ...submissionData, actor: currentUser.uid });
      }
      onCustomerAction();
    } catch (err: any) {
      console.error(err);
      setError(err.message || `Falha ao ${isEditMode ? 'atualizar' : 'criar'} o cliente. Tente novamente.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 py-4">
      {/* Informações Pessoais */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">Informações Pessoais</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
            <Label htmlFor="name">Nome Completo*</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
            <Label htmlFor="email">Email*</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                        <Input
                            id="phone"
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(formatPhone(e.target.value))}
                        />
                    )}
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                <Input id="birthDate" type="date" {...register('birthDate')} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Controller
                    name="cpf"
                    control={control}
                    render={({ field }) => (
                        <Input
                            id="cpf"
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(formatCPF(e.target.value))}
                        />
                    )}
                />
            </div>
        </div>
      </div>
      
       {/* Informações da Empresa */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">Informações da Empresa (Opcional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="company">Nome da Empresa</Label>
                <Input id="company" {...register('company')} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                 <Controller
                    name="cnpj"
                    control={control}
                    render={({ field }) => (
                        <Input
                            id="cnpj"
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(formatCNPJ(e.target.value))}
                        />
                    )}
                />
            </div>
        </div>
      </div>

       {/* Endereço */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">Endereço</h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address.street">Rua</Label>
                <Input id="address.street" {...register('address.street')} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="address.number">Número</Label>
                <Input id="address.number" {...register('address.number')} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="address.neighborhood">Bairro</Label>
                <Input id="address.neighborhood" {...register('address.neighborhood')} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="address.city">Cidade</Label>
                <Input id="address.city" {...register('address.city')} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="address.state">Estado</Label>
                <Input id="address.state" {...register('address.state')} />
            </div>
        </div>
      </div>
      
       {/* Status e Fonte */}
       <div>
         <h3 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">Status e Fonte</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
            <Label>Status</Label>
            <Controller
                name="status"
                control={control}
                render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="new">Novo / Lead Recebido</SelectItem>
                        <SelectItem value="initial_contact">Contato Inicial</SelectItem>
                        <SelectItem value="qualification">Qualificação</SelectItem>
                        <SelectItem value="proposal">Proposta</SelectItem>
                        <SelectItem value="negotiation">Negociação</SelectItem>
                        <SelectItem value="won">Ganho (Fechamento)</SelectItem>
                        <SelectItem value="lost">Perdido</SelectItem>
                        <SelectItem value="archived">Arquivado</SelectItem>
                    </SelectContent>
                </Select>
                )}
            />
            </div>
            <div className="space-y-2">
                <Label htmlFor="source">Fonte</Label>
                <Input id="source" {...register('source')} placeholder="Ex: Indicação, Website, Evento" />
            </div>
        </div>
      </div>

       {error && (
            <div className="bg-destructive/20 border-l-4 border-destructive text-destructive-foreground p-4 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-3" />
              <span className="text-sm">{error}</span>
            </div>
        )}
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading} className="bg-crm-primary text-black px-6 py-3 rounded-xl hover:bg-crm-primary/90 transition-all duration-200 border border-transparent hover:border-crm-primary/50 flex items-center justify-center font-semibold disabled:opacity-75 disabled:cursor-not-allowed">
          {isLoading ? <Loader2 className="mr-2 w-5 h-5 animate-spin" /> : null}
          {isLoading ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Salvar Cliente')}
        </Button>
      </div>
    </form>
  );
}
