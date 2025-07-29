
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card QoroCRM */}
          <div className="group bg-white rounded-xl shadow-neumorphism hover:shadow-neumorphism-hover hover:-translate-y-2 transition-all duration-300 flex flex-col">
            <div className="h-2 bg-blue-500 rounded-t-xl"></div>
            <div className="p-6 flex-grow flex flex-col">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-xl bg-white text-blue-500 mr-4 group-hover:scale-110 transition-transform duration-300 shadow-neumorphism">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-black">QoroCRM</h4>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-6 flex-grow">
                CRM ultra-simples com foco em WhatsApp e Email + automação para um relacionamento impecável com o cliente.
              </p>
              <button className="group/button w-full bg-black text-white py-2.5 px-4 rounded-full hover:bg-gray-800 transition-colors flex items-center justify-center text-sm font-medium">
                <span>Acessar</span>
                <ArrowRight className="w-4 h-4 ml-2 transform transition-transform duration-300 group-hover/button:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Card QoroPulse */}
          <div className="group bg-white rounded-xl shadow-neumorphism hover:shadow-neumorphism-hover hover:-translate-y-2 transition-all duration-300 flex flex-col">
            <div className="h-2 bg-purple-500 rounded-t-xl"></div>
            <div className="p-6 flex-grow flex flex-col">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-xl bg-white text-purple-500 mr-4 group-hover:scale-110 transition-transform duration-300 shadow-neumorphism">
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

          {/* Card QoroTask */}
          <div className="group bg-white rounded-xl shadow-neumorphism hover:shadow-neumorphism-hover hover:-translate-y-2 transition-all duration-300 flex flex-col">
            <div className="h-2 bg-green-500 rounded-t-xl"></div>
            <div className="p-6 flex-grow flex flex-col">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-xl bg-white text-green-500 mr-4 group-hover:scale-110 transition-transform duration-300 shadow-neumorphism">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-black">QoroTask</h4>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-6 flex-grow">
                Plataforma leve e poderosa de gestão de tarefas e produtividade para manter sua equipe alinhada e focada.
              </p>
              <button className="group/button w-full bg-black text-white py-2.5 px-4 rounded-full hover:bg-gray-800 transition-colors flex items-center justify-center text-sm font-medium">
                <span>Acessar</span>
                <ArrowRight className="w-4 h-4 ml-2 transform transition-transform duration-300 group-hover/button:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Card QoroFinance */}
          <div className="group bg-white rounded-xl shadow-neumorphism hover:shadow-neumorphism-hover hover:-translate-y-2 transition-all duration-300 flex flex-col">
            <div className="h-2 bg-orange-500 rounded-t-xl"></div>
            <div className="p-6 flex-grow flex flex-col">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-xl bg-white text-orange-500 mr-4 group-hover:scale-110 transition-transform duration-300 shadow-neumorphism">
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
              <button className="group/button w-full bg-black text-white py-2.5 px-4 rounded-full hover:bg-gray-800 transition-colors flex items-center justify-center text-sm font-medium">
                <span>Acessar</span>
                <ArrowRight className="w-4 h-4 ml-2 transform transition-transform duration-300 group-hover/button:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
