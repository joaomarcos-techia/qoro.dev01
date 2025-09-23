
'use client';

import { useState } from 'react';
import { PlusCircle, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { BillTable } from '@/components/dashboard/finance/BillTable';
import { BillForm } from '@/components/dashboard/finance/BillForm';
import { BillProfile } from '@/ai/schemas';

export default function ContasAPagarPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState<BillProfile | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleAction = () => {
      setIsModalOpen(false);
      setSelectedBill(null);
      setRefreshKey(prev => prev + 1);
    };

    const handleAdd = () => {
      setSelectedBill(null);
      setIsModalOpen(true);
    }
    
    const handleEdit = (bill: BillProfile) => {
      setSelectedBill(bill);
      setIsModalOpen(true);
    };


    return (
      <div>
        <div className="flex justify-between items-center mb-8">
            <div>
                 <h1 className="text-4xl font-bold text-foreground">Contas a Pagar e Receber</h1>
                <p className="text-muted-foreground">
                  Gerencie suas pendências financeiras e mantenha o fluxo de caixa sob controle.
                </p>
            </div>
             <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                    <Button 
                        onClick={handleAdd}
                        className="bg-finance-primary text-black px-4 py-2 rounded-xl hover:bg-finance-primary/90 transition-all duration-300 border border-transparent hover:border-finance-primary/50 flex items-center justify-center font-semibold"
                    >
                    <PlusCircle className="mr-2 w-5 h-5" />
                    Adicionar Conta
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-foreground">{selectedBill ? 'Editar Conta' : 'Adicionar Nova Conta'}</DialogTitle>
                        <DialogDescription>
                            {selectedBill ? 'Altere os dados da pendência abaixo.' : 'Preencha as informações para registrar uma nova conta a pagar ou a receber.'}
                        </DialogDescription>
                    </DialogHeader>
                    <BillForm bill={selectedBill} onAction={handleAction} />
                </DialogContent>
            </Dialog>
        </div>

        <div className="bg-card p-6 rounded-2xl border-border">
            <BillTable onEdit={handleEdit} refreshKey={refreshKey} onRefresh={() => setRefreshKey(k => k + 1)} />
        </div>
      </div>
    );
  }
