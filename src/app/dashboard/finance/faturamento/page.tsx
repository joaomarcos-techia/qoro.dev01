
'use client';

import { useState } from 'react';
import { InvoiceTable } from '@/components/dashboard/finance/InvoiceTable';

export default function FaturamentoPage() {
  const [refreshCounter, setRefreshCounter] = useState(0);

  const handleAction = () => {
    setRefreshCounter(prev => prev + 1);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black">Faturamento</h1>
          <p className="text-gray-600">
            Gerencie suas faturas e controle os recebimentos.
          </p>
        </div>
        {/* O botão de criar fatura agora está na tabela de orçamentos */}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-neumorphism border border-gray-200">
        <InvoiceTable key={refreshCounter} />
      </div>
    </div>
  );
}
