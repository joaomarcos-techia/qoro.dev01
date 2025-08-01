
'use client';

import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServiceTable } from '@/components/dashboard/crm/ServiceTable';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ServiceForm } from '@/components/dashboard/crm/ServiceForm';

export default function ServicosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const handleServiceCreated = () => {
    setIsModalOpen(false);
    setRefreshCounter(prev => prev + 1); // Trigger a refresh
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black">Serviços</h1>
          <p className="text-gray-600">
            Cadastre e gerencie os serviços que sua empresa oferece.
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-neumorphism hover:shadow-neumorphism-hover flex items-center justify-center font-semibold">
              <PlusCircle className="mr-2 w-5 h-5" />
              Adicionar Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-black">Adicionar Novo Serviço</DialogTitle>
              <DialogDescription>
                Preencha as informações abaixo para cadastrar um novo serviço no sistema.
              </DialogDescription>
            </DialogHeader>
            <ServiceForm onServiceCreated={handleServiceCreated} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-neumorphism border border-gray-200">
        <ServiceTable key={refreshCounter} />
      </div>
    </div>
  );
}
