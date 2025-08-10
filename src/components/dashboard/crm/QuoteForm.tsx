'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createQuote, listCustomers, listProducts } from '@/ai/flows/crm-management';
import { QuoteSchema, CustomerProfile, ProductProfile, QuoteItemSchema } from '@/ai/schemas';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2, AlertCircle, CalendarIcon, PlusCircle, Trash2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type QuoteFormProps = {
  onQuoteCreated: () => void;
};

export function QuoteForm({ onQuoteCreated }: QuoteFormProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [products, setProducts] = useState<ProductProfile[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);
  const [isProductPopoverOpen, setIsProductPopoverOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof QuoteSchema>>({
    resolver: zodResolver(QuoteSchema),
    defaultValues: {
      status: 'draft',
      items: [],
      discount: 0,
      tax: 0,
      validUntil: new Date(),
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const fetchData = useCallback(async () => {
    if (!currentUser) return;
    try {
        const [customerData, productData] = await Promise.all([
            listCustomers({ actor: currentUser.uid }),
            listProducts({ actor: currentUser.uid })
        ]);
        setCustomers(customerData);
        setProducts(productData);
    } catch (err) {
        console.error("Failed to fetch data for quote form", err);
        setError("Não foi possível carregar clientes e produtos.");
    }
  }, [currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const subtotal = watchItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const discount = watch('discount') || 0;
    const tax = watch('tax') || 0;
    const total = subtotal - discount + tax;
    setValue('subtotal', subtotal);
    setValue('total', total);
  }, [watchItems, watch, setValue]);

  const addProductItem = (product: ProductProfile) => {
    append({
        type: product.category?.toLowerCase().includes('serviço') ? 'service' : 'product',
        itemId: product.id,
        name: product.name,
        quantity: 1,
        unitPrice: product.price,
        total: product.price,
        pricingModel: product.pricingModel,
    });
    setIsProductPopoverOpen(false);
  }

  const onSubmit = async (data: z.infer<typeof QuoteSchema>) => {
    if (!currentUser) {
      setError('Você precisa estar autenticado para criar um orçamento.');
      return;
    }
    setIsLoading(true);
    setError(null);

    // Ensure the number is unique or follows a sequence (simplified here)
    const quoteNumber = `QT-${Date.now().toString().slice(-6)}`;
    
    try {
      await createQuote({ ...data, number: quoteNumber, actor: currentUser.uid });
      onQuoteCreated();
    } catch (err) {
      console.error(err);
      setError('Falha ao criar o orçamento. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()));
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
        {/* Customer and Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                    {filteredCustomers.map(customer => (
                                        <div key={customer.id} onClick={() => { field.onChange(customer.id); setIsCustomerPopoverOpen(false); }}
                                            className="p-2 hover:bg-accent cursor-pointer text-sm">
                                            {customer.name}
                                        </div>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                />
                 {errors.customerId && <p className="text-red-500 text-sm">{errors.customerId.message}</p>}
            </div>
            <div className="space-y-2">
                <Label>Válido até*</Label>
                 <Controller
                    name="validUntil"
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

        {/* Items Section */}
        <div className="space-y-4">
            <Label>Itens do Orçamento*</Label>
            <div className="p-4 border rounded-xl bg-gray-50/50 space-y-4">
                {fields.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5"><Input value={item.name} disabled /></div>
                        <div className="col-span-2"><Input type="number" value={item.quantity} onChange={(e) => update(index, {...item, quantity: Number(e.target.value), total: Number(e.target.value) * item.unitPrice })} /></div>
                        <div className="col-span-2"><Input type="number" step="0.01" value={item.unitPrice} onChange={(e) => update(index, {...item, unitPrice: Number(e.target.value), total: item.quantity * Number(e.target.value)})} /></div>
                        <div className="col-span-2"><Input value={(item.total).toFixed(2)} disabled /></div>
                        <div className="col-span-1"><Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="w-4 h-4 text-red-500"/></Button></div>
                    </div>
                ))}
                {errors.items && <p className="text-red-500 text-sm">{errors.items.message}</p>}

                 <Popover open={isProductPopoverOpen} onOpenChange={setIsProductPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button type="button" variant="outline" className="w-full mt-2">
                            <PlusCircle className="mr-2 w-4 h-4"/> Adicionar Produto/Serviço
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                         <div className="p-2 border-b">
                            <Input placeholder="Buscar produto..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
                        </div>
                        <div className="max-h-[200px] overflow-y-auto">
                            {filteredProducts.map(product => (
                                <div key={product.id} onClick={() => addProductItem(product)} className="p-2 hover:bg-accent cursor-pointer text-sm">
                                    {product.name}
                                </div>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>

        {/* Totals Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="md:col-span-2 space-y-2">
                <Label>Notas</Label>
                <Textarea {...register('notes')} placeholder="Termos de pagamento, observações, etc." />
            </div>
            <div className="space-y-4">
                <div className="flex justify-between items-center"><Label>Subtotal</Label><span>{watch('subtotal').toFixed(2)}</span></div>
                <div className="flex justify-between items-center"><Label>Desconto (R$)</Label><Input type="number" step="0.01" className="w-24 h-8" {...register('discount', {valueAsNumber: true})}/></div>
                <div className="flex justify-between items-center"><Label>Impostos (R$)</Label><Input type="number" step="0.01" className="w-24 h-8" {...register('tax', {valueAsNumber: true})}/></div>
                <div className="flex justify-between items-center text-lg font-bold"><Label>Total</Label><span>R$ {watch('total').toFixed(2)}</span></div>
            </div>
             <div className="space-y-2">
                <Label>Status</Label>
                <Controller name="status" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="draft">Rascunho</SelectItem>
                            <SelectItem value="sent">Enviado</SelectItem>
                            <SelectItem value="accepted">Aceito</SelectItem>
                             <SelectItem value="rejected">Rejeitado</SelectItem>
                            <SelectItem value="expired">Expirado</SelectItem>
                        </SelectContent>
                    </Select>
                )}/>
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
          {isLoading ? 'Salvando...' : 'Salvar Orçamento'}
        </Button>
      </div>
    </form>
  );
}
