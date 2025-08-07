'use client';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { KanbanBoard } from '@/components/dashboard/crm/KanbanBoard';
import { CustomerProfile } from '@/ai/schemas';
import { listCustomers, updateCustomerStatus, deleteCustomer } from '@/ai/flows/crm-management';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2, ServerCrash, AlertCircle } from 'lucide-react';

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

  const handleMoveCustomer = (customerId: string, newStatus: CustomerProfile['status']) => {
    startTransition(async () => {
        setFeedback(null);
        if (!currentUser) return;
        
        const originalCustomers = [...customers];
        
        // Optimistic UI update
        setCustomers(prev => prev.map(c => c.id === customerId ? {...c, status: newStatus} : c));

        try {
            await updateCustomerStatus({ customerId, status: newStatus, actor: currentUser.uid });
        } catch (err) {
            console.error("Failed to move customer", err);
            setFeedback({ type: 'error', message: "Erro ao mover cliente." });
            setCustomers(originalCustomers); // Revert on failure
        }
    });
  }

  const handleDeleteCustomer = (customerId: string) => {
    startTransition(async () => {
        setFeedback(null);
        if (!currentUser) return;

        const originalCustomers = [...customers];
        
        // Optimistic UI update
        setCustomers(prev => prev.filter(c => c.id !== customerId));
        
        try {
            await deleteCustomer({ customerId, actor: currentUser.uid });
             setFeedback({ type: 'success', message: "Cliente excluído com sucesso." });
        } catch (err) {
            console.error("Failed to delete customer", err);
            setFeedback({ type: 'error', message: "Erro ao excluir cliente." });
            setCustomers(originalCustomers); // Revert on failure
        }
    });
  };

  const stageOrder: CustomerProfile['status'][] = [
    'new',
    'initial_contact',
    'qualification',
    'proposal',
    'negotiation',
    'won',
    'lost'
  ];
  
  const stageNames: Record<string, string> = {
      new: 'Novo / Lead Recebido',
      initial_contact: 'Contato Inicial',
      qualification: 'Qualificação / Diagnóstico',
      proposal: 'Apresentação / Proposta',
      negotiation: 'Negociação',
      won: 'Ganho (Fechamento)',
      lost: 'Perdido'
  };
    
  const columns = useMemo(() => {
    return stageOrder.map((stage) => ({
      id: stage,
      title: stageNames[stage],
      customers: customers.filter((customer) => customer.status === stage),
    }));
  }, [customers]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="mt-4 text-gray-600">Carregando funil de clientes...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] bg-red-50 rounded-lg p-8 text-center">
          <ServerCrash className="w-16 h-16 text-red-500 mb-4" />
          <h3 className="text-xl font-bold text-red-700">Ocorreu um erro</h3>
          <p className="text-gray-600 mt-2">{error}</p>
        </div>
      );
    }

    return <KanbanBoard columns={columns} onMoveCustomer={handleMoveCustomer} onDeleteCustomer={handleDeleteCustomer} />;
  };

  return (
    <div className='h-[calc(100vh-120px)] flex flex-col'>
      <div className="flex-shrink-0">
        <div className="flex justify-between items-center mb-6">
            <div>
            <h1 className="text-3xl font-bold text-black">Funil de Clientes</h1>
            <p className="text-gray-600">
                Visualize e gerencie a jornada dos seus clientes pelas fases de negociação.
            </p>
            </div>
             {isPending && <Loader2 className="w-6 h-6 text-primary animate-spin" />}
        </div>
         {feedback && (
            <div className={`mb-4 p-3 rounded-lg flex items-center text-sm ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
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
