'use client';
import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AccountTable } from '@/components/dashboard/finance/AccountTable';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
// import { AccountForm } from '@/components/dashboard/finance/AccountForm';


export default function ContasPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshCounter, setRefreshCounter] = useState(0);

    const handleAccountCreated = () => {
      setIsModalOpen(false);
      setRefreshCounter(prev => prev + 1);
    };

    return (
      <div>
        <div className="flex justify-between items-center mb-8">
            <div>
                 <h1 className="text-3xl font-bold text-black">Contas Financeiras</h1>
                <p className="text-gray-600">
                Gerencie suas contas bancárias, caixas e cartões de crédito.
                </p>
            </div>
             <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                    <Button 
                        disabled // Habilitar quando o formulário for criado
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-neumorphism hover:shadow-neumorphism-hover flex items-center justify-center font-semibold"
                    >
                    <PlusCircle className="mr-2 w-5 h-5" />
                    Adicionar Conta
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-black">Adicionar Nova Conta</DialogTitle>
                        <DialogDescription>
                            Preencha as informações para cadastrar uma nova conta financeira.
                        </DialogDescription>
                    </DialogHeader>
                    {/* <AccountForm onAccountCreated={handleAccountCreated} /> */}
                </DialogContent>
            </Dialog>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-neumorphism border border-gray-200">
            <AccountTable key={refreshCounter} />
        </div>
      </div>
    );
  }
