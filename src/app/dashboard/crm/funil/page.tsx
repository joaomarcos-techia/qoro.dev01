
'use client';
import { useEffect, useMemo, useState } from 'react';
import { KanbanBoard } from '@/components/dashboard/crm/KanbanBoard';
import { SaleLeadProfile } from '@/ai/schemas';
import { listSaleLeads } from '@/ai/flows/crm-management';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2, ServerCrash } from 'lucide-react';

export default function FunilPage() {
  const [leads, setLeads] = useState<SaleLeadProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        // If the user signs out, stop loading and clear data.
        setIsLoading(false);
        setLeads([]);
        setError(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      setIsLoading(true);
      listSaleLeads({ actor: currentUser.uid })
        .then(setLeads)
        .catch((err) => {
          console.error(err);
          setError('Não foi possível carregar os leads do funil.');
        })
        .finally(() => setIsLoading(false));
    }
  }, [currentUser]);

  const columns = useMemo(() => {
    const stageOrder: SaleLeadProfile['stage'][] = [
      'prospect',
      'qualified',
      'proposal',
      'negotiation',
      'closed_won',
      'closed_lost',
    ];
    
    const stageNames: Record<SaleLeadProfile['stage'], string> = {
        prospect: 'Prospect',
        qualified: 'Qualificado',
        proposal: 'Proposta',
        negotiation: 'Negociação',
        closed_won: 'Ganha',
        closed_lost: 'Perdida'
    };

    const columns = stageOrder.map((stage) => ({
      id: stage,
      title: stageNames[stage],
      leads: leads.filter((lead) => lead.stage === stage),
    }));

    return columns;
  }, [leads]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-96">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="mt-4 text-gray-600">Carregando funil de vendas...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-red-50 rounded-lg p-8 text-center">
          <ServerCrash className="w-16 h-16 text-red-500 mb-4" />
          <h3 className="text-xl font-bold text-red-700">Ocorreu um erro</h3>
          <p className="text-gray-600 mt-2">{error}</p>
        </div>
      );
    }

    return <KanbanBoard columns={columns} />;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black">Funil de Vendas</h1>
          <p className="text-gray-600">
            Visualize e gerencie seu pipeline de negócios.
          </p>
        </div>
      </div>
      {renderContent()}
    </div>
  );
}
