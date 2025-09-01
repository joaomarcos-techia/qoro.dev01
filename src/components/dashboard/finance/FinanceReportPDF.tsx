'use client';
import React from 'react';
import { OrganizationProfile } from '@/ai/schemas';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, CartesianGrid, Pie, PieChart, Cell, ResponsiveContainer } from 'recharts';
import CustomXAxis from '@/components/utils/CustomXAxis';
import CustomYAxis from '@/components/utils/CustomYAxis';
import { ChartTooltipContent } from '@/components/ui/chart';
import { DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Logo } from '@/components/ui/logo';


export interface FinanceReportMetrics {
    totalBalance: number;
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    cashFlowChartData: { month: string; receita: number; despesa: number }[];
    expenseChartData: { name: string; value: number; fill: string }[];
}

interface FinanceReportPDFProps {
  metrics: FinanceReportMetrics;
  organization: OrganizationProfile;
  period: { from: Date; to: Date };
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const FinanceReportPDF = React.forwardRef<HTMLDivElement, FinanceReportPDFProps>(({ metrics, organization, period }, ref) => {
  const periodString = `${format(period.from, 'dd/MM/yyyy')} a ${format(period.to, 'dd/MM/yyyy')}`;

  const MetricBox = ({ title, value, icon: Icon, colorClass }: { title: string, value: string, icon: React.ElementType, colorClass?:string }) => (
    <div className="bg-slate-800 rounded-lg p-4 flex items-center">
      <div className={`p-2 rounded-lg ${colorClass || 'bg-finance-primary'} text-black mr-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-slate-400 text-xs font-medium">{title}</p>
        <p className="text-xl font-bold text-white">{value}</p>
      </div>
    </div>
  );

  return (
    <div ref={ref} className="bg-gray-900 text-white" style={{ width: '800px', padding: '40px', fontFamily: 'Inter, sans-serif' }}>
        {/* Header */}
        <header className="flex justify-between items-center pb-5 border-b border-gray-700">
            <Logo height={32} />
            <div className="text-right">
                <h1 className="text-2xl font-bold text-white">Relatório de Desempenho Financeiro</h1>
                <p className="text-gray-400">{periodString}</p>
            </div>
        </header>

        {/* Metrics */}
        <section className="my-8">
            <div className="grid grid-cols-4 gap-5">
                <MetricBox title="Receita no Período" value={formatCurrency(metrics.totalIncome)} icon={TrendingUp} colorClass="bg-green-500" />
                <MetricBox title="Despesa no Período" value={formatCurrency(metrics.totalExpense)} icon={TrendingDown} colorClass="bg-red-500"/>
                <MetricBox title="Lucro Líquido" value={formatCurrency(metrics.netProfit)} icon={DollarSign} />
                <MetricBox title="Saldo Total em Contas" value={formatCurrency(metrics.totalBalance)} icon={Wallet} colorClass="bg-blue-500" />
            </div>
        </section>

        {/* Charts */}
        <section className="grid grid-cols-5 gap-8">
            <div className="col-span-3 bg-slate-800 p-6 rounded-xl">
                <h3 className="font-bold mb-1 text-white">Fluxo de Caixa</h3>
                <p className="text-sm text-slate-400 mb-4">Receitas vs. Despesas no período.</p>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={metrics.cashFlowChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                        <CustomXAxis dataKey="month" fontSize={10} stroke="#9ca3af" />
                        <CustomYAxis fontSize={10} tickFormatter={(val) => `R$${val/1000}k`} stroke="#9ca3af" />
                        <ChartTooltipContent formatter={(value:any) => formatCurrency(value as number)} />
                        <Bar dataKey="receita" fill={"hsl(var(--chart-2))"} radius={4} />
                        <Bar dataKey="despesa" fill={"hsl(var(--chart-1))"} radius={4} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="col-span-2 bg-slate-800 p-6 rounded-xl">
                <h3 className="font-bold mb-1 text-white">Composição de Despesas</h3>
                <p className="text-sm text-slate-400 mb-4">Distribuição de despesas por categoria.</p>
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                         <ChartTooltipContent formatter={(value:any, name:any) => `${formatCurrency(value as number)} (${name})`} />
                         <Pie data={metrics.expenseChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={50} labelLine={false}
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                                const RADIAN = Math.PI / 180;
                                const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                return (
                                  <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10}>
                                    {`${metrics.expenseChartData[index].name} (${(percent * 100).toFixed(0)}%)`}
                                  </text>
                                );
                            }}
                         >
                            {metrics.expenseChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </section>

        {/* Footer */}
        <footer className="mt-10 pt-4 border-t border-gray-700 text-center text-xs text-gray-500">
            Relatório gerado por Qoro para {organization.name} em {format(new Date(), 'dd/MM/yyyy HH:mm')}
        </footer>
    </div>
  );
});

FinanceReportPDF.displayName = 'FinanceReportPDF';
