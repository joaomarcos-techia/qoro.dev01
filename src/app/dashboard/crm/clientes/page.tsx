
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
  const [refreshCounter, setRefreshCounter] = useState(0);

  const handleCustomerCreated = () => {
    setIsModalOpen(false);
    setRefreshCounter(prev => prev + 1); // Trigger a refresh
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black">Clientes</h1>
          <p className="text-gray-600">
            Gerencie sua base de contatos e clientes.
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-neumorphism hover:shadow-neumorphism-hover flex items-center justify-center font-semibold">
              <PlusCircle className="mr-2 w-5 h-5" />
              Adicionar Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-black">Adicionar Novo Cliente</DialogTitle>
              <DialogDescription>
                Preencha as informações abaixo para cadastrar um novo cliente no sistema.
              </DialogDescription>
            </DialogHeader>
            <CustomerForm onCustomerCreated={handleCustomerCreated} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-neumorphism border border-gray-200">
        <CustomerTable key={refreshCounter} />
      </div>
    </div>
  );
}
