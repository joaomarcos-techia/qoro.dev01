
'use client';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  CheckSquare,
  DollarSign,
  Users,
  Loader2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserPermissions {
  qoroCrm: boolean;
  qoroPulse: boolean;
  qoroTask: boolean;
  qoroFinance: boolean;
}

export default function DashboardPage() {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
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
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
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
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-black mb-2">
          Bem-vindo à Qoro!
        </h2>
        <p className="text-gray-600">
          Gerencie toda a sua empresa em uma única plataforma integrada
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-black">Seus Aplicativos Qoro</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card QoroCRM */}
          {permissions?.qoroCrm && (
            <Link href="/dashboard/crm/clientes">
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
                <button className="group/button w-full bg-black text-white py-2.5 px-4 rounded-full hover:bg-gray-800 transition-colors flex items-center justify-center text-sm font-medium">
                  <span>Acessar</span>
                  <ArrowRight className="w-4 h-4 ml-2 transform transition-transform duration-300 group-hover/button:translate-x-1" />
                </button>
              </div>
            </div>
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

    