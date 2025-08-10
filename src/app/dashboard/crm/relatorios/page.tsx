
'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getDashboardMetrics } from '@/ai/flows/crm-management';
import { CustomerProfile, SaleLeadProfile } from '@/ai/schemas';
import { Bar, BarChart as BarChartPrimitive, CartesianGrid, Pie, PieChart as PieChartPrimitive, Cell } from 'recharts';
import CustomXAxis from '@/components/utils/CustomXAxis';
import CustomYAxis from '@/components/utils/CustomYAxis';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { DollarSign, Trophy, Users, Target, Loader2, ServerCrash } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CrmReportMetrics {
  totalRevenue: number;
  totalWonLeads: number;
  avgRevenuePerDeal: number;
  avgSalesCycleDays: number;
  revenueByMonth: { month: string; revenue: number }[];
  leadsBySource: { name: string; value: number; fill: string }[];
}

const chartConfig = {
  revenue: {
    label: "Receita",
    color: "hsl(var(--chart-1))",
  },
};

const MetricCard = ({ title, value, icon: Icon, isLoading, format }: { title: string, value: string | number, icon: React.ElementType, isLoading: boolean, format?: (value: number) => string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-neumorphism border border-gray-100 flex items-center">
    <div className="p-3 rounded-xl bg-primary text-white mr-4 shadow-neumorphism">
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-gray-600 text-sm font-medium">{title}</p>
      {isLoading ? (
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin mt-1" />
      ) : (
        <p className="text-3xl font-bold text-black">{typeof value === 'number' && format ? format(value) : value}</p>
      )}
    </div>
  </div>
);

export default function RelatoriosPage() {
  const [metrics, setMetrics] = useState<CrmReportMetrics | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const calculateMetrics = useCallback((customers: CustomerProfile[], leads: SaleLeadProfile[]): CrmReportMetrics => {
    const wonLeads = leads.filter(lead => lead.stage === 'won');
    
    const totalRevenue = wonLeads.reduce((acc, lead) => acc + (lead.value || 0), 0);
    const totalWonLeads = wonLeads.length;
    const avgRevenuePerDeal = totalWonLeads > 0 ? totalRevenue / totalWonLeads : 0;
    
    const salesCycleDurations = wonLeads
      .map(lead => differenceInDays(parseISO(lead.updatedAt), parseISO(lead.createdAt)))
      .filter(days => days >= 0);
    const avgSalesCycleDays = salesCycleDurations.length > 0
      ? Math.round(salesCycleDurations.reduce((a, b) => a + b, 0) / salesCycleDurations.length)
      : 0;

    const revenueByMonth = wonLeads.reduce((acc, lead) => {
        const month = format(parseISO(lead.updatedAt), 'MMM', { locale: ptBR });
        acc[month] = (acc[month] || 0) + (lead.value || 0);
        return acc;
    }, {} as Record<string, number>);
    const formattedRevenueByMonth = Object.entries(revenueByMonth).map(([month, revenue]) => ({ month, revenue }));

    const leadsBySource = customers.reduce((acc, customer) => {
        const source = customer.source || 'Desconhecida';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const formattedLeadsBySource = Object.entries(leadsBySource).map(([name, value], i) => ({
        name,
        value,
        fill: `hsl(var(--chart-${i % 5 + 1}))`
    }));

    return {
        totalRevenue,
        totalWonLeads,
        avgRevenuePerDeal,
        avgSalesCycleDays,
        revenueByMonth: formattedRevenueByMonth,
        leadsBySource: formattedLeadsBySource
    };
  }, []);


  useEffect(() => {
    if (!currentUser) return;

    const fetchAndSetMetrics = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { customers, leads } = await getDashboardMetrics({ actor: currentUser.uid });
            const calculatedMetrics = calculateMetrics(customers, leads);
            setMetrics(calculatedMetrics);
        } catch (err) {
            console.error("Erro ao buscar dados para relatórios:", err);
            setError('Não foi possível carregar os dados dos relatórios.');
        } finally {
            setIsLoading(false);
        }
    }
    
    fetchAndSetMetrics();
  }, [currentUser, calculateMetrics]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value);
  }

  const renderContent = () => {
    if (isLoading) {
        return (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="mt-4 text-gray-600">Gerando relatórios...</p>
          </div>
        );
    }  
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Receita Total (Ganha)" value={metrics?.totalRevenue ?? 0} icon={DollarSign} isLoading={isLoading} format={formatCurrency} />
                <MetricCard title="Negócios Ganhos" value={metrics?.totalWonLeads ?? 0} icon={Trophy} isLoading={isLoading} />
                <MetricCard title="Ticket Médio" value={metrics?.avgRevenuePerDeal ?? 0} icon={Target} isLoading={isLoading} format={formatCurrency}/>
                <MetricCard title="Ciclo Médio de Venda" value={`${metrics?.avgSalesCycleDays ?? 0} dias`} icon={Users} isLoading={isLoading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <Card className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-neumorphism border border-gray-100">
                    <CardHeader>
                        <CardTitle>Receita por Mês</CardTitle>
                        <CardDescription>Receita de negócios ganhos nos últimos meses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                            <BarChartPrimitive data={metrics?.revenueByMonth}>
                                <CartesianGrid vertical={false} />
                                <CustomXAxis dataKey="month" tickMargin={10} />
                                <CustomYAxis tickFormatter={(value) => `R$${value / 1000}k`}/>
                                <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />} />
                                <Bar dataKey="revenue" radius={8} fill="var(--color-revenue)" />
                            </BarChartPrimitive>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-neumorphism border border-gray-100">
                    <CardHeader>
                        <CardTitle>Origem dos Clientes</CardTitle>
                        <CardDescription>Distribuição de clientes por canal de aquisição.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <ChartContainer config={chartConfig} className="min-h-[300px] w-full max-w-[300px]">
                            <PieChartPrimitive>
                                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                <Pie data={metrics?.leadsBySource} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
                                    {metrics?.leadsBySource.map((entry) => (
                                        <Cell key={`cell-${entry.name}`} fill={entry.fill} />
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
                <h1 className="text-3xl font-bold text-black">Relatórios do CRM</h1>
                <p className="text-gray-600">
                Analise o desempenho de suas vendas, clientes e atividades.
                </p>
            </div>
        </div>
        {renderContent()}
    </div>
  );
}
