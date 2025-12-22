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
import { createUpgradeSession } from '@/ai/flows/upgrade-flow';
import { listCustomers } from '@/ai/flows/crm-management';
import { TransactionSchema, AccountProfile, CustomerProfile, TransactionProfile } from '@/ai/schemas';
import { onAuthStateChanged, User as FirebaseUser, getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { Loader2, AlertCircle, CalendarIcon, Search, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { usePlan } from '@/contexts/PlanContext';

const auth = getAuth(app);

type TransactionFormProps = {
  onAction: () => void;
  transaction?: TransactionProfile | null;
  transactionCount?: number;
};

const FormSchema = TransactionSchema.extend({
    date: z.union([z.date(), z.string(), z.null()]).optional(),
});
type FormValues = z.infer<typeof FormSchema>;

const FREE_PLAN_LIMIT = 10;

export function TransactionForm({ onAction, transaction, transactionCount = 0 }: TransactionFormProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AccountProfile[]>([]);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);
  const { planId, isLoading: isPlanLoading } = usePlan();
  
  const isEditMode = !!transaction?.id;
  const isLimitReached = !isEditMode && planId === 'free' && transactionCount >= FREE_PLAN_LIMIT;
  const isFreePlan = planId === 'free';


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleUpgrade = async () => {
    if (!currentUser) return;
    setIsUpgrading(true);
    try {
        const { sessionId } = await createUpgradeSession({ actor: currentUser.uid });
        window.location.href = sessionId;
    } catch (error: any) {
        setError(error.message || "Não foi possível iniciar o processo de upgrade.");
        setIsUpgrading(false);
    }
  }

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
        type: 'expense',
        paymentMethod: 'pix',
        date: new Date(),
        description: '',
        amount: 0,
        accountId: '',
        customerId: '',
        category: ''
    }
  });

  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Permite apenas números, uma vírgula ou um ponto
    const numericValue = value.replace(/[^0-9,.]/g, '').replace(',', '.');
    // Garante que haja apenas um ponto decimal
    const parts = numericValue.split('.');
    const formattedValue = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : numericValue;
    
    // Atualiza o valor no input diretamente para o usuário ver
    e.target.value = formattedValue;
    // Atualiza o valor no form hook como número
    setValue('amount', parseFloat(formattedValue) || 0, { shouldValidate: true });
  };
  
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

                if (!transaction && accountsData.length > 0) {
                    reset(prev => ({ ...prev, accountId: accountsData[0].id }));
                }

            } catch (err) {
                 console.error("Failed to load accounts or customers", err);
                 setError("Não foi possível carregar os dados necessários. Tente novamente.");
            }
        };
        fetchData();
    }
  }, [currentUser, transaction, reset]);

  useEffect(() => {
    if (transaction) {
        const dateValue = transaction.date;
        const date = dateValue 
            ? (dateValue instanceof Date ? dateValue : parseISO(dateValue as string))
            : new Date();
        reset({ ...transaction, date, accountId: transaction.accountId || '', customerId: transaction.customerId || '' });
    } else if (accounts.length > 0) {
        reset({
            type: 'expense',
            paymentMethod: 'pix',
            date: new Date(),
            description: '',
            amount: 0,
            accountId: accounts[0]?.id || '', 
            customerId: '',
            category: ''
        });
    }
  }, [transaction, reset, accounts]);


  const onSubmit = async (data: FormValues) => {
    if (!currentUser) {
      setError('Você precisa estar autenticado para executar esta ação.');
      return;
    }
     if (isLimitReached) {
        setError(`Limite de ${FREE_PLAN_LIMIT} transações atingido no plano gratuito. Faça upgrade para adicionar mais.`);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
        const submissionData = {
            ...data,
            date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
            status: 'paid' as const,
        };

        if (isEditMode) {
            await updateTransaction({ ...submissionData, id: transaction.id, actor: currentUser.uid });
        } else {
            await createTransaction({ ...submissionData, actor: currentUser.uid });
        }
      onAction();
    } catch (err: any) {
      console.error(err);
      setError(err.message || `Falha ao ${isEditMode ? 'atualizar' : 'criar'} a transação. Tente novamente.`);
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
          <Label htmlFor="account-select">Conta</Label>
          <Controller
              name="accountId"
              control={control}
              render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ''} disabled={isFreePlan}>
                  <SelectTrigger id="account-select"><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
                  <SelectContent>
                      {accounts.map(account => (
                          <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
              )}
          />
          {isFreePlan && <p className='text-xs text-muted-foreground'>Múltiplas contas é um recurso de planos pagos.</p>}
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
            <Input 
                id="amount" 
                type="text" 
                inputMode="decimal" 
                defaultValue={register('amount').value}
                onInput={handleNumericInput}
                placeholder="0,00" 
            />
            {errors.amount && <p className="text-destructive text-sm">{errors.amount.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="date">Data da transação</Label>
          <Controller name="date" control={control} render={({ field }) => (
            <Popover>
                <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? format(new Date(field.value), "PPP") : <span>Escolha uma data</span>}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={field.onChange} initialFocus /></PopoverContent>
            </Popover>
          )}/>
           {errors.date && <p className="text-destructive text-sm">{errors.date.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label>Cliente (opcional)</Label>
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
          <Label htmlFor="category">Categoria</Label>
          <Input id="category" {...register('category')} placeholder="Ex: Vendas, Marketing, Software" />
          {errors.category && <p className="text-destructive text-sm">{errors.category.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Método de pagamento</Label>
          <Controller name="paymentMethod" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value || 'pix'}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="credit_card">Cartão de crédito</SelectItem>
                    <SelectItem value="debit_card">Cartão de débito</SelectItem>
                    <SelectItem value="bank_transfer">Transferência</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="cash">Dinheiro</SelectItem>
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
        {isLimitReached && (
            <div className="bg-yellow-500/20 border-l-4 border-yellow-500 text-yellow-300 p-4 rounded-lg flex items-center justify-between">
                <div className="flex items-center">
                    <Info className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span className="text-sm">Você atingiu o limite de ${FREE_PLAN_LIMIT} transações do plano gratuito.</span>
                </div>
                 <Button variant="ghost" onClick={handleUpgrade} disabled={isUpgrading} className="text-yellow-300 hover:text-yellow-200 h-auto p-0 font-bold underline">
                    {isUpgrading && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
                    {isUpgrading ? 'Aguarde' : 'Faça upgrade'}
                </Button>
            </div>
        )}
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading || isLimitReached || isPlanLoading} className="bg-finance-primary text-black px-6 py-3 rounded-xl hover:bg-finance-primary/90 transition-all duration-300 border border-transparent hover:border-finance-primary/50 flex items-center justify-center font-semibold disabled:opacity-75 disabled:cursor-not-allowed">
          {isLoading || isPlanLoading ? <Loader2 className="mr-2 w-5 h-5 animate-spin" /> : null}
          {isLoading || isPlanLoading ? 'Salvando...' : (isEditMode ? 'Salvar alterações' : 'Salvar transação')}
        </Button>
      </div>
    </form>
  );
}
