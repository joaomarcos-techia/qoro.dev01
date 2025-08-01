'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createAccount } from '@/ai/flows/finance-management';
import { AccountSchema } from '@/ai/schemas';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2, AlertCircle } from 'lucide-react';

type AccountFormProps = {
  onAccountCreated: () => void;
};

export function AccountForm({ onAccountCreated }: AccountFormProps) {
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
    formState: { errors },
  } = useForm<z.infer<typeof AccountSchema>>({
    resolver: zodResolver(AccountSchema),
    defaultValues: {
      name: '',
      type: 'checking',
      bank: '',
      balance: 0,
      isActive: true,
    },
  });

  const onSubmit = async (data: z.infer<typeof AccountSchema>) => {
    if (!currentUser) {
      setError('Você precisa estar autenticado para criar uma conta.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await createAccount({ ...data, actor: currentUser.uid });
      onAccountCreated();
    } catch (err) {
      console.error(err);
      setError('Falha ao criar a conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Nome da Conta*</Label>
          <Input id="name" {...register('name')} placeholder="Ex: Conta Principal, Caixa da Loja" />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Tipo de Conta*</Label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Conta Corrente</SelectItem>
                  <SelectItem value="savings">Poupança</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="cash">Caixa</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.type && <p className="text-red-500 text-sm">{errors.type.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="bank">Banco (se aplicável)</Label>
          <Input id="bank" {...register('bank')} placeholder="Ex: Banco do Brasil, Nubank" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="balance">Saldo Inicial (R$)*</Label>
          <Input id="balance" type="number" step="0.01" {...register('balance')} />
          {errors.balance && <p className="text-red-500 text-sm">{errors.balance.message}</p>}
        </div>
      </div>
       {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg flex items-center mt-4">
              <AlertCircle className="w-5 h-5 mr-3" />
              <span className="text-sm">{error}</span>
            </div>
        )}
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-neumorphism hover:shadow-neumorphism-hover flex items-center justify-center font-semibold disabled:opacity-75 disabled:cursor-not-allowed">
          {isLoading ? <Loader2 className="mr-2 w-5 h-5 animate-spin" /> : null}
          {isLoading ? 'Salvando...' : 'Salvar Conta'}
        </Button>
      </div>
    </form>
  );
}
