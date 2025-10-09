
'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, Loader2, ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TransactionTable } from '@/components/dashboard/finance/TransactionTable';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TransactionForm } from '@/components/dashboard/finance/TransactionForm';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { listTransactions } from '@/ai/flows/finance-management';


export default function TransacoesPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [initialLoading, setInitialLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [transactionCount, setTransactionCount] = useState(0);

    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        if(user) {
          listTransactions({ actor: user.uid }).then(transactions => {
            setTransactionCount(transactions.length);
            setInitialLoading(false);
          });
        } else {
          setInitialLoading(false);
        }
      });
      return () => unsubscribe();
    }, []);

    const handleAction = () => {
      setIsModalOpen(false);
      setRefreshKey(prev => prev + 1);
      if(currentUser) {
        listTransactions({ actor: currentUser.uid }).then(transactions => {
          setTransactionCount(transactions.length);
        });
      }
    };

    const renderContent = () => {
      if (initialLoading) {
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="w-12 h-12 text-finance-primary animate-spin" />
            <p className="mt-4 text-muted-foreground">Carregando transações...</p>
          </div>
        );
      }
      
      if (!currentUser) {
          return (
              <div className="flex flex-col items-center justify-center min-h-[400px] bg-destructive/10 border-destructive border rounded-lg">
                  <ServerCrash className="w-12 h-12 text-destructive" />
                  <p className="mt-4 text-destructive-foreground font-semibold">Usuário não autenticado.</p>
                  <p className="mt-1 text-sm text-muted-foreground">Por favor, faça login novamente para ver as transações.</p>
              </div>
          );
      }
  
      return <TransactionTable refreshKey={refreshKey} onAction={handleAction} />;
    }

    return (
      <div>
        <div className="flex justify-between items-center mb-8">
            <div>
                 <h1 className="text-4xl font-bold text-foreground">Transações</h1>
                <p className="text-muted-foreground">
                  Gerencie suas contas a pagar e a receber e mantenha tudo organizado.
                </p>
            </div>
             <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                    <Button 
                        onClick={() => setIsModalOpen(true)}
                        disabled={!currentUser}
                        className="bg-finance-primary text-black px-4 py-2 rounded-xl hover:bg-finance-primary/90 transition-all duration-300 border border-transparent hover:border-finance-primary/50 flex items-center justify-center font-semibold"
                    >
                    <PlusCircle className="mr-2 w-5 h-5" />
                    Adicionar transação
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-foreground">Registrar nova transação</DialogTitle>
                        <DialogDescription>
                            Preencha as informações para registrar uma nova movimentação financeira.
                        </DialogDescription>
                    </DialogHeader>
                    <TransactionForm onAction={handleAction} transactionCount={transactionCount} />
                </DialogContent>
            </Dialog>
        </div>

        <div className="bg-card p-6 rounded-2xl border-border">
            {renderContent()}
        </div>
      </div>
    );
  }
