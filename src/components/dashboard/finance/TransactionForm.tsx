
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createTransaction, listAccounts, updateTransaction } from '@/ai/flows/finance-management';
import { listCustomers } from '@/ai/flows/crm-management';
import { TransactionSchema, AccountProfile, CustomerProfile, TransactionProfile } from '@/ai/schemas';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2, AlertCircle, CalendarIcon, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

type TransactionFormProps = {
  onAction: () => void;
  transaction?: TransactionProfile | null;
};

const FormSchema = TransactionSchema.extend({
    date: z.date(),
});
type FormValues = z.infer<typeof FormSchema>;

export function TransactionForm({ onAction, transaction }: TransactionFormProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AccountProfile[]>([]);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);
  
  const isEditMode = !!transaction;

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
  });

  useEffect(() => {
    if (currentUser) {
        const fetchData = async () => {
            try {
                const [accountsData, customersData] = await Promise.all([
                    listAccounts({ actor: currentUser.uid }),
                    listCustomers({ actor: currentUser.uid })
                ]);
                setAccounts(accountsData);
                setCustomers(customersData);
            } catch (err) {
                 console.error("Failed to load accounts or customers", err);
                 setError("Não foi possível carregar os dados necessários. Tente novamente.");
            }
        };
        fetchData();
    }
  }, [currentUser]);

  useEffect(() => {
    if (transaction) {
        const date = transaction.date ? parseISO(transaction.date) : new Date();
        reset({ ...transaction, date, customerId: transaction.customerId || '' });
    } else {
        reset({
            type: 'expense',
            status: 'paid',
            paymentMethod: 'pix',
            date: new Date(),
            description: '',
            amount: 0,
            accountId: '',
            customerId: '',
            category: ''
        });
    }
  }, [transaction, reset]);


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
            date: data.date.toISOString(),
        };

        if (isEditMode) {
            await updateTransaction({ ...submissionData, id: transaction.id, actor: currentUser.uid });
        } else {
            await createTransaction({ ...submissionData, actor: currentUser.uid });
        }
      onAction();
    } catch (err) {
      console.error(err);
      setError(`Falha ao ${isEditMode ? 'atualizar' : 'criar'} a transação. Tente novamente.`);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Descrição*</Label>
          <Input id="description" {...register('description')} placeholder="Ex: Pagamento de fornecedor, Venda de produto" />
          {errors.description && <p className="text-destructive text-sm">{errors.description.message}</p>}
        </div>

        <div className="space-y-2">
            <Label>Conta*</Label>
             <Controller
                name="accountId"
                control={control}
                render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione a conta" />
                    </SelectTrigger>
                    <SelectContent>
                        {accounts.map(account => (
                            <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                )}
            />
             {errors.accountId && <p className="text-destructive text-sm">{errors.accountId.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Tipo*</Label>
          <Controller name="type" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
            </Select>
          )}/>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="amount">Valor (R$)*</Label>
          <Input id="amount" type="text" {...register('amount')} placeholder="0,00" />
          {errors.amount && <p className="text-destructive text-sm">{errors.amount.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="date">Data da Transação*</Label>
          <Controller name="date" control={control} render={({ field }) => (
            <Popover>
                <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? format(field.value, "PPP") : <span>Escolha uma data</span>}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
            </Popover>
          )}/>
           {errors.date && <p className="text-destructive text-sm">{errors.date.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label>Cliente (Opcional)</Label>
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoria*</Label>
          <Input id="category" {...register('category')} placeholder="Ex: Vendas, Marketing, Software" />
          {errors.category && <p className="text-destructive text-sm">{errors.category.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Método de Pagamento*</Label>
          <Controller name="paymentMethod" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                    <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                    <SelectItem value="bank_transfer">Transferência</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                </SelectContent>
            </Select>
          )}/>
        </div>

         <div className="space-y-2">
          <Label>Status*</Label>
          <Controller name="status" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
            </Select>
          )}/>
        </div>

      </div>
       {error && (
            <div className="bg-destructive/20 text-destructive-foreground p-4 rounded-lg flex items-center mt-4">
              <AlertCircle className="w-5 h-5 mr-3" />
              <span className="text-sm">{error}</span>
            </div>
        )}
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-all duration-300 border border-transparent hover:border-primary/50 flex items-center justify-center font-semibold disabled:opacity-75 disabled:cursor-not-allowed">
          {isLoading ? <Loader2 className="mr-2 w-5 h-5 animate-spin" /> : null}
          {isLoading ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Salvar Transação')}
        </Button>
      </div>
    </form>
  );
}
