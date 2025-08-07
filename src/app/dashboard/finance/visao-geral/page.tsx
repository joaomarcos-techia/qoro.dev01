
'use client';
import { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getDashboardMetrics } from '@/ai/flows/finance-management';
import { listTransactions } from '@/ai/flows/finance-management';
import { TransactionProfile } from '@/ai/schemas';
import { Bar, BarChart as BarChartPrimitive, CartesianGrid, ResponsiveContainer, Pie, PieChart as PieChartPrimitive, Cell } from 'recharts';
import CustomXAxis from '@/components/utils/CustomXAxis';
import CustomYAxis from '@/components/utils/CustomYAxis';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { DollarSign, ArrowUp, ArrowDown, Landmark, Loader2, ServerCrash, TrendingUp, TrendingDown, Wallet, Component } from 'lucide-react';

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

const MetricCard = ({ title, value, icon: Icon, isLoading, color, format }: { title: string, value: number, icon: React.ElementType, isLoading: boolean, color: string, format?: (value: number) => string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-neumorphism border border-gray-100 flex items-center">
    <div className={`p-3 rounded-xl text-white mr-4 shadow-neumorphism ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-gray-600 text-sm font-medium">{title}</p>
      {isLoading ? (
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin mt-1" />
      ) : (
        <p className="text-2xl font-bold text-black">{format ? format(value) : value}</p>
      )}
    </div>
  </div>
);

export default function VisaoGeralPage() {
    const [metrics, setMetrics] = useState<FinanceMetrics | null>(null);
    const [transactions, setTransactions] = useState<TransactionProfile[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (currentUser) {
            setIsLoading(true);
            setError(null);
            const fetchAllData = async () => {
                try {
                    const metricsPromise = getDashboardMetrics({ actor: currentUser.uid });
                    const transactionsPromise = listTransactions({ actor: currentUser.uid });
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
        }
    }, [currentUser]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(value);
    }
    
    const { cashFlowChartData, expenseChartData } = useMemo(() => {
        const monthlyCashFlow = transactions.reduce((acc, t) => {
            const month = new Date(t.date).toLocaleString('default', { month: 'short' });
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
        if (error) {
            return (
              <div className="flex flex-col items-center justify-center h-96 bg-red-50 rounded-lg p-8 text-center">
                <ServerCrash className="w-16 h-16 text-red-500 mb-4" />
                <h3 className="text-xl font-bold text-red-700">Ocorreu um erro</h3>
                <p className="text-gray-600 mt-2">{error}</p>
              </div>
            );
        }

        return (
            <div className="space-y-8">
                {/* Metrics Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard title="Receita (Mês)" value={metrics?.totalIncome ?? 0} icon={TrendingUp} isLoading={isLoading} color="bg-green-500" format={formatCurrency} />
                    <MetricCard title="Despesa (Mês)" value={metrics?.totalExpense ?? 0} icon={TrendingDown} isLoading={isLoading} color="bg-red-500" format={formatCurrency} />
                    <MetricCard title="Lucro Líquido (Mês)" value={metrics?.netProfit ?? 0} icon={DollarSign} isLoading={isLoading} color="bg-blue-500" format={formatCurrency} />
                    <MetricCard title="Saldo em Contas" value={metrics?.totalBalance ?? 0} icon={Wallet} isLoading={isLoading} color="bg-yellow-500" format={formatCurrency} />
                </div>
                
                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <Card className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-neumorphism border border-gray-100">
                        <CardHeader>
                            <CardTitle>Fluxo de Caixa Mensal</CardTitle>
                            <CardDescription>Receitas vs. Despesas nos últimos meses.</CardDescription>
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
                    <Card className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-neumorphism border border-gray-100">
                        <CardHeader>
                        <CardTitle>Composição de Despesas</CardTitle>
                        <CardDescription>Categorias de despesas no mês atual.</CardDescription>
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
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-black">Visão Geral Financeira</h1>
            <p className="text-gray-600">
                Acompanhe as métricas e a saúde financeira do seu negócio em tempo real.
            </p>
        </div>
        {renderContent()}
      </div>
    );
  }
