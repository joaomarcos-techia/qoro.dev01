
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
  ListTodo
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { getDashboardMetrics as getCrmMetrics } from '@/ai/flows/crm-management';
import { getDashboardMetrics as getTaskMetrics } from '@/ai/flows/task-management';

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

const MetricCard = ({ title, value, icon: Icon, isLoading }: { title: string, value: number | string, icon: React.ElementType, isLoading: boolean }) => (
    <div className="bg-white p-6 rounded-2xl shadow-neumorphism border border-gray-100 flex items-center">
        <div className="p-3 rounded-xl bg-primary text-white mr-4 shadow-neumorphism">
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-gray-600 text-sm font-medium">{title}</p>
            {isLoading ? (
                 <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            ) : (
                <p className="text-2xl font-bold text-black">{value}</p>
            )}
        </div>
    </div>
);

export default function DashboardPage() {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState({ permissions: true, metrics: true });
  const [crmMetrics, setCrmMetrics] = useState<CrmMetrics>({ totalCustomers: 0, totalLeads: 0 });
  const [taskMetrics, setTaskMetrics] = useState<TaskMetrics>({ pendingTasks: 0 });


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
        setCurrentUser(user);
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setPermissions(userData.permissions || { qoroCrm: false, qoroPulse: false, qoroTask: false, qoroFinance: false });
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
        if (!currentUser) return;

        setIsLoading(prev => ({...prev, metrics: true}));

        try {
            // Fetch CRM metrics only if the user has permission
            const crmPromise = permissions?.qoroCrm 
                ? getCrmMetrics({ actor: currentUser.uid }) 
                : Promise.resolve({ totalCustomers: 0, totalLeads: 0, conversionRate: 0, totalRevenueWon: 0 });

            // Fetch Task metrics only if the user has permission
            const taskPromise = permissions?.qoroTask 
                ? getTaskMetrics({ actor: currentUser.uid }) 
                : Promise.resolve({ totalTasks: 0, completedTasks: 0, inProgressTasks: 0, pendingTasks: 0 });
            
            const [crmData, taskData] = await Promise.all([
                crmPromise,
                taskPromise
            ]);

            setCrmMetrics({ totalCustomers: crmData.totalCustomers, totalLeads: crmData.totalLeads });
            setTaskMetrics({ pendingTasks: taskData.pendingTasks });

        } catch (error) {
            console.error("Failed to fetch dashboard metrics:", error);
            // Optionally, set an error state to show in the UI
        } finally {
            setIsLoading(prev => ({...prev, metrics: false}));
        }
    }
    
    // We fetch metrics only when permissions are loaded and resolved.
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
        <h2 className="text-3xl font-bold text-black mb-2">
          Bem-vindo à Qoro!
        </h2>
        <p className="text-gray-600">
          Gerencie toda a sua empresa em uma única plataforma integrada
        </p>
      </div>

       {/* Metrics Section */}
       <div className="mb-12">
            <h3 className="text-xl font-bold text-black mb-6">Métricas e Insights Rápidos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Total de Clientes" value={crmMetrics.totalCustomers} icon={Users} isLoading={isLoading.metrics} />
                <MetricCard title="Leads no Funil" value={crmMetrics.totalLeads} icon={TrendingUp} isLoading={isLoading.metrics} />
                <MetricCard title="Tarefas Pendentes" value={taskMetrics.pendingTasks} icon={ListTodo} isLoading={isLoading.metrics} />
                <MetricCard title="Saldo Atual" value="Carregando..." icon={DollarSign} isLoading={isLoading.metrics} />
            </div>
        </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-black">Seus Aplicativos Qoro</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card QoroCRM */}
          {permissions?.qoroCrm && (
            <Link href="/dashboard/crm/dashboard">
              <div className="group bg-white rounded-xl shadow-neumorphism hover:shadow-neumorphism-hover hover:-translate-y-2 transition-all duration-300 flex flex-col h-full">
                <div className="h-2 bg-blue-500 rounded-t-xl"></div>
                <div className="p-6 flex-grow flex flex-col">
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-xl bg-blue-500 text-white mr-4 group-hover:scale-110 transition-transform duration-300 shadow-neumorphism">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-black">QoroCRM</h4>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-6 flex-grow">
                    CRM com foco em gestão de funil de vendas e conversão para maximizar seus lucros.
                  </p>
                  <div className="group/button w-full bg-black text-white py-2.5 px-4 rounded-full hover:bg-gray-800 transition-colors flex items-center justify-center text-sm font-medium">
                    <span>Acessar</span>
                    <ArrowRight className="w-4 h-4 ml-2 transform transition-transform duration-300 group-hover/button:translate-x-1" />
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Card QoroPulse */}
          {permissions?.qoroPulse && (
            <Link href="/dashboard/pulse">
              <div className="group bg-white rounded-xl shadow-neumorphism hover:shadow-neumorphism-hover hover:-translate-y-2 transition-all duration-300 flex flex-col h-full">
                <div className="h-2 bg-purple-500 rounded-t-xl"></div>
                <div className="p-6 flex-grow flex flex-col">
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-xl bg-purple-500 text-white mr-4 group-hover:scale-110 transition-transform duration-300 shadow-neumorphism">
                      <Activity className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-black">QoroPulse</h4>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-6 flex-grow">
                    O sistema nervoso central da sua operação, revelando insights para otimização automática e inteligente.
                  </p>
                  <div className="group/button w-full bg-black text-white py-2.5 px-4 rounded-full hover:bg-gray-800 transition-colors flex items-center justify-center text-sm font-medium">
                    <span>Acessar</span>
                    <ArrowRight className="w-4 h-4 ml-2 transform transition-transform duration-300 group-hover/button:translate-x-1" />
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Card QoroTask */}
          {permissions?.qoroTask && (
             <Link href="/dashboard/task/tarefas">
              <div className="group bg-white rounded-xl shadow-neumorphism hover:shadow-neumorphism-hover hover:-translate-y-2 transition-all duration-300 flex flex-col h-full">
                <div className="h-2 bg-green-500 rounded-t-xl"></div>
                <div className="p-6 flex-grow flex flex-col">
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-xl bg-green-500 text-white mr-4 group-hover:scale-110 transition-transform duration-300 shadow-neumorphism">
                      <CheckSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-black">QoroTask</h4>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-6 flex-grow">
                    Plataforma leve e poderosa de gestão de tarefas e produtividade para manter sua equipe alinhada e focada.
                  </p>
                   <div className="group/button w-full bg-black text-white py-2.5 px-4 rounded-full hover:bg-gray-800 transition-colors flex items-center justify-center text-sm font-medium">
                    <span>Acessar</span>
                    <ArrowRight className="w-4 h-4 ml-2 transform transition-transform duration-300 group-hover/button:translate-x-1" />
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Card QoroFinance */}
          {permissions?.qoroFinance && (
             <Link href="/dashboard/finance/visao-geral">
              <div className="group bg-white rounded-xl shadow-neumorphism hover:shadow-neumorphism-hover hover:-translate-y-2 transition-all duration-300 flex flex-col h-full">
                <div className="h-2 bg-orange-500 rounded-t-xl"></div>
                <div className="p-6 flex-grow flex flex-col">
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-xl bg-orange-500 text-white mr-4 group-hover:scale-110 transition-transform duration-300 shadow-neumorphism">
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-black">
                        QoroFinance
                      </h4>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-6 flex-grow">
                    Controle financeiro completo para seu negócio, com dashboards claros e relatórios simplificados.
                  </p>
                  <div className="group/button w-full bg-black text-white py-2.5 px-4 rounded-full hover:bg-gray-800 transition-colors flex items-center justify-center text-sm font-medium">
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
