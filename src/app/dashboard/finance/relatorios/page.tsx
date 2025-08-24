
'use client';
import { useState, useEffect, useMemo, useTransition } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getDashboardMetrics } from '@/ai/flows/finance-management';
import { listTransactions } from '@/ai/flows/finance-management';
import { TransactionProfile } from '@/ai/schemas';
import { Bar, BarChart as BarChartPrimitive, CartesianGrid, ResponsiveContainer, Pie, PieChart as PieChartPrimitive, Cell } from 'recharts';
import CustomXAxis from '@/components/utils/CustomXAxis';
import CustomYAxis from '@/components/utils/CustomYAxis';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { DollarSign, ArrowUp, ArrowDown, Landmark, Loader2, ServerCrash, TrendingUp, TrendingDown, Wallet, Component, Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';


interface FinanceMetrics {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  totalBalance: number;
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
    const [metrics, setMetrics] = useState<FinanceMetrics | null>(null);
    const [transactions, setTransactions] = useState<TransactionProfile[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

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

    useEffect(() => {
        if (currentUser) {
            startTransition(() => {
                setIsLoading(true);
                setError(null);
                const fetchAllData = async () => {
                    const dateRange = date?.from && date?.to ? { from: date.from.toISOString(), to: date.to.toISOString() } : undefined;
                    try {
                        const metricsPromise = getDashboardMetrics({ actor: currentUser.uid, dateRange });
                        const transactionsPromise = listTransactions({ actor: currentUser.uid, dateRange });
                        const [metricsData, transactionsData] = await Promise.all([metricsPromise, transactionsPromise]);
                        setMetrics(metricsData);
                        setTransactions(transactionsData);
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
    }, [currentUser, date]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(value);
    }
    
    const { cashFlowChartData, expenseChartData } = useMemo(() => {
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
        
        const cashFlowData = Object.values(monthlyCashFlow).reverse();

        const expenseByCategory = transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => {
                const category = t.category || 'Outros';
                if (!acc[category]) {
                    acc[category] = { name: category, value: 0, fill: `hsl(var(--chart-${Object.keys(acc).length + 1}))` };
                }
                acc[category].value += t.amount;
                return acc;
            }, {} as Record<string, { name: string; value: number; fill: string }>);
        
        const expenseData = Object.values(expenseByCategory);

        return { cashFlowChartData: cashFlowData, expenseChartData: expenseData };
    }, [transactions]);


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
                {/* Metrics Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard title="Receita (Período)" value={metrics?.totalIncome ?? 0} icon={TrendingUp} isLoading={isLoading} format={formatCurrency} />
                    <MetricCard title="Despesa (Período)" value={metrics?.totalExpense ?? 0} icon={TrendingDown} isLoading={isLoading} format={formatCurrency} />
                    <MetricCard title="Lucro Líquido (Período)" value={metrics?.netProfit ?? 0} icon={DollarSign} isLoading={isLoading} format={formatCurrency} />
                    <MetricCard title="Saldo Total em Contas" value={metrics?.totalBalance ?? 0} icon={Wallet} isLoading={isLoading} format={formatCurrency} />
                </div>
                
                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <Card className="lg:col-span-3 bg-card p-6 rounded-2xl border-border">
                        <CardHeader>
                            <CardTitle>Fluxo de Caixa Mensal</CardTitle>
                            <CardDescription>Receitas vs. Despesas no período selecionado.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                                <BarChartPrimitive data={cashFlowChartData}>
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
                                <Pie data={expenseChartData} dataKey="value" nameKey="name" innerRadius={60}>
                                    {expenseChartData.map((entry) => (
                                        <Cell key={entry.name} fill={entry.fill} />
                                    ))}
                                </Pie>
                                </PieChartPrimitive>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    };

    return (
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
                    <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                        "w-[300px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                    )}
                    >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                        date.to ? (
                        <>
                            {format(date.from, "PPP", { locale: ptBR })} -{" "}
                            {format(date.to, "PPP", { locale: ptBR })}
                        </>
                        ) : (
                        format(date.from, "PPP", { locale: ptBR })
                        )
                    ) : (
                        <span>Escolha um período</span>
                    )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                    locale={ptBR}
                    />
                </PopoverContent>
            </Popover>
        </div>
        {renderContent()}
      </div>
    );
  }
