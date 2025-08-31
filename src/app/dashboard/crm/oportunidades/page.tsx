
'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { PlusCircle, Target, Loader2, ServerCrash, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SaleLeadForm } from '@/components/dashboard/crm/SaleLeadForm';
import { KanbanBoard } from '@/components/dashboard/crm/KanbanBoard';
import { SaleLeadProfile } from '@/ai/schemas';
import { listSaleLeads, updateSaleLeadStage } from '@/ai/flows/crm-management';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function OportunidadesPage() {
  const [leads, setLeads] = useState<SaleLeadProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{type: 'error' | 'success', message: string} | null>(null);
  const [isPending, startTransition] = useTransition();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<SaleLeadProfile | null>(null);

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

  const fetchLeads = () => {
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
  };

  useEffect(() => {
    fetchLeads();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);
  
  const showTemporaryFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };
  
  const handleModalOpenChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) setSelectedLead(null);
  }

  const handleAction = () => {
    handleModalOpenChange(false);
    fetchLeads(); // Refresh data after action
  };

  const handleAdd = () => {
    setSelectedLead(null);
    setIsModalOpen(true);
  }

  const handleMoveLead = (leadId: string, newStage: SaleLeadProfile['stage']) => {
    startTransition(async () => {
        if (!currentUser) return;
        
        const originalLeads = [...leads];
        
        // Optimistic UI update
        setLeads(prev => prev.map(l => l.id === leadId ? {...l, stage: newStage} : l));

        try {
            await updateSaleLeadStage({ leadId, stage: newStage, actor: currentUser.uid });
        } catch (err) {
            console.error("Failed to move lead", err);
            showTemporaryFeedback("Erro ao mover a oportunidade.", "error");
            setLeads(originalLeads); // Revert on failure
        }
    });
  }

  const stageOrder: SaleLeadProfile['stage'][] = ['new', 'initial_contact', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
  
  const stageNames: Record<string, string> = {
      new: 'Novo Contato',
      initial_contact: 'Contato Inicial',
      qualified: 'Qualificação',
      proposal: 'Proposta',
      negotiation: 'Negociação',
      won: 'Ganho',
      lost: 'Perdido',
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
                  Acompanhe suas negociações em andamento, do primeiro contato ao fechamento.
              </p>
            </div>
            <div className="flex items-center gap-4">
                 {isPending && <Loader2 className="w-6 h-6 text-primary animate-spin" />}
                 <Dialog open={isModalOpen} onOpenChange={handleModalOpenChange}>
                    <DialogTrigger asChild>
                        <Button 
                        onClick={handleAdd}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-all duration-300 border border-transparent hover:border-primary/50 flex items-center justify-center font-semibold"
                        >
                        <PlusCircle className="mr-2 w-5 h-5" />
                        Criar Oportunidade
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px]">
                        <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-foreground">{selectedLead ? 'Editar Oportunidade' : 'Criar Nova Oportunidade'}</DialogTitle>
                        <DialogDescription>
                            {selectedLead ? 'Altere as informações da negociação abaixo.' : 'Preencha as informações da negociação para acompanhá-la no funil.'}
                        </DialogDescription>
                        </DialogHeader>
                        <SaleLeadForm onAction={handleAction} saleLead={selectedLead}/>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
         {feedback && (
            <div className={`mb-4 p-3 rounded-lg flex items-center text-sm ${feedback.type === 'success' ? 'bg-green-800/20 text-green-300 border border-green-500/30' : 'bg-red-800/20 text-red-300 border border-red-500/30'}`}>
                {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3" /> : <AlertCircle className="w-5 h-5 mr-3" />}
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
