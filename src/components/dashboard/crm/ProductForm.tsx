
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
import { ProductSchema, ProductProfile } from '@/ai/schemas';
import { onAuthStateChanged, User as FirebaseUser, getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { Loader2, AlertCircle } from 'lucide-react';

const auth = getAuth(app);

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
    setValue,
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
          cost: undefined,
      });
    }
  }, [product, reset]);

  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof z.infer<typeof ProductSchema>) => {
    const value = e.target.value;
    if (value === '' || value === null) {
      setValue(fieldName, undefined as any, { shouldValidate: true });
      return;
    }
    const numericValue = value.replace(/[^0-9.,]/g, '').replace(',', '.');
    const parts = numericValue.split('.');
    const formattedValue = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : numericValue;

    setValue(fieldName, parseFloat(formattedValue) as any, { shouldValidate: true });
  };


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
    } catch (err: any) {
      console.error(err);
      setError(err.message || `Falha ao salvar o produto. Tente novamente.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Nome do produto*</Label>
          <Input id="name" {...register('name')} placeholder={"Ex: Assinatura Mensal Pro"} />
          {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea id="description" {...register('description')} placeholder="Detalhes, características, etc." />
        </div>
       
        <div className="space-y-2">
          <Label htmlFor="price">Preço de venda (R$)*</Label>
          <Input 
            id="price" 
            type="text" 
            inputMode='decimal' 
            {...register('price')}
            onChange={(e) => handleNumericInput(e, 'price')}
          />
          {errors.price && <p className="text-destructive text-sm">{errors.price.message}</p>}
        </div>
        
        <div className="space-y-2">
            <Label htmlFor="cost">Custo (R$)</Label>
            <Input 
            id="cost" 
            type="text" 
            inputMode='decimal' 
            {...register('cost')} 
            onChange={(e) => handleNumericInput(e, 'cost')}
            />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Input id="category" {...register('category')} placeholder="Ex: Software, Assinatura" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sku">SKU (código)</Label>
          <Input id="sku" {...register('sku')} placeholder="Ex: PROD-001" />
        </div>
      </div>
       {error && (
            <div className="bg-destructive/20 border-l-4 border-destructive text-destructive-foreground p-4 rounded-lg flex items-center mt-4">
              <AlertCircle className="w-5 h-5 mr-3" />
              <span className="text-sm">{error}</span>
            </div>
        )}
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading} className="bg-crm-primary text-black px-6 py-3 rounded-xl hover:bg-crm-primary/90 transition-all duration-300 flex items-center justify-center font-semibold disabled:opacity-75 disabled:cursor-not-allowed">
          {isLoading ? <Loader2 className="mr-2 w-5 h-5 animate-spin" /> : null}
          {isLoading ? 'Salvando...' : (isEditMode ? 'Salvar alterações' : `Salvar produto`)}
        </Button>
      </div>
    </form>
  );
}
