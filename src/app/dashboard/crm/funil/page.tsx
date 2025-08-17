
'use client';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { KanbanBoard } from '@/components/dashboard/crm/KanbanBoard';
import { SaleLeadProfile } from '@/ai/schemas';
import { listSaleLeads, updateSaleLeadStage } from '@/ai/flows/crm-management';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2, ServerCrash, AlertCircle } from 'lucide-react';

export default function FunilPage() {
  const [leads, setLeads] = useState<SaleLeadProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{type: 'error' | 'success', message: string} | null>(null);

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
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
      setError(null);
      listSaleLeads({ actor: currentUser.uid })
        .then(setLeads)
        .catch((err) => {
          console.error(err);
          setError('Não foi possível carregar as oportunidades do funil.');
        })
        .finally(() => setIsLoading(false));
    } else if (!auth.currentUser) {
      setIsLoading(false);
    }
  }, [currentUser]);

  const handleMoveLead = (leadId: string, newStage: SaleLeadProfile['stage']) => {
    startTransition(async () => {
        setFeedback(null);
        if (!currentUser) return;
        
        const originalLeads = [...leads];
        
        // Optimistic UI update
        setLeads(prev => prev.map(l => l.id === leadId ? {...l, stage: newStage} : l));

        try {
            await updateSaleLeadStage({ leadId, stage: newStage, actor: currentUser.uid });
        } catch (err) {
            console.error("Failed to move lead", err);
            setFeedback({ type: 'error', message: "Erro ao mover oportunidade." });
            setLeads(originalLeads); // Revert on failure
        }
    });
  }

  const stageOrder: SaleLeadProfile['stage'][] = [
    'new',
    'initial_contact',
    'qualified',
    'proposal',
    'negotiation',
    'won',
    'lost'
  ];
  
  const stageNames: Record<string, string> = {
      new: 'Novo / Lead Recebido',
      initial_contact: 'Contato Inicial',
      qualified: 'Qualificação / Diagnóstico',
      proposal: 'Apresentação / Proposta',
      negotiation: 'Negociação',
      won: 'Ganho (Fechamento)',
      lost: 'Perdido'
  };
    
  const columns = useMemo(() => {
    return stageOrder.map((stage) => ({
      id: stage,
      title: stageNames[stage],
      leads: leads.filter((lead) => lead.stage === stage),
    }));
  }, [leads]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="mt-4 text-muted-foreground">Carregando funil de oportunidades...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] bg-destructive/10 rounded-lg p-8 text-center border border-destructive">
          <ServerCrash className="w-16 h-16 text-destructive mb-4" />
          <h3 className="text-xl font-bold text-destructive">Ocorreu um erro</h3>
          <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      );
    }

    return <KanbanBoard columns={columns} onMoveLead={handleMoveLead} />;
  };

  return (
    <div className='h-[calc(100vh-120px)] flex flex-col'>
      <div className="flex-shrink-0">
        <div className="flex justify-between items-center mb-6">
            <div>
            <h1 className="text-4xl font-bold text-foreground">Funil de Vendas</h1>
            <p className="text-muted-foreground">
                Visualize e gerencie a jornada das suas oportunidades pelas fases de negociação.
            </p>
            </div>
             {isPending && <Loader2 className="w-6 h-6 text-primary animate-spin" />}
        </div>
         {feedback && (
            <div className={`mb-4 p-3 rounded-lg flex items-center text-sm ${feedback.type === 'success' ? 'bg-green-800/20 text-green-300 border border-green-500/30' : 'bg-red-800/20 text-red-300 border border-red-500/30'}`}>
                <AlertCircle className="w-5 h-5 mr-3" />
                <span>{feedback.message}</span>
            </div>
        )}
      </div>
      <div className="flex-grow overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}
