
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
import { ServiceProfile } from '@/ai/schemas';

export default function ServicosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceProfile | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const triggerRefresh = () => {
    setRefreshCounter(prev => prev + 1);
  };

  const handleModalOpenChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
        setSelectedService(null);
    }
  }

  const handleServiceAction = () => {
    handleModalOpenChange(false);
    triggerRefresh();
  };
  
  const handleEdit = (service: ServiceProfile) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedService(null);
    setIsModalOpen(true);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Serviços</h1>
          <p className="text-muted-foreground">
            Cadastre e gerencie os serviços que sua empresa oferece.
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={handleModalOpenChange}>
          <DialogTrigger asChild>
            <Button 
              onClick={handleAdd}
              className="bg-crm-primary text-black px-4 py-2 rounded-xl hover:bg-crm-primary/90 transition-all duration-300 border border-transparent hover:border-crm-primary/50 flex items-center justify-center font-semibold">
              <PlusCircle className="mr-2 w-5 h-5" />
              Adicionar Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-foreground">{selectedService ? 'Editar Serviço' : 'Adicionar Novo Serviço'}</DialogTitle>
              <DialogDescription>
                 {selectedService ? 'Altere as informações do serviço abaixo.' : 'Preencha as informações para cadastrar um novo serviço.'}
              </DialogDescription>
            </DialogHeader>
            <ServiceForm onServiceAction={handleServiceAction} service={selectedService} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card p-6 rounded-2xl border-border">
        <ServiceTable key={refreshCounter} onEdit={handleEdit} onRefresh={triggerRefresh} />
      </div>
    </div>
  );
}

    