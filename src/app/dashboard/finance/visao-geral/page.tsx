
'use client';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
// NOTE: We will need a new flow to get financial dashboard metrics.
// For now, we will structure the page and use placeholders.
// import { getDashboardMetrics } from '@/ai/flows/finance-management';
import { BarChart, DollarSign, ArrowUp, ArrowDown, Landmark, LineChart, PieChart, Loader2, ServerCrash } from 'lucide-react';

interface FinanceMetrics {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  totalBalance: number;
}

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
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setCurrentUser(user);
          // For now, we'll just stop loading after a bit.
          // In the future, we'll fetch metrics here.
          setTimeout(() => setIsLoading(false), 1000); 
        });
        return () => unsubscribe();
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(value);
    }

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
                    <MetricCard title="Receita Total (Mês)" value={metrics?.totalIncome ?? 0} icon={ArrowUp} isLoading={isLoading} color="bg-green-500" format={formatCurrency} />
                    <MetricCard title="Despesa Total (Mês)" value={metrics?.totalExpense ?? 0} icon={ArrowDown} isLoading={isLoading} color="bg-red-500" format={formatCurrency} />
                    <MetricCard title="Lucro Líquido (Mês)" value={metrics?.netProfit ?? 0} icon={DollarSign} isLoading={isLoading} color="bg-blue-500" format={formatCurrency} />
                    <MetricCard title="Saldo em Contas" value={metrics?.totalBalance ?? 0} icon={Landmark} isLoading={isLoading} color="bg-yellow-500" format={formatCurrency} />
                </div>
                
                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-2xl shadow-neumorphism border border-gray-100">
                        <h3 className="text-lg font-bold text-black mb-4 flex items-center"><LineChart className="w-5 h-5 mr-3 text-primary"/>Fluxo de Caixa Mensal</h3>
                        <div className="h-80 flex items-center justify-center bg-gray-50 rounded-xl">
                            <p className="text-gray-400">Componente de Gráfico - Em breve</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-neumorphism border border-gray-100">
                        <h3 className="text-lg font-bold text-black mb-4 flex items-center"><PieChart className="w-5 h-5 mr-3 text-primary"/>Composição de Despesas</h3>
                        <div className="h-80 flex items-center justify-center bg-gray-50 rounded-xl">
                            <p className="text-gray-400">Componente de Gráfico - Em breve</p>
                        </div>
                    </div>
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
