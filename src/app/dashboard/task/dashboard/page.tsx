
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QoroTask | Dashboard',
};

export default function DashboardTaskPage() {
    return (
      <div>
        <h1 className="text-3xl font-bold text-black mb-4">Dashboard de Tarefas</h1>
        <p className="text-gray-600">
          Acompanhe a produtividade da sua equipe e o andamento dos projetos.
        </p>
      </div>
    );
  }
