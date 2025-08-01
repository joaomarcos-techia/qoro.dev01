'use client';

import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuoteTable } from '@/components/dashboard/crm/QuoteTable';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
// import { QuoteForm } from '@/components/dashboard/crm/QuoteForm';

export default function OrcamentosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const handleQuoteCreated = () => {
    setIsModalOpen(false);
    setRefreshCounter(prev => prev + 1);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black">Orçamentos</h1>
          <p className="text-gray-600">
            Crie, envie e gerencie propostas comerciais para seus clientes.
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-neumorphism hover:shadow-neumorphism-hover flex items-center justify-center font-semibold"
              disabled // A ser habilitado quando o formulário for criado
            >
              <PlusCircle className="mr-2 w-5 h-5" />
              Criar Orçamento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-black">Criar Novo Orçamento</DialogTitle>
              <DialogDescription>
                Selecione o cliente, adicione os itens e defina os termos.
              </DialogDescription>
            </DialogHeader>
            {/* <QuoteForm onQuoteCreated={handleQuoteCreated} /> */}
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-neumorphism border border-gray-200">
        <QuoteTable key={refreshCounter} />
      </div>
    </div>
  );
}
