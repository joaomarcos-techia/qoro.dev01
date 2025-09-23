
'use client';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { listCustomers, listQuotes, getOrganizationDetails } from '@/ai/flows/crm-management';
import { CustomerProfile, QuoteProfile, OrganizationProfile } from '@/ai/schemas';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, Trophy, Users, Target, Loader2, ServerCrash, Calendar as CalendarIcon, Download } from 'lucide-react';
import { format, parseISO, differenceInDays, isValid, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CrmReportPDF, CrmReportMetrics } from '@/components/dashboard/crm/CrmReportPDF';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


const MetricCard = ({ title, value, icon: Icon, isLoading, formatValue }: { title: string, value: string | number, icon: React.ElementType, isLoading: boolean, formatValue?: (value: number) => string }) => (
  <div className="bg-card p-6 rounded-2xl border border-border flex items-center">
    <div className="p-3 rounded-xl bg-crm-primary text-black mr-4 shadow-lg shadow-crm-primary/30">
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-muted-foreground text-sm font-medium">{title}</p>
      {isLoading ? (
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin mt-1" />
      ) : (
        <p className="text-3xl font-bold text-foreground">{typeof value === 'number' && formatValue ? formatValue(value) : value}</p>
      )}
    </div>
  </div>
);

export default function RelatoriosPage() {
  const [metrics, setMetrics] = useState<CrmReportMetrics | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<OrganizationProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pdfRef = useRef<HTMLDivElement>(null);

  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const calculateMetrics = useCallback((customers: CustomerProfile[], quotes: QuoteProfile[], range: DateRange): CrmReportMetrics => {
    const startDate = range.from || new Date(0);
    const endDate = range.to || new Date();

    const filteredCustomers = customers.filter(c => {
        const customerDate = parseISO(c.createdAt as string);
        return isValid(customerDate) && customerDate >= startDate && customerDate <= endDate;
    });
    
    const acceptedQuotes = quotes.filter(q => {
        const quoteDate = parseISO(q.updatedAt as string);
        return q.status === 'accepted' && isValid(quoteDate) && quoteDate >= startDate && quoteDate <= endDate;
    });

    const wonCustomers = customers.filter(c => c.status === 'won' && isValid(parseISO(c.createdAt as string)) && parseISO(c.createdAt as string) >= startDate && parseISO(c.createdAt as string) <= endDate);
    const lostCustomers = customers.filter(c => c.status === 'lost' && isValid(parseISO(c.createdAt as string)) && parseISO(c.createdAt as string) >= startDate && parseISO(c.createdAt as string) <= endDate);

    const totalRevenue = acceptedQuotes.reduce((acc, q) => acc + q.total, 0);
    const totalWonDeals = acceptedQuotes.length;
    const avgRevenuePerDeal = totalWonDeals > 0 ? totalRevenue / totalWonDeals : 0;

    const salesCycleDurations = wonCustomers
        .map(c => {
            const createdAt = parseISO(c.createdAt as string);
            const quote = quotes.find(q => q.customerId === c.id && q.status === 'accepted');
            if (quote) {
                const wonAt = parseISO(quote.updatedAt as string);
                return differenceInDays(wonAt, createdAt);
            }
            return null;
        })
        .filter((days): days is number => days !== null && days >= 0);

    const avgSalesCycleDays = salesCycleDurations.length > 0
        ? Math.round(salesCycleDurations.reduce((a, b) => a + b, 0) / salesCycleDurations.length)
        : 0;
    
    const leadsBySourceData = filteredCustomers.reduce((acc, customer) => {
        const source = customer.source || 'Desconhecida';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    const leadsBySource = Object.entries(leadsBySourceData).map(([name, value], i) => ({
        name,
        value,
        fill: `hsl(var(--chart-${(i % 5) + 1}))`
    }));

    const winLossRatio = [
        { name: 'Ganhos', value: wonCustomers.length, fill: 'hsl(var(--chart-2))' },
        { name: 'Perdidos', value: lostCustomers.length, fill: 'hsl(var(--chart-1))' },
    ];

    const revenueByMonthData = acceptedQuotes.reduce((acc, quote) => {
      const updatedAt = parseISO(quote.updatedAt as string);
      if(isValid(updatedAt)){
          const month = format(updatedAt, 'MMM/yy', { locale: ptBR });
          acc[month] = (acc[month] || 0) + quote.total;
      }
      return acc;
    }, {} as Record<string, number>);

    const revenueByMonth = Object.entries(revenueByMonthData).map(([month, revenue]) => ({ month, revenue })).reverse();


    return {
        totalRevenue,
        totalWonDeals,
        avgRevenuePerDeal,
        avgSalesCycleDays,
        leadsBySource,
        winLossRatio,
        revenueByMonth,
    };
  }, []);


  useEffect(() => {
    if (!currentUser) return;

    const fetchAndSetData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [customersData, quotesData, orgData] = await Promise.all([
                listCustomers({ actor: currentUser.uid }),
                listQuotes({ actor: currentUser.uid }),
                getOrganizationDetails({ actor: currentUser.uid })
            ]);
            setOrganization(orgData);
            if (date) {
                const calculatedMetrics = calculateMetrics(customersData, quotesData, date);
                setMetrics(calculatedMetrics);
            }
        } catch (err) {
            console.error("Erro ao buscar dados para relatórios:", err);
            setError('Não foi possível carregar os dados dos relatórios.');
        } finally {
            setIsLoading(false);
        }
    }
    
    fetchAndSetData();
  }, [currentUser, calculateMetrics, date]);

  const generatePdf = async () => {
    setIsGeneratingPdf(true);
    // Ensure the PDF component is rendered with the latest data
    await new Promise(resolve => setTimeout(resolve, 100));

    const input = pdfRef.current;
    if (!input) {
      setError("Erro: Não foi possível encontrar o template do PDF.");
      setIsGeneratingPdf(false);
      return;
    }

    try {
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true, 
        backgroundColor: '#111827'
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const formattedDate = date?.from ? format(date.from, 'MMMM-yyyy', { locale: ptBR }) : 'periodo';
      pdf.save(`relatorio-crm-${formattedDate}.pdf`);

    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      setError("Ocorreu um erro ao gerar o PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  
  const renderContent = () => {
    if (isLoading) {
        return (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
            <Loader2 className="w-12 h-12 text-crm-primary animate-spin" />
            <p className="mt-4 text-muted-foreground">Analisando dados...</p>
          </div>
        );
    }  
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-destructive/10 rounded-lg p-8 text-center border border-destructive">
          <ServerCrash className="w-16 h-16 text-destructive mb-4" />
          <h3 className="text-xl font-bold text-destructive">Ocorreu um erro</h3>
          <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      );
    }
    
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Receita (Período)" value={metrics?.totalRevenue ?? 0} icon={DollarSign} isLoading={isLoading} formatValue={formatCurrency} />
                <MetricCard title="Negócios Ganhos" value={metrics?.totalWonDeals ?? 0} icon={Trophy} isLoading={isLoading} />
                <MetricCard title="Ticket Médio" value={metrics?.avgRevenuePerDeal ?? 0} icon={Target} isLoading={isLoading} formatValue={formatCurrency}/>
                <MetricCard title="Ciclo Médio de Venda" value={`${metrics?.avgSalesCycleDays ?? 0} dias`} icon={Users} isLoading={isLoading} />
            </div>
            <div className="bg-card p-8 rounded-2xl border-border text-center">
                 <h3 className="text-xl font-bold text-foreground">Relatório em PDF Pronto</h3>
                 <p className="text-muted-foreground mt-2 mb-6 max-w-2xl mx-auto">
                    Seu relatório detalhado com gráficos e as métricas acima está pronto. Clique no botão abaixo para fazer o download e compartilhar com sua equipe.
                 </p>
                <Button onClick={generatePdf} disabled={isGeneratingPdf || !metrics} className="bg-crm-primary text-black px-6 py-3">
                    {isGeneratingPdf ? <Loader2 className="mr-2 w-5 h-5 animate-spin" /> : <Download className="mr-2 w-5 h-5" />}
                    {isGeneratingPdf ? 'Gerando PDF...' : 'Baixar Relatório em PDF'}
                </Button>
            </div>
        </div>
    );
  };

  return (
    <>
       <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1 }}>
        {metrics && organization && date?.from && (
          <CrmReportPDF
            ref={pdfRef}
            metrics={metrics}
            organization={organization}
            period={{ from: date.from, to: date.to ?? date.from }}
          />
        )}
      </div>
      <div>
          <div className="flex justify-between items-center mb-8">
              <div>
                  <h1 className="text-3xl font-bold text-foreground">Relatórios do CRM</h1>
                  <p className="text-muted-foreground">
                  Analise o desempenho de suas vendas e clientes.
                  </p>
              </div>
              <Popover>
                  <PopoverTrigger asChild>
                      <Button id="date" variant={"outline"} className={cn("w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date?.from ? (date.to ? `${format(date.from, "PPP", { locale: ptBR })} - ${format(date.to, "PPP", { locale: ptBR })}` : format(date.from, "PPP", { locale: ptBR })) : <span>Escolha um período</span>}
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                      <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} locale={ptBR} />
                  </PopoverContent>
              </Popover>
          </div>
          {renderContent()}
      </div>
    </>
  );
}
