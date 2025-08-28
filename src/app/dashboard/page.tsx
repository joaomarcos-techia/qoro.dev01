
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
import { getDashboardMetrics as getCrmMetrics } from '@/ai/flows/crm-management';
import { getDashboardMetrics as getTaskMetrics } from '@/ai/flows/task-management';
import { getDashboardMetrics as getFinanceMetrics } from '@/ai/flows/finance-management';
import { ErrorBoundary } from 'react-error-boundary';
import { UserAccessInfo } from '@/ai/schemas';


interface CrmMetrics {
    totalCustomers: number;
    totalLeads: number;
}

interface TaskMetrics {
    pendingTasks: number;
}

interface FinanceMetrics {
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
    isLocked,
    ctaText
}: { 
    href: string;
    title: string; 
    icon: React.ElementType; 
    color: string; 
    description: string;
    isLocked: boolean;
    ctaText: string;
}) => {
    const cardContent = (
      <div className={`group bg-card rounded-2xl border border-border ${isLocked ? 'cursor-not-allowed' : 'hover:border-primary/50 hover:-translate-y-1'} transition-all duration-200 flex flex-col h-full`}>
        <div className="p-6 flex-grow flex flex-col">
          <div className="flex items-center mb-4">
            <div className={`p-3 rounded-xl ${color} text-black mr-4 ${!isLocked && 'group-hover:scale-110'} transition-transform duration-300 shadow-lg`}>
              {isLocked ? <Lock className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
            </div>
            <div>
              <h4 className="text-lg font-bold text-foreground">{title}</h4>
            </div>
          </div>
          <p className={`text-sm ${isLocked ? 'text-muted-foreground/60' : 'text-muted-foreground'} mb-6 flex-grow`}>
            {description}
          </p>
          <div className={`group/button w-full ${isLocked ? 'bg-secondary/50 text-muted-foreground/70' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'} py-2.5 px-4 rounded-full transition-colors flex items-center justify-center text-sm font-medium`}>
            <span>{ctaText}</span>
            <ArrowRight className="w-4 h-4 ml-2 transform transition-transform duration-300 group-hover/button:translate-x-1" />
          </div>
        </div>
      </div>
    );

    return isLocked ? <Link href="/#precos">{cardContent}</Link> : <Link href={href}>{cardContent}</Link>;
}


function DashboardContent() {
  const [userAccess, setUserAccess] = useState<UserAccessInfo | null>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState({ access: true, metrics: true });
  const [errors, setErrors] = useState({ crm: false, task: false, finance: false });
  const [crmMetrics, setCrmMetrics] = useState<CrmMetrics>({ totalCustomers: 0, totalLeads: 0 });
  const [taskMetrics, setTaskMetrics] = useState<TaskMetrics>({ pendingTasks: 0 });
  const [financeMetrics, setFinanceMetrics] = useState<FinanceMetrics>({ totalBalance: 0 });


  const fetchUserAccess = useCallback(async (user: FirebaseUser) => {
    setIsLoading(prev => ({ ...prev, access: true }));
    try {
        const info = await getUserAccessInfo({ actor: user.uid });
        setUserAccess(info);
    } catch (e) {
        console.error("Failed to fetch user access info", e);
        setUserAccess(null);
    } finally {
      setIsLoading(prev => ({...prev, access: false}));
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      setCurrentUser(user);
      if (user) {
        fetchUserAccess(user);
      } else {
        setUserAccess(null);
        setIsLoading(prev => ({...prev, access: false}));
      }
    });
    return () => unsubscribe();
  }, [fetchUserAccess]);

  useEffect(() => {
    async function fetchMetrics() {
        if (!currentUser || !userAccess) return;

        setIsLoading(prev => ({...prev, metrics: true}));
        setErrors({ crm: false, task: false, finance: false });

        const promises = [];

        if (userAccess.permissions.qoroCrm) {
            promises.push(
                getCrmMetrics({ actor: currentUser.uid })
                    .then(data => ({ type: 'crm', data }))
                    .catch(err => { 
                        console.error("CRM Metrics Error:", err);
                        setErrors(e => ({...e, crm: true})); 
                        return { type: 'crm', data: null }; 
                    })
            );
        }

        if (userAccess.permissions.qoroTask) {
             promises.push(
                getTaskMetrics({ actor: currentUser.uid })
                    .then(data => ({ type: 'task', data }))
                    .catch(err => { 
                        console.error("Task Metrics Error:", err);
                        setErrors(e => ({...e, task: true})); 
                        return { type: 'task', data: null }; 
                    })
            );
        }

        if (userAccess.permissions.qoroFinance) {
            promises.push(
                getFinanceMetrics({ actor: currentUser.uid })
                    .then(data => ({ type: 'finance', data }))
                    .catch(err => { 
                        console.error("Finance Metrics Error:", err);
                        setErrors(e => ({...e, finance: true})); 
                        return { type: 'finance', data: null }; 
                    })
            );
        }
        
        const results = await Promise.all(promises);

        results.forEach(result => {
            if (result.data) {
                if (result.type === 'crm') setCrmMetrics({ totalCustomers: result.data.customers.length, totalLeads: result.data.leads.length });
                if (result.type === 'task') setTaskMetrics({ pendingTasks: result.data.pendingTasks });
                if (result.type === 'finance') setFinanceMetrics({ totalBalance: result.data.totalBalance });
            }
        });


        setIsLoading(prev => ({...prev, metrics: false}));
    }
    
    if (currentUser && userAccess) {
        fetchMetrics();
    }
  }, [currentUser, userAccess]);

  if (isLoading.access) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    )
  }
  
  const permissions = userAccess?.permissions;
  if (!permissions) {
    return (
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <AlertTriangle className="mx-auto w-12 h-12 text-destructive" />
            <h3 className="mt-4 text-lg font-medium text-foreground">Não foi possível carregar suas permissões.</h3>
            <p className="mt-2 text-sm text-muted-foreground">Tente recarregar a página.</p>
          </div>
        </div>
      );
  }


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
                {permissions.qoroCrm && (
                  <>
                    <MetricCard title="Total de Clientes" value={String(crmMetrics.totalCustomers)} icon={Users} isLoading={isLoading.metrics} error={errors.crm} colorClass='bg-crm-primary' />
                    <MetricCard title="Leads no Funil" value={String(crmMetrics.totalLeads)} icon={TrendingUp} isLoading={isLoading.metrics} error={errors.crm} colorClass='bg-crm-primary' />
                  </>
                )}
                {permissions.qoroTask && <MetricCard title="Tarefas Pendentes" value={String(taskMetrics.pendingTasks)} icon={ListTodo} isLoading={isLoading.metrics} error={errors.task} colorClass='bg-task-primary' />
                }
                {permissions.qoroFinance && <MetricCard title="Saldo em Contas" value={formatCurrency(financeMetrics.totalBalance)} icon={DollarSign} isLoading={isLoading.metrics} error={errors.finance} colorClass='bg-finance-primary' />
                }
            </div>
             {(errors.crm || errors.task || errors.finance) && (
                <div className="mt-4 p-4 bg-yellow-800/20 border-l-4 border-yellow-500 text-yellow-300 rounded-lg text-sm">
                   <p><span className="font-bold">Aviso:</span> Alguns dados não puderam ser carregados. Os desenvolvedores foram notificados. A funcionalidade principal continua operacional.</p>
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
                isLocked={!permissions.qoroCrm}
                ctaText={permissions.qoroCrm ? "Acessar" : "Permissão necessária"}
            />
             <AppCard 
                href="/dashboard/pulse"
                title="QoroPulse"
                icon={Activity}
                color="bg-pulse-primary"
                description="O sistema nervoso central da sua operação, revelando insights para otimização automática e inteligente."
                isLocked={!permissions.qoroPulse}
                ctaText={permissions.qoroPulse ? "Nova Conversa" : "Fazer Upgrade"}
            />
            <AppCard 
                href="/dashboard/task/tarefas"
                title="QoroTask"
                icon={CheckSquare}
                color="bg-task-primary"
                description="Plataforma leve e poderosa de gestão de tarefas e produtividade para manter sua equipe alinhada e focada."
                isLocked={!permissions.qoroTask}
                ctaText={permissions.qoroTask ? "Acessar" : "Permissão necessária"}
            />
            <AppCard 
                href="/dashboard/finance/relatorios"
                title="QoroFinance"
                icon={DollarSign}
                color="bg-finance-primary"
                description="Controle financeiro completo para seu negócio, com dashboards claros e relatórios simplificados."
                isLocked={!permissions.qoroFinance}
                ctaText={permissions.qoroFinance ? "Acessar" : "Permissão necessária"}
            />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
    return (
        <ErrorBoundary FallbackComponent={DashboardErrorFallback}>
            <DashboardContent />
        </ErrorBoundary>
    )
}
