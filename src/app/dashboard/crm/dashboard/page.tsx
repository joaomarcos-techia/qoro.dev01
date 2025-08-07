
'use client';
import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getDashboardMetrics } from '@/ai/flows/crm-management';
import { CustomerProfile, SaleLeadProfile } from '@/ai/schemas';
import { Bar, BarChart as BarChartPrimitive, CartesianGrid } from 'recharts';
import CustomXAxis from '@/components/utils/CustomXAxis';
import CustomYAxis from '@/components/utils/CustomYAxis';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Users, TrendingUp, Percent, DollarSign, Loader2, ServerCrash } from 'lucide-react';
import { subMonths, format, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CrmMetrics {
  totalCustomers: number;
  totalLeads: number;
  conversionRate: number;
  totalRevenueWon: number;
  leadStages: {
    prospect: number;
    qualified: number;
    proposal: number;
    negotiation: number;
  };
  newCustomersPerMonth: { month: string; customers: number }[];
}

const chartConfig = {
  leads: {
    label: "Leads",
    color: "hsl(var(--chart-1))",
  },
  customers: {
    label: "Novos Clientes",
    color: "hsl(var(--chart-2))",
  },
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
        <p className="text-3xl font-bold text-black">{format ? format(value) : value}</p>
      )}
    </div>
  </div>
);

export default function DashboardCrmPage() {
  const [metrics, setMetrics] = useState<CrmMetrics | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const calculateMetrics = useCallback((customers: CustomerProfile[], leads: SaleLeadProfile[]): CrmMetrics => {
    const totalCustomers = customers.length;
    
    let totalRevenueWon = 0;
    let closedWonCount = 0;
    const leadStages = { prospect: 0, qualified: 0, proposal: 0, negotiation: 0 };
    
    leads.forEach(lead => {
        if(lead.stage === 'closed_won') {
            totalRevenueWon += lead.value || 0;
            closedWonCount++;
        } else if (lead.stage !== 'closed_lost') {
            if (lead.stage in leadStages) {
                leadStages[lead.stage as keyof typeof leadStages]++;
            }
        }
    });

    const totalLeads = Object.values(leadStages).reduce((a, b) => a + b, 0);
    const totalClosedDeals = closedWonCount + leads.filter(l => l.stage === 'closed_lost').length;
    const conversionRate = totalClosedDeals > 0 ? parseFloat(((closedWonCount / totalClosedDeals) * 100).toFixed(1)) : 0;

    const now = new Date();
    const monthlyCounts: { [key: string]: number } = {};
    for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthKey = format(monthDate, 'yyyy-MM');
        monthlyCounts[monthKey] = 0;
    }

    customers.forEach(customer => {
        const createdAt = new Date(customer.createdAt);
        if (createdAt >= startOfMonth(subMonths(now, 5))) {
            const monthKey = format(createdAt, 'yyyy-MM');
            if (monthlyCounts.hasOwnProperty(monthKey)) {
                monthlyCounts[monthKey]++;
            }
        }
    });
    
    const newCustomersPerMonth = Object.keys(monthlyCounts).map(key => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return {
            month: format(date, 'MMM', { locale: ptBR }),
            customers: monthlyCounts[key],
        };
    });

    return {
        totalCustomers,
        totalLeads,
        conversionRate,
        totalRevenueWon,
        leadStages,
        newCustomersPerMonth
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
            console.error("Erro ao buscar métricas do CRM:", err);
            setError('Não foi possível carregar as métricas do CRM.');
        } finally {
            setIsLoading(false);
        }
    }
    
    fetchAndSetMetrics();

  }, [currentUser, calculateMetrics]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  const formatPercentage = (value: number) => `${value}%`;
  
  const funnelChartData = metrics ? [
    { stage: 'Prospect', leads: metrics.leadStages.prospect, fill: "var(--color-leads)" },
    { stage: 'Qualificado', leads: metrics.leadStages.qualified, fill: "var(--color-leads)" },
    { stage: 'Proposta', leads: metrics.leadStages.proposal, fill: "var(--color-leads)" },
    { stage: 'Negociação', leads: metrics.leadStages.negotiation, fill: "var(--color-leads)" },
  ] : [];

  const newCustomersChartData = metrics ? metrics.newCustomersPerMonth.map(item => ({ ...item, month: item.month.charAt(0).toUpperCase() + item.month.slice(1) })) : [];


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
            {/* Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard title="Total de Clientes" value={metrics?.totalCustomers ?? 0} icon={Users} isLoading={isLoading} color="bg-blue-500" />
            <MetricCard title="Leads Ativos" value={metrics?.totalLeads ?? 0} icon={TrendingUp} isLoading={isLoading} color="bg-purple-500" />
            <MetricCard title="Taxa de Conversão" value={metrics?.conversionRate ?? 0} icon={Percent} isLoading={isLoading} color="bg-green-500" format={formatPercentage} />
            <MetricCard title="Receita Gerada" value={metrics?.totalRevenueWon ?? 0} icon={DollarSign} isLoading={isLoading} color="bg-yellow-500" format={formatCurrency} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-white p-6 rounded-2xl shadow-neumorphism border border-gray-100">
                    <CardHeader>
                        <CardTitle className="flex items-center"><TrendingUp className="w-5 h-5 mr-3 text-primary"/>Funil de Vendas</CardTitle>
                        <CardDescription>Distribuição de leads ativos por estágio.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                            <BarChartPrimitive data={funnelChartData} >
                                <CartesianGrid vertical={false} />
                                <CustomXAxis dataKey="stage" tickMargin={10} />
                                <CustomYAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="leads" radius={8} />
                            </BarChartPrimitive>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card className="bg-white p-6 rounded-2xl shadow-neumorphism border border-gray-100">
                    <CardHeader>
                        <CardTitle className="flex items-center"><LineChart className="w-5 h-5 mr-3 text-primary"/>Novos Clientes por Mês</CardTitle>
                        <CardDescription>Crescimento da base de clientes nos últimos 6 meses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                            <BarChartPrimitive data={newCustomersChartData} >
                                <CartesianGrid vertical={false} />
                                <CustomXAxis dataKey="month" tickMargin={10} />
                                <CustomYAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="customers" name="Novos Clientes" radius={8} fill="var(--color-customers)" />
                            </BarChartPrimitive>
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
        <h1 className="text-3xl font-bold text-black">Dashboard do CRM</h1>
        <p className="text-gray-600">
          Analise a saúde do seu relacionamento com clientes e o desempenho de vendas.
        </p>
      </div>
      {renderContent()}
    </div>
  );
}
