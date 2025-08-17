
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createProduct } from '@/ai/flows/crm-management';
import { ProductSchema } from '@/ai/schemas';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ServiceFormProps = {
  onServiceCreated: () => void;
};

// Re-using ProductSchema for services as the structure is identical.
// In a real-world scenario, you might want a distinct ServiceSchema if they diverge.
const ServiceSchema = ProductSchema.extend({
    // Service-specific fields can be added here if needed
});

export function ServiceForm({ onServiceCreated }: ServiceFormProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof ServiceSchema>>({
    resolver: zodResolver(ServiceSchema),
    defaultValues: {
        name: '',
        description: '',
        category: 'Serviço', // Default category
        price: 0,
        pricingModel: 'fixed',
        durationHours: 1,
    },
  });

  const pricingModel = watch('pricingModel');

  const onSubmit = async (data: z.infer<typeof ServiceSchema>) => {
    if (!currentUser) {
      setError('Você precisa estar autenticado para criar um serviço.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // We use the same createProduct flow, as the data structure is compatible.
      // The `category` field helps differentiate.
      await createProduct({ ...data, actor: currentUser.uid });
      onServiceCreated();
    } catch (err) {
      console.error(err);
      setError('Falha ao criar o serviço. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Nome do Serviço*</Label>
          <Input id="name" {...register('name')} placeholder="Ex: Consultoria de Marketing Digital" />
          {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea id="description" {...register('description')} placeholder="Detalhes do serviço, entregáveis, etc." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Input id="category" {...register('category')} placeholder="Ex: Consultoria, Desenvolvimento" />
        </div>
        <div className="space-y-2">
            <Label>Modelo de Preço*</Label>
            <Controller name="pricingModel" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="fixed">Preço Fixo</SelectItem>
                        <SelectItem value="per_hour">Por Hora</SelectItem>
                    </SelectContent>
                </Select>
            )} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">{pricingModel === 'per_hour' ? 'Preço por Hora (R$)*' : 'Preço (R$)*'}</Label>
          <Input id="price" type="number" step="0.01" {...register('price')} />
          {errors.price && <p className="text-destructive text-sm">{errors.price.message}</p>}
        </div>
        
        {pricingModel === 'per_hour' && (
            <div className="space-y-2">
                <Label htmlFor="durationHours">Duração (horas)</Label>
                <Input id="durationHours" type="number" {...register('durationHours')} placeholder="Ex: 8"/>
            </div>
        )}

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
          {isLoading ? 'Salvando...' : 'Salvar Serviço'}
        </Button>
      </div>
    </form>
  );
}
