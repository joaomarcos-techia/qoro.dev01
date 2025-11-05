
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { createQuote, listCustomers, listProducts, listServices, updateQuote, getOrganizationDetails } from '@/ai/flows/crm-management';
import { QuoteSchema, CustomerProfile, ProductProfile, QuoteProfile, UpdateQuoteSchema, OrganizationProfile, ServiceProfile } from '@/ai/schemas';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2, AlertCircle, CalendarIcon, PlusCircle, Trash2, Package, Wrench, Download, Eye, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DocumentPDF } from './QuotePDF';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type QuoteFormProps = {
  onQuoteAction: () => void;
  quote?: QuoteProfile | null;
};

type ItemType = 'product' | 'service';
type AnyItem = ProductProfile | ServiceProfile;

const FormSchema = QuoteSchema.extend({
  validUntil: z.date(),
});
type FormValues = z.infer<typeof FormSchema>;

export function QuoteForm({ onQuoteAction, quote }: QuoteFormProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [products, setProducts] = useState<ProductProfile[]>([]);
  const [services, setServices] = useState<ServiceProfile[]>([]);
  const [organization, setOrganization] = useState<OrganizationProfile | null>(null);
  
  const [customerSearch, setCustomerSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [activeItemTab, setActiveItemTab] = useState<ItemType>('product');
  
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);
  const [isItemPopoverOpen, setIsItemPopoverOpen] = useState(false);

  const pdfRef = useRef<HTMLDivElement>(null);
  const [quoteForPdf, setQuoteForPdf] = useState<{ quoteData: QuoteProfile; action: 'download' | 'view' } | null>(null);

  const isEditMode = !!quote;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      customerId: '',
      items: [],
      subtotal: 0,
      total: 0,
      discount: 0,
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const fetchDependencies = useCallback(async (user: FirebaseUser) => {
    try {
        const [customersData, productsData, servicesData, orgData] = await Promise.all([
            listCustomers({ actor: user.uid }),
            listProducts({ actor: user.uid }),
            listServices({ actor: user.uid }),
            getOrganizationDetails({actor: user.uid})
        ]);
        setCustomers(customersData);
        setProducts(productsData);
        setServices(servicesData);
        setOrganization(orgData);
    } catch (err) {
         console.error("Failed to load dependencies", err);
         setError("Não foi possível carregar os dados necessários. Tente novamente.");
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchDependencies(user);
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, [fetchDependencies]);

  useEffect(() => {
    if (quote) {
      const validUntilDate = quote.validUntil ? parseISO(quote.validUntil.toString()) : new Date();
      reset({ ...quote, validUntil: validUntilDate });
    } else {
      reset({
        customerId: '',
        items: [],
        subtotal: 0,
        total: 0,
        discount: 0,
        validUntil: new Date(),
        notes: '',
      });
    }
  }, [quote, reset]);

  const watchItems = watch("items");
  const watchDiscount = watch("discount");

  useEffect(() => {
    const subtotal = watchItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const discountPercentage = watchDiscount || 0;
    const discountAmount = subtotal * (discountPercentage / 100);
    const total = subtotal - discountAmount;
    
    setValue('subtotal', subtotal);
    setValue('total', total);
  }, [watchItems, watchDiscount, setValue]);
  
  const generatePdf = async (quoteData: QuoteProfile, action: 'download' | 'view') => {
    setQuoteForPdf({ quoteData, action });
  
    await new Promise(resolve => setTimeout(resolve, 100));
  
    const input = pdfRef.current;
    if (!input) {
      setError("Falha ao encontrar o template do PDF.");
      setQuoteForPdf(null);
      return;
    }
  
    try {
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      if (action === 'download') {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`proposta-${quoteData.number}.pdf`);
      } else {
        const newWindow = window.open();
        newWindow?.document.write(`<img src="${imgData}" style="width:100%;" />`);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError("Ocorreu um erro ao gerar o PDF.");
    } finally {
      setQuoteForPdf(null);
    }
  };
  
  const createFullQuoteProfile = (formValues: FormValues, newNumber?: string): QuoteProfile => {
    const customer = customers.find(c => c.id === formValues.customerId);
    return {
        ...formValues,
        id: quote?.id || 'new',
        number: newNumber || quote?.number || '',
        createdAt: quote?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customerName: customer?.name || 'Cliente não encontrado',
        validUntil: formValues.validUntil.toISOString(),
        organizationName: organization?.name,
    };
  };

  const addItemToQuote = (item: AnyItem) => {
    const pricingModel = 'pricingModel' in item ? item.pricingModel : 'fixed';
    append({
        type: pricingModel === 'per_hour' ? 'service' : 'product',
        itemId: item.id,
        name: item.name,
        quantity: 1,
        unitPrice: item.price,
        total: item.price,
        cost: 'cost' in item ? item.cost : undefined,
        pricingModel: pricingModel,
    });
    setIsItemPopoverOpen(false);
    setItemSearch('');
  }

  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof FormValues) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^0-9.,]/g, '').replace(',', '.');
    const parts = numericValue.split('.');
    const formattedValue = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : numericValue;

    setValue(fieldName as any, formattedValue, { shouldValidate: true });
  };


  const onSubmit = async (data: FormValues) => {
    if (!currentUser) {
      setError('Você precisa estar autenticado para criar um orçamento.');
      return;
    }
    setIsLoading(true);
    setError(null);
    
    try {
        let savedQuote: { id: string; number: string };
        const submissionData = { ...data, validUntil: data.validUntil.toISOString() };
        
        if (isEditMode && quote?.id) {
            const updateData: z.infer<typeof UpdateQuoteSchema> = { ...submissionData, id: quote.id };
            savedQuote = await updateQuote({ ...updateData, actor: currentUser.uid });
        } else {
            savedQuote = await createQuote({ ...submissionData, actor: currentUser.uid });
        }
        
        onQuoteAction();

        if (savedQuote.id && !isEditMode) {
            const profileForPdf = createFullQuoteProfile(data, savedQuote.number);
            profileForPdf.id = savedQuote.id;
            await generatePdf(profileForPdf, 'download');
        }

    } catch (err: any) {
      console.error(err);
      setError(err.message || `Falha ao ${isEditMode ? 'atualizar' : 'criar'} o orçamento. Tente novamente.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()));
  
  const getFilteredItems = () => {
    const list = activeItemTab === 'product' ? products : services;
    return list.filter(p => p.name.toLowerCase().includes(itemSearch.toLowerCase()));
  };

  return (
    <>
      <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
          {quoteForPdf && <DocumentPDF document={quoteForPdf.quoteData} ref={pdfRef}/>}
      </div>
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
                            <PopoverContent className="w-[300px] p-0 rounded-xl">
                                <div className="p-2 border-b">
                                     <Input 
                                        placeholder="Buscar cliente..." 
                                        value={customerSearch}
                                        onChange={(e) => setCustomerSearch(e.target.value)}
                                        className="w-full rounded-lg"
                                    />
                                </div>
                                <div className="max-h-[200px] overflow-y-auto">
                                    {filteredCustomers.map(customer => (
                                        <div key={customer.id} onClick={() => { field.onChange(customer.id); setIsCustomerPopoverOpen(false); }}
                                            className="p-2 hover:bg-accent cursor-pointer text-sm rounded-lg mx-1 my-1">
                                            {customer.name}
                                        </div>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                />
                 {errors.customerId && <p className="text-destructive text-sm">{errors.customerId.message}</p>}
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
                                {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
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
            <div className="p-4 border border-border rounded-xl bg-secondary/50 space-y-4">
                {fields.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5"><Input value={item.name} disabled className="bg-card" /></div>
                        <div className="col-span-2"><Input type="number" value={item.quantity} onChange={(e) => setValue(`items.${index}.quantity`, Number(e.target.value), { shouldValidate: true })} /></div>
                        <div className="col-span-2"><Input type="number" step="0.01" value={item.unitPrice} onChange={(e) => setValue(`items.${index}.unitPrice`, Number(e.target.value), { shouldValidate: true })} /></div>
                        <div className="col-span-2"><Input value={(item.quantity * item.unitPrice).toFixed(2)} disabled className="bg-card" /></div>
                        <div className="col-span-1"><Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="w-4 h-4 text-red-500"/></Button></div>
                    </div>
                ))}
                {errors.items && <p className="text-destructive text-sm">{errors.items.message}</p>}

                 <Popover open={isItemPopoverOpen} onOpenChange={setIsItemPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button type="button" variant="outline" className="w-full mt-2">
                            <PlusCircle className="mr-2 w-4 h-4"/> Adicionar Produto/Serviço
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0 rounded-xl">
                         <div className="p-2 border-b border-border">
                            <div className="flex border-b border-border mb-2">
                                <button type="button" onClick={() => setActiveItemTab('product')} className={`px-4 py-2 text-sm font-medium flex items-center ${activeItemTab === 'product' ? 'border-b-2 border-crm-primary text-crm-primary' : 'text-muted-foreground'}`}>
                                    <Package className="w-4 h-4 mr-2"/> Produtos
                                </button>
                                <button type="button" onClick={() => setActiveItemTab('service')} className={`px-4 py-2 text-sm font-medium flex items-center ${activeItemTab === 'service' ? 'border-b-2 border-crm-primary text-crm-primary' : 'text-muted-foreground'}`}>
                                    <Wrench className="w-4 h-4 mr-2"/> Serviços
                                </button>
                            </div>
                            <Input placeholder={`Buscar ${activeItemTab === 'product' ? 'produto' : 'serviço'}...`} value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} className="rounded-lg"/>
                        </div>
                        <div className="max-h-[200px] overflow-y-auto">
                            {getFilteredItems().map(item => (
                                <div key={item.id} onClick={() => addItemToQuote(item)} className="p-2 hover:bg-accent cursor-pointer text-sm rounded-lg mx-1 my-1">
                                    {item.name}
                                </div>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>

        {/* Totals Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea {...register('notes')} placeholder="Termos de pagamento, observações, etc." />
            </div>
            <div className="space-y-4">
                <div className="flex justify-between items-center"><Label>Subtotal</Label><span>{watch('subtotal').toFixed(2)}</span></div>
                <div className="flex justify-between items-center">
                    <Label>Desconto (%)</Label>
                    <div className="relative w-28">
                        <Input 
                            type="text" 
                            inputMode="decimal"
                            className="pr-7" 
                            {...register('discount', {setValueAs: v => v ? parseFloat(v) : 0})}
                            onChange={(e) => handleNumericInput(e, 'discount')}
                        />
                         <Percent className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                    </div>
                </div>
                <div className="flex justify-between items-center text-lg font-bold"><Label>Total</Label><span>R$ {watch('total').toFixed(2)}</span></div>
            </div>
        </div>

       {error && (
            <div className="bg-destructive/20 border-l-4 border-destructive text-destructive-foreground p-4 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-3" />
              <span className="text-sm">{error}</span>
            </div>
        )}
      <div className="flex justify-between items-center pt-4">
        <div>
            {(isEditMode) && (
                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => generatePdf(createFullQuoteProfile(getValues()), 'view')}>
                        <Eye className="mr-2 w-4 h-4"/> Visualizar PDF
                    </Button>
                     <Button type="button" variant="outline" onClick={() => generatePdf(createFullQuoteProfile(getValues()), 'download')}>
                        <Download className="mr-2 w-4 h-4"/> Baixar PDF
                    </Button>
                </div>
            )}
        </div>
        <Button type="submit" disabled={isLoading} className="bg-crm-primary text-black px-6 py-3 rounded-xl hover:bg-crm-primary/90 transition-all duration-300 flex items-center justify-center font-semibold disabled:opacity-75 disabled:cursor-not-allowed">
          {isLoading ? <Loader2 className="mr-2 w-5 h-5 animate-spin" /> : null}
          {isEditMode ? 'Salvar Alterações' : 'Salvar e Gerar PDF'}
        </Button>
      </div>
    </form>
    </>
  );
}
