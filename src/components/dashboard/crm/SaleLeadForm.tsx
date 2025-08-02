
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createSaleLead, listCustomers } from '@/ai/flows/crm-management';
import { SaleLeadSchema, CustomerProfile } from '@/ai/schemas';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2, AlertCircle, CalendarIcon, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type SaleLeadFormProps = {
  onSaleLeadCreated: () => void;
};

export function SaleLeadForm({ onSaleLeadCreated }: SaleLeadFormProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<z.infer<typeof SaleLeadSchema>>({
    resolver: zodResolver(SaleLeadSchema),
    defaultValues: {
      stage: 'prospect',
      priority: 'medium',
      expectedCloseDate: new Date(),
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const fetchCustomers = useCallback(async () => {
    if (!currentUser) return;
    try {
        const customerData = await listCustomers({ actor: currentUser.uid });
        setCustomers(customerData);
    } catch (err) {
        console.error("Failed to fetch customers for sale lead form", err);
        setError("Não foi possível carregar os clientes.");
    }
  }, [currentUser]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const onSubmit = async (data: z.infer<typeof SaleLeadSchema>) => {
    if (!currentUser) {
      setError('Você precisa estar autenticado para criar uma oportunidade.');
      return;
    }
    setIsLoading(true);
    setError(null);
    
    try {
      await createSaleLead({ ...data, actor: currentUser.uid });
      onSaleLeadCreated();
    } catch (err) {
      console.error(err);
      setError('Falha ao criar a oportunidade. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Título da Oportunidade*</Label>
                <Input id="title" {...register('title')} placeholder="Ex: Projeto de Redesign do Website" />
                {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
                <Label>Cliente*</Label>
                <Controller
                    name="customerId"
                    control={control}
                    render={({ field }) => (
                         <Popover open={isCustomerPopoverOpen} onOpenChange={setIsCustomerPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start font-normal">
                                    {field.value ? customers.find(c => c.id === field.value)?.name : 'Selecione um cliente'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0">
                                <div className="p-2 border-b">
                                     <Input 
                                        placeholder="Buscar cliente..." 
                                        value={customerSearch}
                                        onChange={(e) => setCustomerSearch(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                                <div className="max-h-[200px] overflow-y-auto">
                                    {filteredCustomers.length > 0 ? filteredCustomers.map(customer => (
                                        <div key={customer.id} onClick={() => { field.onChange(customer.id); setIsCustomerPopoverOpen(false); }}
                                            className="p-2 hover:bg-accent cursor-pointer text-sm">
                                            {customer.name}
                                        </div>
                                    )) : <div className="p-2 text-sm text-gray-500">Nenhum cliente encontrado.</div>}
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                />
                 {errors.customerId && <p className="text-red-500 text-sm">{errors.customerId.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="value">Valor (R$)*</Label>
                <Input id="value" type="number" step="0.01" {...register('value')} />
                {errors.value && <p className="text-red-500 text-sm">{errors.value.message}</p>}
            </div>
            
            <div className="space-y-2">
                <Label>Estágio*</Label>
                 <Controller name="stage" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="prospect">Prospect</SelectItem>
                            <SelectItem value="qualified">Qualificado</SelectItem>
                            <SelectItem value="proposal">Proposta</SelectItem>
                            <SelectItem value="negotiation">Negociação</SelectItem>
                            <SelectItem value="closed_won">Ganha</SelectItem>
                            <SelectItem value="closed_lost">Perdida</SelectItem>
                        </SelectContent>
                    </Select>
                )}/>
            </div>

            <div className="space-y-2">
                <Label>Prioridade*</Label>
                 <Controller name="priority" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="low">Baixa</SelectItem>
                            <SelectItem value="medium">Média</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                        </SelectContent>
                    </Select>
                )}/>
            </div>

            <div className="space-y-2 md:col-span-2">
                <Label>Data de Fechamento Esperada*</Label>
                 <Controller
                    name="expectedCloseDate"
                    control={control}
                    render={({ field }) => (
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : <span>Escolha uma data</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ?? undefined} onSelect={field.onChange} initialFocus /></PopoverContent>
                        </Popover>
                    )}
                />
            </div>
        </div>

       {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-3" />
              <span className="text-sm">{error}</span>
            </div>
        )}
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-neumorphism hover:shadow-neumorphism-hover flex items-center justify-center font-semibold disabled:opacity-75 disabled:cursor-not-allowed">
          {isLoading ? <Loader2 className="mr-2 w-5 h-5 animate-spin" /> : null}
          {isLoading ? 'Salvando...' : 'Salvar Oportunidade'}
        </Button>
      </div>
    </form>
  );
}
