
'use client';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { CustomerKanbanBoard } from '@/components/dashboard/crm/CustomerKanbanBoard';
import { CustomerProfile } from '@/ai/schemas';
import { listCustomers, updateCustomerStatus } from '@/ai/flows/crm-management';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2, ServerCrash, AlertCircle, CheckCircle } from 'lucide-react';

export default function FunilPage() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
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
        setCustomers([]);
        setError(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      setIsLoading(true);
      setError(null);
      listCustomers({ actor: currentUser.uid })
        .then(setCustomers)
        .catch((err) => {
          console.error(err);
          setError('Não foi possível carregar os clientes do funil.');
        })
        .finally(() => setIsLoading(false));
    } else if (!auth.currentUser) {
      setIsLoading(false);
    }
  }, [currentUser]);
  
  const showTemporaryFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => {
        setFeedback(null);
    }, 5000);
  };

  const handleMoveCustomer = (customerId: string, newStatus: CustomerProfile['status']) => {
    startTransition(async () => {
        setFeedback(null);
        if (!currentUser) return;
        
        const originalCustomers = [...customers];
        
        // Optimistic UI update
        if (newStatus === 'archived') {
            setCustomers(prev => prev.filter(c => c.id !== customerId));
        } else {
            setCustomers(prev => prev.map(c => c.id === customerId ? {...c, status: newStatus} : c));
        }

        try {
            await updateCustomerStatus({ customerId, status: newStatus, actor: currentUser.uid });
            if (newStatus === 'archived') {
                showTemporaryFeedback("Cliente arquivado e removido do funil.");
            }
        } catch (err) {
            console.error("Failed to move customer", err);
            showTemporaryFeedback("Erro ao mover cliente.", "error");
            setCustomers(originalCustomers); // Revert on failure
        }
    });
  }

  const stageOrder: CustomerProfile['status'][] = [
    'new',
    'initial_contact',
    'qualification',
    'proposal',
    'negotiation',
    'won',
    'lost'
  ];
  
  const stageNames: Record<CustomerProfile['status'], string> = {
      new: 'Novo / lead recebido',
      initial_contact: 'Contato inicial',
      qualification: 'Qualificação',
      proposal: 'Proposta',
      negotiation: 'Negociação',
      won: 'Ganho (fechamento)',
      lost: 'Perdido',
      archived: 'Arquivado'
  };
    
  const columns = useMemo(() => {
    return stageOrder.map((stage) => ({
      id: stage,
      title: stageNames[stage],
      customers: customers.filter((customer) => customer.status === stage),
    }));
  }, [customers, stageOrder, stageNames]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="mt-4 text-muted-foreground">Carregando funil de clientes...</p>
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

    return <CustomerKanbanBoard columns={columns} onMoveCustomer={handleMoveCustomer} />;
  };

  return (
    <div className='h-[calc(100vh-120px)] flex flex-col'>
      <div className="flex-shrink-0">
        <div className="flex justify-between items-center mb-6">
            <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Funil de clientes</h1>
            <p className="text-muted-foreground mt-1">
                Visualize e gerencie a jornada dos seus clientes pelas fases de negociação.
            </p>
            </div>
             {isPending && <Loader2 className="w-6 h-6 text-primary animate-spin" />}
        </div>
         {feedback && (
            <div className={`mb-4 p-3 rounded-lg flex items-center text-sm ${feedback.type === 'success' ? 'bg-green-800/20 text-green-300 border border-green-500/30' : 'bg-red-800/20 text-red-300 border border-red-500/30'}`}>
                {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3" /> : <AlertCircle className="w-5 h-5 mr-3" />}
                <span>{feedback.message}</span>
            </div>
        )}
      </div>
      <div className="flex-grow overflow-x-auto">
        {renderContent()}
      </div>
    </div>
  );
}
