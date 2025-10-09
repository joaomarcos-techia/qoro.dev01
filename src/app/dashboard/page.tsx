
'use client';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  CheckSquare,
  DollarSign,
  Users,
  Loader2,
  TrendingUp,
  ListTodo,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { getUserAccessInfo } from '@/ai/flows/user-management';
import { getCrmDashboardMetrics } from '@/ai/flows/crm-management';
import { getFinanceDashboardMetrics } from '@/ai/flows/finance-management';
import { ErrorBoundary } from 'react-error-boundary';
import { UserAccessInfo, CustomerProfile } from '@/ai/schemas';
import { useRouter } from 'next/navigation';
import { usePlan } from '@/contexts/PlanContext';
import { cn } from '@/lib/utils';


interface DashboardMetrics {
    totalCustomers: number;
    activeLeads: number;
    pendingTasks: number;
    totalBalance: number;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
};

const MetricCard = ({ title, value, icon: Icon, isLoading, error, colorClass = 'bg-primary' }: { title: string, value: string, icon: React.ElementType, isLoading: boolean, error?: boolean, colorClass?: string }) => (
    <div className="bg-card p-6 rounded-2xl border border-border flex items-center transition-all duration-200 hover:border-primary/50 hover:-translate-y-1">
        <div className={`p-3 rounded-xl ${error ? 'bg-yellow-500' : colorClass} text-black mr-4 shadow-lg`}>
            {error ? <AlertTriangle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
        </div>
        <div>
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            {isLoading ? (
                 <Loader2 className="w-6 h-6 text-muted-foreground animate-spin mt-1" />
            ) : (
                <p className="text-2xl font-bold text-foreground">{error ? 'Erro' : value}</p>
            )}
        </div>
    </div>
);

function DashboardErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
    return (
        <div className="bg-destructive/10 border-l-4 border-destructive text-destructive-foreground p-4 rounded-lg" role="alert">
            <h3 className="font-bold">Ocorreu um Erro no Dashboard</h3>
            <p className="mt-2">Não foi possível carregar alguns dados do dashboard. Isso pode ser temporário.</p>
            <p className="text-xs mt-1 opacity-70">Detalhe: {error.message}</p>
            <button
                onClick={resetErrorBoundary}
                className="mt-4 bg-destructive text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-destructive"
            >
                Tentar Novamente
            </button>
        </div>
    );
}

const AppCard = ({ 
    href, 
    title, 
    icon: Icon, 
    color, 
    description,
    isLocked = false,
}: { 
    href: string;
    title: string; 
    icon: React.ElementType; 
    color: string; 
    description: string;
    isLocked?: boolean;
}) => {
    const router = useRouter();
    const [isNavigating, setIsNavigating] = useState(false);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isLocked) return;
        e.preventDefault();
        setIsNavigating(true);
        router.push(href);
    };

    return (
      <div 
        onClick={handleClick}
        className={cn(
            "group bg-card rounded-2xl border border-border transition-all duration-200 flex flex-col h-full",
            isLocked ? "opacity-50 cursor-not-allowed" : "hover:border-primary/50 hover:-translate-y-1 cursor-pointer"
        )}
      >
          <div className="p-6 flex-grow flex flex-col">
              <div className="flex items-center mb-4">
                  <div className={cn("p-3 rounded-xl text-black mr-4 group-hover:scale-110 transition-transform duration-300 shadow-lg", color)}>
                      <Icon className="w-6 h-6" />
                  </div>
                  <div>
                      <h4 className="text-lg font-bold text-foreground">{title}</h4>
                  </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6 flex-grow">
                  {description}
              </p>
              <div className="w-full bg-secondary text-secondary-foreground py-2.5 px-4 rounded-full flex items-center justify-center text-sm font-medium">
                  {isLocked ? (
                      <>
                          <Lock className="w-4 h-4 mr-2" />
                          <span>Disponível no plano Performance</span>
                      </>
                  ) : isNavigating ? (
                      <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          <span>Carregando...</span>
                      </>
                  ) : (
                      <>
                          <span>Acessar</span>
                          <ArrowRight className="w-4 h-4 ml-2 transform transition-transform duration-300 group-hover:translate-x-1" />
                      </>
                  )}
              </div>
          </div>
      </div>
    );
}


function DashboardContent() {
  const { planId, permissions, isLoading: isPlanLoading } = usePlan();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics>({ totalCustomers: 0, activeLeads: 0, pendingTasks: 0, totalBalance: 0 });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        setIsLoadingMetrics(false);
      }
    });
    return () => unsubscribe();
  }, []);


  useEffect(() => {
    async function fetchAllMetrics() {
        if (!currentUser) return;

        setIsLoadingMetrics(true);
        setError(null);

        try {
            const [crm, finance] = await Promise.all([
                getCrmDashboardMetrics({ actor: currentUser.uid }),
                getFinanceDashboardMetrics({ actor: currentUser.uid }),
            ]);
            setMetrics({
                totalCustomers: crm.totalCustomers,
                activeLeads: crm.activeLeads,
                pendingTasks: 0, // Set to 0 as the source function was removed
                totalBalance: finance.totalBalance,
            });
        } catch (err: any) {
            console.error("Dashboard Metrics Error:", err);
            setError("Não foi possível carregar as métricas do dashboard.");
        } finally {
             setIsLoadingMetrics(false);
        }
    }
    
    if (currentUser) {
        fetchAllMetrics();
    }
  }, [currentUser]);

  if (isPlanLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    )
  }
  
  if (!currentUser) {
    return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <AlertTriangle className="mx-auto w-12 h-12 text-destructive" />
            <h3 className="mt-4 text-lg font-medium text-foreground">Sessão expirada ou inválida.</h3>
            <p className="mt-2 text-sm text-muted-foreground">Por favor, faça login novamente.</p>
          </div>
        </div>
      );
  }

  const isPulseLocked = !permissions?.qoroPulse;

  return (
    <div
      id="dashboard-content"
      className="app-content active max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Bem-vindo à Qoro!
        </h2>
        <p className="text-muted-foreground">
          Gerencie toda a sua empresa em uma única plataforma integrada
        </p>
      </div>
      
      <ErrorBoundary FallbackComponent={DashboardErrorFallback}>
       <div className="mb-12">
            <h3 className="text-xl font-bold text-foreground mb-6">Métricas e Insights Rápidos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Total de Clientes" value={String(metrics.totalCustomers)} icon={Users} isLoading={isLoadingMetrics} error={!!error} colorClass='bg-crm-primary' />
                <MetricCard title="Clientes no Funil" value={String(metrics.activeLeads)} icon={TrendingUp} isLoading={isLoadingMetrics} error={!!error} colorClass='bg-crm-primary' />
                <MetricCard title="Tarefas Pendentes" value={String(metrics.pendingTasks)} icon={ListTodo} isLoading={isLoadingMetrics} error={!!error} colorClass='bg-task-primary' />
                <MetricCard title="Saldo em Contas" value={formatCurrency(metrics.totalBalance)} icon={DollarSign} isLoading={isLoadingMetrics} error={!!error} colorClass='bg-finance-primary' />
            </div>
             {error && (
                <div className="mt-4 p-4 bg-yellow-800/20 border-l-4 border-yellow-500 text-yellow-300 rounded-lg text-sm">
                   <p><span className="font-bold">Aviso:</span> {error} A funcionalidade principal continua operacional.</p>
                </div>
            )}
        </div>
      </ErrorBoundary>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-foreground">Seus Aplicativos Qoro</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AppCard 
                href="/dashboard/crm/clientes"
                title="QoroCRM"
                icon={Users}
                color="bg-crm-primary"
                description="CRM com foco em gestão de funil de vendas e conversão para maximizar seus lucros."
            />
             <AppCard 
                href="/dashboard/pulse"
                title="QoroPulse"
                icon={Activity}
                color="bg-pulse-primary"
                description="O sistema nervoso central da sua operação, revelando insights para otimização automática e inteligente."
                isLocked={isPulseLocked}
            />
            <AppCard 
                href="/dashboard/task/visao-geral"
                title="QoroTask"
                icon={CheckSquare}
                color="bg-task-primary"
                description="Plataforma leve e poderosa de gestão de tarefas e produtividade para manter sua equipe alinhada e focada."
            />
            <AppCard 
                href="/dashboard/finance/transacoes"
                title="QoroFinance"
                icon={DollarSign}
                color="bg-finance-primary"
                description="Controle financeiro completo para seu negócio, com dashboards claros e relatórios simplificados."
            />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
    return (
        <div className="h-full">
            <ErrorBoundary FallbackComponent={DashboardErrorFallback}>
                <DashboardContent />
            </ErrorBoundary>
        </div>
    )
}
