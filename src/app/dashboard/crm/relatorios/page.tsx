
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QoroCRM | Relatórios',
};

export default function RelatoriosPage() {
    return (
      <div>
        <h1 className="text-3xl font-bold text-black mb-4">Relatórios do CRM</h1>
        <p className="text-gray-600">
          Analise o desempenho de suas vendas, clientes e atividades.
        </p>
      </div>
    );
  }
