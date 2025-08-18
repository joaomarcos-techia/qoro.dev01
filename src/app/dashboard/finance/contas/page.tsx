
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
import { AccountForm } from '@/components/dashboard/finance/AccountForm';


export default function ContasPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshCounter, setRefreshCounter] = useState(0);

    const handleAccountAction = () => {
      setIsModalOpen(false);
      setRefreshCounter(prev => prev + 1);
    };

    return (
      <div>
        <div className="flex justify-between items-center mb-8">
            <div>
                 <h1 className="text-4xl font-bold text-foreground">Contas Financeiras</h1>
                <p className="text-muted-foreground">
                Gerencie suas contas bancárias, caixas e cartões de crédito.
                </p>
            </div>
             <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                    <Button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-all duration-300 border border-transparent hover:border-primary/50 flex items-center justify-center font-semibold"
                    >
                    <PlusCircle className="mr-2 w-5 h-5" />
                    Adicionar Conta
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-foreground">Adicionar Nova Conta</DialogTitle>
                        <DialogDescription>
                            Preencha as informações para cadastrar uma nova conta financeira.
                        </DialogDescription>
                    </DialogHeader>
                    <AccountForm onAccountAction={handleAccountAction} />
                </DialogContent>
            </Dialog>
        </div>

        <div className="bg-card p-6 rounded-2xl border-border">
            <AccountTable key={refreshCounter} />
        </div>
      </div>
    );
  }
