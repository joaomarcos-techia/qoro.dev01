
'use client';

import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
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

export default function ClientesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // The CustomerTable now manages its own refresh state internally.
  // This refreshCounter is kept to re-render the table component itself if needed,
  // for instance, if we needed to force a full re-mount.
  const [refreshCounter, setRefreshCounter] = useState(0);

  const handleCustomerAction = () => {
    setIsModalOpen(false);
    // Refresh the table by changing its key
    setRefreshCounter(prev => prev + 1);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie sua base de contatos e clientes.
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-all duration-300 border border-transparent hover:border-primary/50 flex items-center justify-center font-semibold">
              <PlusCircle className="mr-2 w-5 h-5" />
              Adicionar Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[750px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-foreground">Adicionar Novo Cliente</DialogTitle>
              <DialogDescription>
                Preencha as informações abaixo para cadastrar um novo cliente no sistema.
              </DialogDescription>
            </DialogHeader>
            <CustomerForm onCustomerAction={handleCustomerAction} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card p-6 rounded-2xl border-border">
        <CustomerTable key={refreshCounter} />
      </div>
    </div>
  );
}
