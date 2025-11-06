
'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, Loader2, ServerCrash, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerTable } from '@/components/dashboard/crm/CustomerTable';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CustomerForm } from '@/components/dashboard/crm/CustomerForm';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { CustomerProfile } from '@/ai/schemas';

export default function ClientesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [customerCount, setCustomerCount] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setInitialLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCustomerAction = () => {
    setIsModalOpen(false);
    setRefreshCounter(prev => prev + 1);
  };
  
  const renderContent = () => {
    if (initialLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-12 h-12 text-crm-primary animate-spin" />
          <p className="mt-4 text-muted-foreground">Carregando clientes...</p>
        </div>
      );
    }
    
    if (!currentUser) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-card border border-destructive/50 rounded-2xl">
                <ServerCrash className="w-12 h-12 text-destructive" />
                <p className="mt-4 text-destructive-foreground font-semibold">Usuário não autenticado.</p>
                <p className="text-sm text-muted-foreground mt-1">Por favor, faça login novamente para visualizar os clientes.</p>
            </div>
        );
    }

    return <CustomerTable key={refreshCounter} onCountChange={setCustomerCount}/>;
  }


  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie sua base de contatos e clientes.
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-crm-primary text-black px-4 py-2 rounded-xl hover:bg-crm-primary/90 transition-all duration-300 border border-transparent hover:border-crm-primary/50 flex items-center justify-center font-semibold w-full sm:w-auto">
              <PlusCircle className="mr-2 w-5 h-5" />
              Adicionar cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[750px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-foreground">Adicionar novo cliente</DialogTitle>
              <DialogDescription>
                Preencha as informações abaixo para cadastrar um novo cliente no sistema.
              </DialogDescription>
            </DialogHeader>
            <CustomerForm onCustomerAction={handleCustomerAction} customerCount={customerCount} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card p-4 sm:p-6 rounded-2xl border-border">
        {renderContent()}
      </div>
    </div>
  );
}
