'use client';
import {
  Activity,
  ArrowRight,
  CheckSquare,
  DollarSign,
  Users,
} from 'lucide-react';

export default function DashboardPage() {
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card QoroCRM */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
            <div className="h-2 bg-blue-500"></div>
            <div className="p-6 flex-grow flex flex-col">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-md bg-blue-500 text-white mr-4">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-black">QoroCRM</h4>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4 flex-grow">
                CRM ultra-simples com foco em WhatsApp e Email + automação
              </p>
              <button className="w-full bg-black text-white py-2 rounded-full hover:bg-gray-800 transition-colors flex items-center justify-center text-sm font-medium">
                Acessar
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>

          {/* Card QoroPulse */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
            <div className="h-2 bg-purple-500"></div>
            <div className="p-6 flex-grow flex flex-col">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-md bg-purple-500 text-white mr-4">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-black">QoroPulse</h4>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4 flex-grow">
                Sistema nervoso central inteligente para otimização automática
              </p>
              <button className="w-full bg-black text-white py-2 rounded-full hover:bg-gray-800 transition-colors flex items-center justify-center text-sm font-medium">
                Acessar
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>

          {/* Card QoroTask */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
            <div className="h-2 bg-green-500"></div>
            <div className="p-6 flex-grow flex flex-col">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-md bg-green-500 text-white mr-4">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-black">QoroTask</h4>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4 flex-grow">
                Plataforma leve de gestão de tarefas e produtividade
              </p>
              <button className="w-full bg-black text-white py-2 rounded-full hover:bg-gray-800 transition-colors flex items-center justify-center text-sm font-medium">
                Acessar
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>

          {/* Card QoroFinance */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
            <div className="h-2 bg-orange-500"></div>
            <div className="p-6 flex-grow flex flex-col">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-md bg-orange-500 text-white mr-4">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-black">
                    QoroFinance
                  </h4>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4 flex-grow">
                Controle financeiro completo para seu negócio
              </p>
              <button className="w-full bg-black text-white py-2 rounded-full hover:bg-gray-800 transition-colors flex items-center justify-center text-sm font-medium">
                Acessar
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
