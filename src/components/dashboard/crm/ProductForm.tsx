
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createProduct, updateProduct } from '@/ai/flows/crm-management';
import { ProductSchema, ProductProfile, UpdateProductSchema } from '@/ai/schemas';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2, AlertCircle } from 'lucide-react';

type ProductFormProps = {
  onProductAction: () => void;
  product?: ProductProfile | null;
};

export function ProductForm({ onProductAction, product }: ProductFormProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!product;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof ProductSchema>>({
    resolver: zodResolver(ProductSchema),
  });

  useEffect(() => {
    if (product) {
      reset(product);
    } else {
      reset({
          name: '',
          description: '',
          category: '',
          sku: '',
          price: 0,
          cost: 0
      });
    }
  }, [product, reset]);

  const onSubmit = async (data: z.infer<typeof ProductSchema>) => {
    if (!currentUser) {
      setError('Você precisa estar autenticado para executar esta ação.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      if (isEditMode) {
        await updateProduct({ ...data, id: product.id, actor: currentUser.uid });
      } else {
        await createProduct({ ...data, actor: currentUser.uid });
      }
      onProductAction();
    } catch (err) {
      console.error(err);
      setError(`Falha ao ${isEditMode ? 'atualizar' : 'criar'} o produto. Tente novamente.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Nome do Produto*</Label>
          <Input id="name" {...register('name')} placeholder="Ex: Assinatura Mensal Pro" />
          {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea id="description" {...register('description')} placeholder="Detalhes do produto, características, etc." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Input id="category" {...register('category')} placeholder="Ex: Software" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sku">SKU (Código)</Label>
          <Input id="sku" {...register('sku')} placeholder="Ex: PROD-001" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Preço de Venda (R$)*</Label>
          <Input id="price" type="number" step="0.01" {...register('price')} />
          {errors.price && <p className="text-destructive text-sm">{errors.price.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="cost">Custo (R$)</Label>
          <Input id="cost" type="number" step="0.01" {...register('cost')} />
        </div>
      </div>
       {error && (
            <div className="bg-destructive/20 border-l-4 border-destructive text-destructive-foreground p-4 rounded-lg flex items-center mt-4">
              <AlertCircle className="w-5 h-5 mr-3" />
              <span className="text-sm">{error}</span>
            </div>
        )}
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-all duration-300 flex items-center justify-center font-semibold disabled:opacity-75 disabled:cursor-not-allowed">
          {isLoading ? <Loader2 className="mr-2 w-5 h-5 animate-spin" /> : null}
          {isLoading ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Salvar Produto')}
        </Button>
      </div>
    </form>
  );
}
