
'use client';
import { useState, useEffect, useMemo, useTransition, useRef, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getDashboardMetrics, listTransactions, getOrganizationDetails } from '@/ai/flows/finance-management';
import { TransactionProfile, OrganizationProfile } from '@/ai/schemas';
import { Bar, BarChart as BarChartPrimitive, CartesianGrid, ResponsiveContainer, Pie, PieChart as PieChartPrimitive, Cell } from 'recharts';
import CustomXAxis from '@/components/utils/CustomXAxis';
import CustomYAxis from '@/components/utils/CustomYAxis';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { DollarSign, ArrowUp, ArrowDown, Landmark, Loader2, ServerCrash, TrendingUp, TrendingDown, Wallet, Component, Calendar as CalendarIcon, Download } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FinanceReportPDF, FinanceReportMetrics } from '@/components/dashboard/finance/FinanceReportPDF';

interface CombinedMetrics extends FinanceReportMetrics {
  cashFlowChartData: { month: string; receita: number; despesa: number }[];
  expenseChartData: { name: string; value: number; fill: string }[];
}

const chartConfig = {
    receita: { label: "Receita", color: "hsl(var(--chart-2))" },
    despesa: { label: "Despesa", color: "hsl(var(--chart-1))" },
};

const MetricCard = ({ title, value, icon: Icon, isLoading, format, colorClass = 'bg-finance-primary' }: { title: string, value: number, icon: React.ElementType, isLoading: boolean, format?: (value: number) => string, colorClass?: string }) => (
  <div className="bg-card p-6 rounded-2xl border border-border flex items-center">
    <div className={`p-3 rounded-xl text-black mr-4 shadow-lg ${colorClass}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-muted-foreground text-sm font-medium">{title}</p>
      {isLoading ? (
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin mt-1" />
      ) : (
        <p className="text-2xl font-bold text-foreground">{format ? format(value) : value}</p>
      )}
    </div>
  </div>
);

export default function RelatoriosPage() {
    const [metrics, setMetrics] = useState<CombinedMetrics | null>(null);
    const [organization, setOrganization] = useState<OrganizationProfile | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const pdfRef = useRef<HTMLDivElement>(null);

    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);
    
    const calculateChartData = useCallback((transactions: TransactionProfile[]) => {
        const monthlyCashFlow = transactions.reduce((acc, t) => {
            const month = format(new Date(t.date), 'MMM/yy', { locale: ptBR });
            if (!acc[month]) {
                acc[month] = { month, receita: 0, despesa: 0 };
            }
            if (t.type === 'income') {
                acc[month].receita += t.amount;
            } else {
                acc[month].despesa += t.amount;
            }
            return acc;
        }, {} as Record<string, { month: string; receita: number; despesa: number }>);
        
        const cashFlowChartData = Object.values(monthlyCashFlow).reverse();

        const expenseByCategory = transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => {
                const category = t.category || 'Outros';
                if (!acc[category]) {
                    acc[category] = { name: category, value: 0, fill: `hsl(var(--chart-${(Object.keys(acc).length % 5) + 1}))` };
                }
                acc[category].value += t.amount;
                return acc;
            }, {} as Record<string, { name: string; value: number; fill: string }>);
        
        const expenseChartData = Object.values(expenseByCategory);

        return { cashFlowChartData, expenseChartData };
    }, []);

    useEffect(() => {
        if (currentUser) {
            startTransition(() => {
                setIsLoading(true);
                setError(null);
                const fetchAllData = async () => {
                    const dateRange = date?.from && date?.to ? { from: date.from.toISOString(), to: date.to.toISOString() } : undefined;
                    try {
                        const [metricsData, transactionsData, orgData] = await Promise.all([
                            getDashboardMetrics({ actor: currentUser.uid, dateRange }),
                            listTransactions({ actor: currentUser.uid, dateRange }),
                            getOrganizationDetails({ actor: currentUser.uid })
                        ]);
                        
                        const chartData = calculateChartData(transactionsData);
                        setMetrics({ ...metricsData, ...chartData });
                        setOrganization(orgData);

                    } catch (err) {
                        console.error(err);
                        setError('Não foi possível carregar os dados financeiros.');
                    } finally {
                        setIsLoading(false);
                    }
                };
                fetchAllData();
            })
        }
    }, [currentUser, date, calculateChartData]);
    
    const generatePdf = async () => {
        setIsGeneratingPdf(true);
        await new Promise(resolve => setTimeout(resolve, 100));
        const input = pdfRef.current;
        if (!input) {
            setError("Erro: Não foi possível encontrar o template do PDF.");
            setIsGeneratingPdf(false);
            return;
        }

        try {
            const canvas = await html2canvas(input, { scale: 2, useCORS: true, backgroundColor: '#111827' });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgProps = pdf.getImageProperties(imgData);
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            const formattedDate = date?.from ? format(date.from, 'MMMM-yyyy', { locale: ptBR }) : 'periodo';
            pdf.save(`relatorio-financeiro-${formattedDate}.pdf`);
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            setError("Ocorreu um erro ao gerar o PDF.");
        } finally {
            setIsGeneratingPdf(false);
        }
    };


    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', }).format(value);
    }
    
    const renderContent = () => {
        if (isLoading || isPending) {
            return (
                <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <p className="mt-4 text-muted-foreground">Gerando relatórios...</p>
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
                    <MetricCard title="Receita (Período)" value={metrics?.totalIncome ?? 0} icon={TrendingUp} isLoading={isLoading} format={formatCurrency} />
                    <MetricCard title="Despesa (Período)" value={metrics?.totalExpense ?? 0} icon={TrendingDown} isLoading={isLoading} format={formatCurrency} />
                    <MetricCard title="Lucro Líquido (Período)" value={metrics?.netProfit ?? 0} icon={DollarSign} isLoading={isLoading} format={formatCurrency} />
                    <MetricCard title="Saldo Total em Contas" value={metrics?.totalBalance ?? 0} icon={Wallet} isLoading={isLoading} format={formatCurrency} />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <Card className="lg:col-span-3 bg-card p-6 rounded-2xl border-border">
                        <CardHeader>
                            <CardTitle>Fluxo de Caixa Mensal</CardTitle>
                            <CardDescription>Receitas vs. Despesas no período selecionado.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                                <BarChartPrimitive data={metrics?.cashFlowChartData}>
                                    <CartesianGrid vertical={false} />
                                    <CustomXAxis dataKey="month" tickMargin={10} />
                                    <CustomYAxis tickFormatter={(value) => `R$ ${value / 1000}k`} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="receita" fill="var(--color-receita)" radius={8} />
                                    <Bar dataKey="despesa" fill="var(--color-despesa)" radius={8} />
                                </BarChartPrimitive>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                    <Card className="lg:col-span-2 bg-card p-6 rounded-2xl border-border">
                        <CardHeader>
                        <CardTitle>Composição de Despesas</CardTitle>
                        <CardDescription>Categorias de despesas no período selecionado.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                            <ChartContainer config={chartConfig} className="min-h-[300px] w-full max-w-[300px]">
                                <PieChartPrimitive>
                                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                <Pie data={metrics?.expenseChartData} dataKey="value" nameKey="name" innerRadius={60}>
                                    {metrics?.expenseChartData.map((entry) => (
                                        <Cell key={entry.name} fill={entry.fill} />
                                    ))}
                                </Pie>
                                </PieChartPrimitive>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-card p-8 rounded-2xl border-border text-center">
                    <h3 className="text-xl font-bold text-foreground">Relatório em PDF Pronto</h3>
                    <p className="text-muted-foreground mt-2 mb-6 max-w-2xl mx-auto">
                        Seu relatório detalhado com gráficos e as métricas acima está pronto. Clique no botão abaixo para fazer o download e compartilhar com sua equipe.
                    </p>
                    <Button onClick={generatePdf} disabled={isGeneratingPdf || !metrics} className="bg-primary text-primary-foreground px-6 py-3">
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
                <FinanceReportPDF
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
                        <h1 className="text-4xl font-bold text-foreground">Relatórios Financeiros</h1>
                        <p className="text-muted-foreground">
                            Acompanhe as métricas e a saúde financeira do seu negócio em tempo real.
                        </p>
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button id="date" variant={"outline"} className={cn("w-[300px] justify-start text-left font-normal",!date && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (date.to ? (<>{format(date.from, "PPP", { locale: ptBR })} - {format(date.to, "PPP", { locale: ptBR })}</>) : (format(date.from, "PPP", { locale: ptBR }))) : (<span>Escolha um período</span>)}
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
