
'use client';

import { useState } from 'react';
import { PlusCircle, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SupplierTable } from '@/components/dashboard/finance/SupplierTable';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SupplierForm } from '@/components/dashboard/finance/SupplierForm';
import { SupplierProfile } from '@/ai/schemas';

export default function FornecedoresPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierProfile | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const triggerRefresh = () => {
    setRefreshCounter(prev => prev + 1);
  };

  const handleModalOpenChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
        setSelectedSupplier(null);
    }
  }

  const handleAction = () => {
    handleModalOpenChange(false);
    triggerRefresh();
  };
  
  const handleEdit = (supplier: SupplierProfile) => {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedSupplier(null);
    setIsModalOpen(true);
  }


  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Fornecedores</h1>
          <p className="text-muted-foreground">
            Gerencie sua base de fornecedores e parceiros de negócio.
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={handleModalOpenChange}>
          <DialogTrigger asChild>
            <Button 
              onClick={handleAdd}
              className="bg-finance-primary text-black px-4 py-2 rounded-xl hover:bg-finance-primary/90 transition-all duration-300 border border-transparent hover:border-finance-primary/50 flex items-center justify-center font-semibold"
            >
              <PlusCircle className="mr-2 w-5 h-5" />
              Adicionar Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-foreground">{selectedSupplier ? 'Editar Fornecedor' : 'Adicionar Novo Fornecedor'}</DialogTitle>
              <DialogDescription>
                {selectedSupplier ? 'Altere as informações do fornecedor.' : 'Preencha as informações para cadastrar um novo fornecedor.'}
              </DialogDescription>
            </DialogHeader>
            <SupplierForm onAction={handleAction} supplier={selectedSupplier} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card p-6 rounded-2xl border-border">
        <SupplierTable key={refreshCounter} onEdit={handleEdit} onRefresh={triggerRefresh}/>
      </div>
    </div>
  );
}
