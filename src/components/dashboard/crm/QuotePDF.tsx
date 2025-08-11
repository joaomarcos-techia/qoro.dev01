
'use client';
import { QuoteProfile, InvoiceProfile } from '@/ai/schemas';
import React from 'react';

type DocumentProfile = QuoteProfile | InvoiceProfile;

interface DocumentPDFProps {
    document: DocumentProfile;
}

const isInvoice = (doc: DocumentProfile): doc is InvoiceProfile => 'paymentStatus' in doc;

export const DocumentPDF = React.forwardRef<HTMLDivElement, DocumentPDFProps>(({ document }, ref) => {
    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    const formatDate = (date: string | Date) => {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat('pt-BR').format(dateObj);
    }
    
    const docIsInvoice = isInvoice(document);
    const title = docIsInvoice ? 'Fatura' : 'Orçamento';
    const validUntilDate = !docIsInvoice ? document.validUntil : null;
    const dueDate = docIsInvoice ? document.dueDate : null;
    const organizationName = 'organizationName' in document ? document.organizationName : 'Sua Empresa';


    return (
        <div ref={ref} className="bg-white p-0" style={{ width: '210mm', minHeight: '297mm'}}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
                .pdf-container { font-family: 'Inter', sans-serif; font-size: 11px; line-height: 1.6; color: #374151; background-color: #fff; padding: 15mm; }
                .pdf-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f3f4f6; padding-bottom: 1rem; margin-bottom: 1.5rem; }
                .pdf-header .logo h1 { font-size: 1.8rem; font-weight: 700; color: #111827; margin: 0; }
                .pdf-header .quote-details { text-align: right; }
                .pdf-header .quote-details h2 { font-size: 1.5rem; color: #8B5CF6; margin: 0 0 0.25rem 0; font-weight: 600; }
                .pdf-header .quote-details p { margin: 0; color: #4b5563; }
                .customer-info { margin-bottom: 1.5rem; padding: 1rem; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; }
                .customer-info h3 { font-size: 1rem; font-weight: 600; margin: 0 0 0.5rem 0; color: #111827; }
                .customer-info p { margin: 0; color: #374151; }
                .items-table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
                .items-table th, .items-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
                .items-table th { background-color: #f3f4f6; color: #374151; font-weight: 600; text-transform: uppercase; font-size: 0.7rem; }
                .items-table .item-name { font-weight: 600; color: #1f2937; }
                .items-table .align-right { text-align: right; }
                .items-table .align-center { text-align: center; }
                .totals-section { display: flex; justify-content: flex-end; }
                .totals-table { width: 40%; }
                .totals-table td { padding: 0.6rem 1rem; }
                .totals-table .label { text-align: right; font-weight: 600; color: #4b5563; }
                .totals-table .value { text-align: right; }
                .totals-table .grand-total { font-size: 1.1rem; font-weight: 700; border-top: 2px solid #e5e7eb; }
                .grand-total .label, .grand-total .value { color: #111827; }
                .notes-section { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; }
                .notes-section h4 { font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem; }
                .notes-section p { white-space: pre-wrap; font-size: 0.8rem; color: #4b5563; }
                .pdf-footer { position: absolute; bottom: 15mm; left: 15mm; right: 15mm; text-align: center; font-size: 0.75rem; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 0.5rem; }
            `}</style>
            <div className="pdf-container">
                <header className="pdf-header">
                    <div className="logo">
                        <h1>{organizationName}</h1>
                    </div>
                    <div className="quote-details">
                        <h2>{title}</h2>
                        <p><strong>Número:</strong> {document.number}</p>
                        <p><strong>Data:</strong> {formatDate(document.createdAt)}</p>
                        {validUntilDate && <p><strong>Válido até:</strong> {formatDate(validUntilDate)}</p>}
                        {dueDate && <p><strong>Vencimento:</strong> {formatDate(dueDate)}</p>}
                    </div>
                </header>
                <section className="customer-info">
                    <h3>Para:</h3>
                    <p><strong>{document.customerName}</strong></p>
                </section>
                <section>
                    <table className="items-table">
                        <thead>
                            <tr>
                                <th className="item-name">Descrição do Item</th>
                                <th className="align-center">Qtd.</th>
                                <th className="align-right">Preço Unit.</th>
                                <th className="align-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {document.items.map((item, index) => (
                                <tr key={index}>
                                    <td className="item-name">{item.name}</td>
                                    <td className="align-center">{item.quantity}</td>
                                    <td className="align-right">{formatCurrency(item.unitPrice)}</td>
                                    <td className="align-right">{formatCurrency(item.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
                <section className="totals-section">
                     <table className="totals-table">
                        <tbody>
                            <tr>
                                <td className="label">Subtotal:</td>
                                <td className="value">{formatCurrency(document.subtotal)}</td>
                            </tr>
                             <tr>
                                <td className="label">Desconto:</td>
                                <td className="value">{formatCurrency(document.discount || 0)}</td>
                            </tr>
                            <tr className="grand-total">
                                <td className="label">TOTAL:</td>
                                <td className="value">{formatCurrency(document.total)}</td>
                            </tr>
                        </tbody>
                    </table>
                </section>
                {document.notes && (
                    <section className="notes-section">
                        <h4>Observações e Termos:</h4>
                        <p>{document.notes}</p>
                    </section>
                )}
                <footer className="pdf-footer">
                    Obrigado pela preferência!
                </footer>
            </div>
        </div>
    );
});

DocumentPDF.displayName = 'DocumentPDF';

```
</content>
  </change>
  <change>
    <file>/src/components/dashboard/crm/QuoteForm.tsx</file>
    <content><![CDATA[
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
import { createQuote, listCustomers, listProducts, updateQuote, getOrganizationDetails } from '@/ai/flows/crm-management';
import { QuoteSchema, CustomerProfile, ProductProfile, QuoteProfile, UpdateQuoteSchema, OrganizationProfile } from '@/ai/schemas';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2, AlertCircle, CalendarIcon, PlusCircle, Trash2, Package, Wrench, Download, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DocumentPDF } from './QuotePDF';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type QuoteFormProps = {
  onQuoteAction: () => void;
  quote?: QuoteProfile | null;
};

type ItemType = 'product' | 'service';

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
  const [services, setServices] = useState<ProductProfile[]>([]);
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
      items: [],
      subtotal: 0,
      total: 0,
      discount: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const fetchDependencies = useCallback(async (user: FirebaseUser) => {
    try {
        const [customersData, allItems, orgData] = await Promise.all([
            listCustomers({ actor: user.uid }),
            listProducts({ actor: user.uid }),
            getOrganizationDetails({actor: user.uid})
        ]);
        setCustomers(customersData);
        setProducts(allItems.filter(item => item.pricingModel !== 'per_hour'));
        setServices(allItems.filter(item => item.pricingModel === 'per_hour'));
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
    const discount = watchDiscount || 0;
    const total = subtotal - discount;
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
        status: quote?.status || 'draft',
    };
  };

  const addItemToQuote = (item: ProductProfile) => {
    append({
        type: item.pricingModel === 'per_hour' ? 'service' : 'product',
        itemId: item.id,
        name: item.name,
        quantity: 1,
        unitPrice: item.price,
        total: item.price,
        pricingModel: item.pricingModel,
    });
    setIsItemPopoverOpen(false);
    setItemSearch('');
  }

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

        if (savedQuote.id) {
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
            <div className="p-4 border rounded-xl bg-gray-50/50 space-y-4">
                {fields.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5"><Input value={item.name} disabled className="bg-white" /></div>
                        <div className="col-span-2"><Input type="number" value={item.quantity} onChange={(e) => setValue(`items.${index}.quantity`, Number(e.target.value), { shouldValidate: true })} /></div>
                        <div className="col-span-2"><Input type="number" step="0.01" value={item.unitPrice} onChange={(e) => setValue(`items.${index}.unitPrice`, Number(e.target.value), { shouldValidate: true })} /></div>
                        <div className="col-span-2"><Input value={(item.quantity * item.unitPrice).toFixed(2)} disabled className="bg-white" /></div>
                        <div className="col-span-1"><Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="w-4 h-4 text-red-500"/></Button></div>
                    </div>
                ))}
                {errors.items && <p className="text-red-500 text-sm">{errors.items.message}</p>}

                 <Popover open={isItemPopoverOpen} onOpenChange={setIsItemPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button type="button" variant="outline" className="w-full mt-2">
                            <PlusCircle className="mr-2 w-4 h-4"/> Adicionar Produto/Serviço
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                         <div className="p-2 border-b">
                            <div className="flex border-b mb-2">
                                <button type="button" onClick={() => setActiveItemTab('product')} className={`px-4 py-2 text-sm font-medium flex items-center ${activeItemTab === 'product' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>
                                    <Package className="w-4 h-4 mr-2"/> Produtos
                                </button>
                                <button type="button" onClick={() => setActiveItemTab('service')} className={`px-4 py-2 text-sm font-medium flex items-center ${activeItemTab === 'service' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>
                                    <Wrench className="w-4 h-4 mr-2"/> Serviços
                                </button>
                            </div>
                            <Input placeholder={`Buscar ${activeItemTab === 'product' ? 'produto' : 'serviço'}...`} value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} />
                        </div>
                        <div className="max-h-[200px] overflow-y-auto">
                            {getFilteredItems().map(item => (
                                <div key={item.id} onClick={() => addItemToQuote(item)} className="p-2 hover:bg-accent cursor-pointer text-sm">
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
                <div className="flex justify-between items-center"><Label>Desconto (R$)</Label><Input type="number" step="0.01" className="w-24 h-8" {...register('discount', {valueAsNumber: true})}/></div>
                <div className="flex justify-between items-center text-lg font-bold"><Label>Total</Label><span>R$ {watch('total').toFixed(2)}</span></div>
            </div>
        </div>

       {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg flex items-center">
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
        <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-neumorphism hover:shadow-neumorphism-hover flex items-center justify-center font-semibold disabled:opacity-75 disabled:cursor-not-allowed">
          {isLoading ? <Loader2 className="mr-2 w-5 h-5 animate-spin" /> : null}
          {isLoading ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Salvar Orçamento')}
        </Button>
      </div>
    </form>
    </>
  );
}

