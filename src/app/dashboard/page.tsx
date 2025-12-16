
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
  X,
  Bell,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { getCrmDashboardMetrics } from '@/ai/flows/crm-management';
import { getFinanceDashboardMetrics } from '@/ai/flows/finance-management';
import { getOverviewMetrics } from '@/ai/flows/task-management';
import { ErrorBoundary } from 'react-error-boundary';
import { useRouter } from 'next/navigation';
import { usePlan } from '@/contexts/PlanContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';

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

const MetricCard = ({ title, value, icon: Icon, isLoading, error, colorClass = 'bg-primary', isLocked = false, lockedText }: { title: string, value: string, icon: React.ElementType, isLoading: boolean, error?: boolean, colorClass?: string, isLocked?: boolean, lockedText?: string }) => (
    <div className={cn("bg-card p-6 rounded-2xl border border-border flex items-center transition-all duration-200", isLocked ? "opacity-60" : "hover:border-primary/50 hover:-translate-y-1")}>
        <div className={cn("p-3 rounded-xl text-black mr-4 shadow-lg", isLocked ? "bg-secondary" : (error ? 'bg-yellow-500' : colorClass))}>
            {isLocked ? <Lock className="w-6 h-6 text-muted-foreground" /> : (error ? <AlertTriangle className="w-6 h-6" /> : <Icon className="w-6 h-6" />)}
        </div>
        <div>
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            {isLoading ? (
                 <Loader2 className="w-6 h-6 text-muted-foreground animate-spin mt-1" />
            ) : isLocked ? (
                <p className="text-base font-bold text-muted-foreground">{lockedText || 'Indisponível'}</p>
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
    lockedText = 'Disponível no plano Performance'
}: { 
    href: string;
    title: string; 
    icon: React.ElementType; 
    color: string; 
    description: string;
    isLocked?: boolean;
    lockedText?: string;
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
                          <span>{lockedText}</span>
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
  const { planId, permissions, isLoading: isPlanLoading, error: planError, organizationId } = usePlan();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics>({ totalCustomers: 0, activeLeads: 0, pendingTasks: 0, totalBalance: 0 });
  const [systemNotification, setSystemNotification] = useState<string | null>(null);
  const router = useRouter();


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      setCurrentUser(user);
      if (!user) {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!organizationId) return;

    const orgDocRef = doc(db, 'organizations', organizationId);
    const unsubscribe = onSnapshot(orgDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSystemNotification(data.lastSystemNotification || null);
      }
    });

    return () => unsubscribe();
  }, [organizationId]);


  useEffect(() => {
    async function fetchAllMetrics() {
        if (!currentUser || isPlanLoading || planError) {
          setIsLoadingMetrics(false);
          return;
        };

        setIsLoadingMetrics(true);
        setMetricsError(null);

        try {
            const [crm, finance, task] = await Promise.all([
                getCrmDashboardMetrics({ actor: currentUser.uid }),
                getFinanceDashboardMetrics({ actor: currentUser.uid }),
                getOverviewMetrics({ actor: currentUser.uid }),
            ]);
            setMetrics({
                totalCustomers: crm.totalCustomers,
                activeLeads: crm.activeLeads,
                pendingTasks: task.pendingTasks,
                totalBalance: finance.totalBalance,
            });
        } catch (err: any) {
            console.error("Dashboard Metrics Error:", err);
            setMetricsError("Não foi possível carregar as métricas do dashboard.");
        } finally {
             setIsLoadingMetrics(false);
        }
    }
    
    if (currentUser) {
        fetchAllMetrics();
    }
  }, [currentUser, isPlanLoading, planError]);

  const dismissNotification = async () => {
    if (!organizationId) return;
    const orgDocRef = doc(db, 'organizations', organizationId);
    await updateDoc(orgDocRef, { lastSystemNotification: null });
    setSystemNotification(null);
  }

  if (isPlanLoading || !currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    )
  }
  
  if (planError === 'USER_DATA_NOT_FOUND') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center bg-card border border-destructive/50 rounded-2xl p-8 max-w-lg">
          <AlertTriangle className="mx-auto w-12 h-12 text-destructive mb-4" />
          <h3 className="mt-4 text-lg font-bold text-foreground">Sincronização da conta pendente</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Os dados da sua conta ainda não foram totalmente sincronizados. Isso pode levar alguns minutos após o cadastro ou pagamento. Por favor, recarregue a página ou tente novamente mais tarde.
          </p>
          <Button variant="outline" className="mt-6" onClick={() => window.location.reload()}>Recarregar a Página</Button>
        </div>
      </div>
    );
  }

  const isCrmLocked = !permissions?.qoroCrm;
  const isTaskLocked = !permissions?.qoroTask;
  const isFinanceLocked = !permissions?.qoroFinance;
  const isPulseLocked = !permissions?.qoroPulse;
  

  return (
    <div
      id="dashboard-content"
      className="app-content active max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
        {systemNotification && (
            <div className="bg-blue-900/50 border border-blue-700 text-blue-300 p-4 rounded-xl mb-8">
                <div className="flex justify-between items-start">
                    <div className="flex items-start">
                        <Bell className="w-5 h-5 mr-4 mt-1 flex-shrink-0 text-blue-400"/>
                        <div>
                            <h4 className="font-bold">Notificação sobre seu plano</h4>
                            <p className="text-sm mt-1">{systemNotification}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-blue-300 hover:bg-blue-800/50 rounded-full" onClick={dismissNotification}>
                        <X className="w-5 h-5"/>
                    </Button>
                </div>
            </div>
        )}

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
                <MetricCard title="Total de Clientes" value={String(metrics.totalCustomers)} icon={Users} isLoading={isLoadingMetrics} error={!!metricsError} colorClass='bg-crm-primary' isLocked={isCrmLocked} lockedText='Acesso bloqueado' />
                <MetricCard title="Clientes no Funil" value={String(metrics.activeLeads)} icon={TrendingUp} isLoading={isLoadingMetrics} error={!!metricsError} colorClass='bg-crm-primary' isLocked={isCrmLocked} lockedText='Acesso bloqueado'/>
                <MetricCard title="Tarefas Pendentes" value={String(metrics.pendingTasks)} icon={ListTodo} isLoading={isLoadingMetrics} error={!!metricsError} colorClass='bg-task-primary' isLocked={isTaskLocked} lockedText='Acesso bloqueado pelo administrador'/>
                <MetricCard 
                    title="Saldo em Contas" 
                    value={formatCurrency(metrics.totalBalance)} 
                    icon={DollarSign} 
                    isLoading={isLoadingMetrics}
                    error={!!metricsError} 
                    colorClass='bg-finance-primary'
                    isLocked={isFinanceLocked}
                    lockedText="Acesso bloqueado pelo administrador"
                />
            </div>
             {metricsError && (
                <div className="mt-4 p-4 bg-yellow-800/20 border-l-4 border-yellow-500 text-yellow-300 rounded-lg text-sm">
                   <p><span className="font-bold">Aviso:</span> {metricsError} A funcionalidade principal continua operacional.</p>
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
                isLocked={isCrmLocked}
                lockedText="Acesso bloqueado pelo administrador"
            />
             <AppCard 
                href="/dashboard/pulse"
                title="QoroPulse"
                icon={Activity}
                color="bg-pulse-primary"
                description="O sistema nervoso central da sua operação, revelando insights para otimização automática e inteligente."
                isLocked={isPulseLocked}
                lockedText={planId !== 'performance' ? 'Disponível no plano Performance' : 'Acesso bloqueado pelo administrador'}
            />
            <AppCard 
                href="/dashboard/task/visao-geral"
                title="QoroTask"
                icon={CheckSquare}
                color="bg-task-primary"
                description="Plataforma leve e poderosa de gestão de tarefas e produtividade para manter sua equipe alinhada e focada."
                isLocked={isTaskLocked}
                lockedText="Acesso bloqueado pelo administrador"
            />
            <AppCard 
                href="/dashboard/finance/transacoes"
                title="QoroFinance"
                icon={DollarSign}
                color="bg-finance-primary"
                description="Controle financeiro completo para seu negócio, com dashboards claros e relatórios simplificados."
                isLocked={isFinanceLocked}
                lockedText="Acesso bloqueado pelo administrador"
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
