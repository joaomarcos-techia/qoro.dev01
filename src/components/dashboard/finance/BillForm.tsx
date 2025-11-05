
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createBill, updateBill, listAccounts } from '@/ai/flows/finance-management';
import { listCustomers } from '@/ai/flows/crm-management';
import { listSuppliers } from '@/ai/flows/supplier-management';
import { BillSchema, CustomerProfile, SupplierProfile, BillProfile, AccountProfile } from '@/ai/schemas';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2, AlertCircle, CalendarIcon, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type BillFormProps = {
  onAction: () => void;
  bill?: BillProfile | null;
};

const FormSchema = BillSchema.extend({
    dueDate: z.date(),
});
type FormValues = z.infer<typeof FormSchema>;

export function BillForm({ onAction, bill }: BillFormProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierProfile[]>([]);
  const [accounts, setAccounts] = useState<AccountProfile[]>([]);
  const [entitySearch, setEntitySearch] = useState('');
  const [isEntityPopoverOpen, setIsEntityPopoverOpen] = useState(false);
  
  const isEditMode = !!bill;

  const {
    register, handleSubmit, control, reset, watch, setValue, formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      accountId: '', // Initialize to prevent uncontrolled -> controlled warning
      entityId: '',
      paymentMethod: 'pix',
      type: 'payable',
      status: 'pending',
    }
  });

  const billType = watch('type');
  const entityType = watch('entityType');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if (currentUser) {
        const fetchData = async () => {
            try {
                if (accounts.length === 0) {
                    const accs = await listAccounts({ actor: currentUser.uid });
                    setAccounts(accs);
                }
                if (billType === 'receivable') {
                    if (customers.length === 0) {
                        const custs = await listCustomers({ actor: currentUser.uid });
                        setCustomers(custs);
                    }
                } else {
                    if (suppliers.length === 0) {
                        const supps = await listSuppliers({ actor: currentUser.uid });
                        setSuppliers(supps);
                    }
                }
            } catch (err) {
                 console.error("Failed to load entities", err);
                 setError("Não foi possível carregar os dados necessários. Tente novamente.");
            }
        };
        fetchData();
    }
  }, [currentUser, billType, customers.length, suppliers.length, accounts.length]);

  useEffect(() => {
    if (bill) {
        reset({ ...bill, dueDate: parseISO(bill.dueDate as unknown as string), accountId: bill.accountId || '' });
    } else {
        reset({
            type: 'payable',
            status: 'pending',
            dueDate: new Date(),
            description: '',
            amount: 0,
            entityId: '',
            entityType: 'supplier',
            notes: '',
            accountId: accounts.length > 0 ? accounts[0].id : '',
            category: '',
            paymentMethod: 'pix',
        });
    }
  }, [bill, reset, accounts]);
  
  useEffect(() => {
      setValue('entityId', '');
      setValue('entityType', billType === 'payable' ? 'supplier' : 'customer');
  }, [billType, setValue]);

  const onSubmit = async (data: FormValues) => {
    if (!currentUser) return;
    setIsLoading(true);
    setError(null);
    try {
        const submissionData = { ...data, dueDate: data.dueDate.toISOString() };
        if (isEditMode) {
            await updateBill({ ...submissionData, id: bill.id, actor: currentUser.uid });
        } else {
            await createBill({ ...submissionData, actor: currentUser.uid });
        }
      onAction();
    } catch (err: any) {
      console.error(err);
      setError(err.message || `Falha ao ${isEditMode ? 'atualizar' : 'criar'} a conta.`);
    } finally {
      setIsLoading(false);
    }
  };

  const entities = entityType === 'supplier' ? suppliers : customers;
  const filteredEntities = entities.filter(e => e.name.toLowerCase().includes(entitySearch.toLowerCase()));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Descrição*</Label>
          <Input id="description" {...register('description')} placeholder="Ex: Aluguel do escritório, Venda do produto X" />
          {errors.description && <p className="text-destructive text-sm">{errors.description.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Tipo*</Label>
          <Controller name="type" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent><SelectItem value="payable">A pagar</SelectItem><SelectItem value="receivable">A receber</SelectItem></SelectContent>
            </Select>
          )}/>
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Valor (R$)*</Label>
          <Input id="amount" type="text" inputMode="decimal" {...register('amount')} placeholder="0,00" />
          {errors.amount && <p className="text-destructive text-sm">{errors.amount.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Associar a</Label>
            <Controller name="entityId" control={control} render={({ field }) => (
                <Popover open={isEntityPopoverOpen} onOpenChange={setIsEntityPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start font-normal">
                            {field.value ? entities.find(e => e.id === field.value)?.name : `Selecione ${entityType === 'supplier' ? 'fornecedor' : 'cliente'}`}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                        <div className="p-2 border-b"><Input placeholder="Buscar..." value={entitySearch} onChange={(e) => setEntitySearch(e.target.value)} /></div>
                        <div className="max-h-[200px] overflow-y-auto">
                            {filteredEntities.map(entity => (
                                <div key={entity.id} onClick={() => { field.onChange(entity.id); setIsEntityPopoverOpen(false); }} className="p-2 hover:bg-accent cursor-pointer text-sm">{entity.name}</div>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            )}/>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">Data de vencimento*</Label>
          <Controller name="dueDate" control={control} render={({ field }) => (
            <Popover>
                <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}</Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
            </Popover>
          )}/>
           {errors.dueDate && <p className="text-destructive text-sm">{errors.dueDate.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label>Status*</Label>
          <Controller name="status" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Paga</SelectItem>
                <SelectItem value="overdue">Vencida</SelectItem>
              </SelectContent>
            </Select>
          )}/>
        </div>

        <div className="space-y-2">
            <Label>Conta financeira (para pagamento)</Label>
             <Controller name="accountId" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''}>
                    <SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
                    <SelectContent>{accounts.map(account => (<SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>))}</SelectContent>
                </Select>
            )}/>
        </div>
         <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Input id="category" {...register('category')} placeholder="Ex: Vendas, Marketing, Software" />
        </div>
         <div className="space-y-2">
            <Label>Método de pagamento</Label>
            <Controller name="paymentMethod" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || 'pix'}><SelectTrigger><SelectValue/></SelectTrigger>
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


        <div className="space-y-2 md:col-span-2">
            <Label>Notas/Observações</Label>
            <Textarea {...register('notes')} placeholder="Ex: Ref. ao mês de Julho, NF 12345"/>
        </div>
      </div>
       {error && <div className="bg-destructive/20 text-destructive-foreground p-4 rounded-lg flex items-center mt-4"><AlertCircle className="w-5 h-5 mr-3" /><span className="text-sm">{error}</span></div>}
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading} className="bg-finance-primary text-black px-6 py-3 rounded-xl hover:bg-finance-primary/90 transition-all duration-300 flex items-center justify-center font-semibold disabled:opacity-75 disabled:cursor-not-allowed">
          {isLoading ? <Loader2 className="mr-2 w-5 h-5 animate-spin" /> : null}
          {isLoading ? 'Salvando...' : (isEditMode ? 'Salvar alterações' : 'Salvar conta')}
        </Button>
      </div>
    </form>
  );
}
