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
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { getDashboardMetrics as getCrmMetrics } from '@/ai/flows/crm-management';
import { getDashboardMetrics as getTaskMetrics } from '@/ai/flows/task-management';
import { getDashboardMetrics as getFinanceMetrics } from '@/ai/flows/finance-management';
import { ErrorBoundary } from 'react-error-boundary';


interface UserPermissions {
  qoroCrm: boolean;
  qoroPulse: boolean;
  qoroTask: boolean;
  qoroFinance: boolean;
}

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
    <div className="bg-secondary/60 p-6 rounded-2xl shadow-lg border border-border/80 flex items-center backdrop-blur-sm transition-all duration-300 hover:border-primary/60 hover:-translate-y-1">
        <div className={`p-3 rounded-xl ${error ? 'bg-yellow-500' : colorClass} text-black mr-4 shadow-lg shadow-primary/20`}>
            {error ? <AlertTriangle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
        </div>
        <div>
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            {isLoading ? (
                 <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
            ) : (
                <p className="text-2xl font-bold text-white">{error ? 'Erro' : value}</p>
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


function DashboardContent() {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState({ permissions: true, metrics: true });
  const [errors, setErrors] = useState({ crm: false, task: false, finance: false });
  const [crmMetrics, setCrmMetrics] = useState<CrmMetrics>({ totalCustomers: 0, totalLeads: 0 });
  const [taskMetrics, setTaskMetrics] = useState<TaskMetrics>({ pendingTasks: 0 });
  const [financeMetrics, setFinanceMetrics] = useState<FinanceMetrics>({ totalBalance: 0 });


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
        setCurrentUser(user);
      if (user) {
        try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setPermissions(userData.permissions || { qoroCrm: false, qoroPulse: false, qoroTask: false, qoroFinance: false });
            }
        } catch (e) {
            console.error("Failed to fetch user permissions", e)
            setPermissions(null)
        }
      } else {
        setPermissions(null);
      }
      setIsLoading(prev => ({...prev, permissions: false}));
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchMetrics() {
        if (!currentUser || !permissions) return;

        setIsLoading(prev => ({...prev, metrics: true}));
        setErrors({ crm: false, task: false, finance: false });

        const promises = [];

        if (permissions.qoroCrm) {
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

        if (permissions.qoroTask) {
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

        if (permissions.qoroFinance) {
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
    
    if (currentUser && permissions) {
        fetchMetrics();
    }
  }, [currentUser, permissions]);

  if (isLoading.permissions) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div
      id="dashboard-content"
      className="app-content active max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-white mb-2">
          Bem-vindo à Qoro!
        </h2>
        <p className="text-muted-foreground">
          Gerencie toda a sua empresa em uma única plataforma integrada
        </p>
      </div>
      
      <ErrorBoundary FallbackComponent={DashboardErrorFallback}>
       <div className="mb-12">
            <h3 className="text-xl font-bold text-white mb-6">Métricas e Insights Rápidos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {permissions?.qoroCrm && (
                  <>
                    <MetricCard title="Total de Clientes" value={String(crmMetrics.totalCustomers)} icon={Users} isLoading={isLoading.metrics} error={errors.crm} colorClass="bg-crm-primary" />
                    <MetricCard title="Leads no Funil" value={String(crmMetrics.totalLeads)} icon={TrendingUp} isLoading={isLoading.metrics} error={errors.crm} colorClass="bg-crm-primary" />
                  </>
                )}
                {permissions?.qoroTask && <MetricCard title="Tarefas Pendentes" value={String(taskMetrics.pendingTasks)} icon={ListTodo} isLoading={isLoading.metrics} error={errors.task} colorClass="bg-task-primary" />}
                {permissions?.qoroFinance && <MetricCard title="Saldo em Contas" value={formatCurrency(financeMetrics.totalBalance)} icon={DollarSign} isLoading={isLoading.metrics} error={errors.finance} colorClass="bg-finance-primary" />}
            </div>
             {(errors.crm || errors.task || errors.finance) && (
                <div className="mt-4 p-4 bg-yellow-900/50 border-l-4 border-yellow-500 text-yellow-300 rounded-lg text-sm">
                   <p><span className="font-bold">Aviso:</span> Alguns dados não puderam ser carregados. Os desenvolvedores foram notificados. A funcionalidade principal continua operacional.</p>
                </div>
            )}
        </div>
      </ErrorBoundary>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Seus Aplicativos Qoro</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {permissions?.qoroCrm && (
            <Link href="/dashboard/crm/dashboard">
              <div className="group bg-secondary rounded-2xl border border-border hover:border-crm-primary/50 transition-all duration-300 flex flex-col h-full shadow-lg hover:shadow-crm-primary/10 hover:-translate-y-1">
                <div className="h-1 bg-crm-primary rounded-t-xl"></div>
                <div className="p-6 flex-grow flex flex-col">
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-xl bg-crm-primary text-black mr-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-crm-primary/20">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">QoroCRM</h4>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6 flex-grow">
                    CRM com foco em gestão de funil de vendas e conversão para maximizar seus lucros.
                  </p>
                  <div className="group/button w-full bg-white/10 text-white py-2.5 px-4 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center text-sm font-medium">
                    <span>Acessar</span>
                    <ArrowRight className="w-4 h-4 ml-2 transform transition-transform duration-300 group-hover/button:translate-x-1" />
                  </div>
                </div>
              </div>
            </Link>
          )}

          {permissions?.qoroPulse && (
            <Link href="/dashboard/pulse">
              <div className="group bg-secondary rounded-2xl border border-border hover:border-pulse-primary/50 transition-all duration-300 flex flex-col h-full shadow-lg hover:shadow-pulse-primary/10 hover:-translate-y-1">
                <div className="h-1 bg-pulse-primary rounded-t-xl"></div>
                <div className="p-6 flex-grow flex flex-col">
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-xl bg-pulse-primary text-black mr-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-pulse-primary/20">
                      <Activity className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">QoroPulse</h4>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6 flex-grow">
                    O sistema nervoso central da sua operação, revelando insights para otimização automática e inteligente.
                  </p>
                  <div className="group/button w-full bg-white/10 text-white py-2.5 px-4 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center text-sm font-medium">
                    <span>Acessar</span>
                    <ArrowRight className="w-4 h-4 ml-2 transform transition-transform duration-300 group-hover/button:translate-x-1" />
                  </div>
                </div>
              </div>
            </Link>
          )}

          {permissions?.qoroTask && (
             <Link href="/dashboard/task/tarefas">
              <div className="group bg-secondary rounded-2xl border border-border hover:border-task-primary/50 transition-all duration-300 flex flex-col h-full shadow-lg hover:shadow-task-primary/10 hover:-translate-y-1">
                <div className="h-1 bg-task-primary rounded-t-xl"></div>
                <div className="p-6 flex-grow flex flex-col">
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-xl bg-task-primary text-black mr-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-task-primary/20">
                      <CheckSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">QoroTask</h4>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6 flex-grow">
                    Plataforma leve e poderosa de gestão de tarefas e produtividade para manter sua equipe alinhada e focada.
                  </p>
                   <div className="group/button w-full bg-white/10 text-white py-2.5 px-4 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center text-sm font-medium">
                    <span>Acessar</span>
                    <ArrowRight className="w-4 h-4 ml-2 transform transition-transform duration-300 group-hover/button:translate-x-1" />
                  </div>
                </div>
              </div>
            </Link>
          )}

          {permissions?.qoroFinance && (
             <Link href="/dashboard/finance/visao-geral">
              <div className="group bg-secondary rounded-2xl border border-border hover:border-finance-primary/50 transition-all duration-300 flex flex-col h-full shadow-lg hover:shadow-finance-primary/10 hover:-translate-y-1">
                <div className="h-1 bg-finance-primary rounded-t-xl"></div>
                <div className="p-6 flex-grow flex flex-col">
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-xl bg-finance-primary text-black mr-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-finance-primary/20">
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">
                        QoroFinance
                      </h4>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6 flex-grow">
                    Controle financeiro completo para seu negócio, com dashboards claros e relatórios simplificados.
                  </p>
                  <div className="group/button w-full bg-white/10 text-white py-2.5 px-4 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center text-sm font-medium">
                    <span>Acessar</span>
                    <ArrowRight className="w-4 h-4 ml-2 transform transition-transform duration-300 group-hover/button:translate-x-1" />
                  </div>
                </div>
              </div>
            </Link>
          )}
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
```