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

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-neumorphism border border-gray-200 overflow-hidden hover:shadow-neumorphism-hover transition-all duration-300 hover:-translate-y-1">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white mr-4 shadow-neumorphism">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-black">QoroCRM</h4>
                  <p className="text-sm text-gray-600">
                    CRM ultra-simples com foco em WhatsApp e Email + automação
                  </p>
                </div>
              </div>
              <button className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center shadow-neumorphism hover:shadow-neumorphism-hover">
                Acessar QoroCRM
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-neumorphism border border-gray-200 overflow-hidden hover:shadow-neumorphism-hover transition-all duration-300 hover:-translate-y-1">
            <div className="h-2 bg-gradient-to-r from-purple-500 to-purple-600"></div>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white mr-4 shadow-neumorphism">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-black">QoroPulse</h4>
                  <p className="text-sm text-gray-600">
                    Sistema nervoso central inteligente para otimização
                    automática
                  </p>
                </div>
              </div>
              <button className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center shadow-neumorphism hover:shadow-neumorphism-hover">
                Acessar QoroPulse
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-neumorphism border border-gray-200 overflow-hidden hover:shadow-neumorphism-hover transition-all duration-300 hover:-translate-y-1">
            <div className="h-2 bg-gradient-to-r from-green-500 to-green-600"></div>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white mr-4 shadow-neumorphism">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-black">QoroTask</h4>
                  <p className="text-sm text-gray-600">
                    Plataforma leve de gestão de tarefas e produtividade
                  </p>
                </div>
              </div>
              <button className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center shadow-neumorphism hover:shadow-neumorphism-hover">
                Acessar QoroTask
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-neumorphism border border-gray-200 overflow-hidden hover:shadow-neumorphism-hover transition-all duration-300 hover:-translate-y-1">
            <div className="h-2 bg-gradient-to-r from-orange-500 to-orange-600"></div>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white mr-4 shadow-neumorphism">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-black">
                    QoroFinance
                  </h4>
                  <p className="text-sm text-gray-600">
                    Controle financeiro completo para seu negócio
                  </p>
                </div>
              </div>
              <button className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center shadow-neumorphism hover:shadow-neumorphism-hover">
                Acessar QoroFinance
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
