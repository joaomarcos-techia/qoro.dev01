'use client';

import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductTable } from '@/components/dashboard/crm/ProductTable';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ProductForm } from '@/components/dashboard/crm/ProductForm';
import { ProductProfile } from '@/ai/schemas';

export default function ProdutosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductProfile | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const triggerRefresh = () => {
    setRefreshCounter(prev => prev + 1);
  };

  const handleModalOpenChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
        setSelectedProduct(null);
    }
  }

  const handleProductAction = () => {
    handleModalOpenChange(false);
    triggerRefresh();
  };
  
  const handleEdit = (product: ProductProfile) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black">Produtos</h1>
          <p className="text-gray-600">
            Cadastre e gerencie os produtos que sua empresa vende.
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={handleModalOpenChange}>
          <DialogTrigger asChild>
            <Button 
              onClick={handleAdd}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-neumorphism hover:shadow-neumorphism-hover flex items-center justify-center font-semibold">
              <PlusCircle className="mr-2 w-5 h-5" />
              Adicionar Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-black">{selectedProduct ? 'Editar Produto' : 'Adicionar Novo Produto'}</DialogTitle>
              <DialogDescription>
                {selectedProduct ? 'Altere as informações do produto abaixo.' : 'Preencha as informações abaixo para cadastrar um novo produto no sistema.'}
              </DialogDescription>
            </DialogHeader>
            <ProductForm onProductAction={handleProductAction} product={selectedProduct} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-neumorphism border border-gray-200">
        <ProductTable key={refreshCounter} onEdit={handleEdit} onRefresh={triggerRefresh} />
      </div>
    </div>
  );
}
