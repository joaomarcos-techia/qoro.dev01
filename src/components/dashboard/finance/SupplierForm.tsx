
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createSupplier, updateSupplier } from '@/ai/flows/supplier-management';
import { SupplierSchema, SupplierProfile } from '@/ai/schemas';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2, AlertCircle } from 'lucide-react';

type SupplierFormProps = {
  onAction: () => void;
  supplier?: SupplierProfile | null;
};

const formatCNPJ = (value: string) => {
    if (!value) return "";
    value = value.replace(/\D/g, ''); 
    value = value.replace(/^(\d{2})(\d)/, '$1.$2');
    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
    value = value.replace(/(\d{4})(\d)/, '$1-$2');
    return value.slice(0, 18); 
};

const formatPhone = (value: string) => {
    if (!value) return "";
    value = value.replace(/\D/g, '');
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
    value = value.replace(/(\d{5})(\d)/, '$1-$2');
    return value.slice(0, 15);
};

export function SupplierForm({ onAction, supplier }: SupplierFormProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!supplier;

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
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof SupplierSchema>>({
    resolver: zodResolver(SupplierSchema),
  });

  useEffect(() => {
    if (supplier) {
        reset({
          ...supplier,
          cnpj: supplier.cnpj ? formatCNPJ(supplier.cnpj) : '',
          phone: supplier.phone ? formatPhone(supplier.phone) : '',
        });
    } else {
        reset({
            name: '',
            cnpj: '',
            email: '',
            phone: '',
            paymentTerms: '',
        });
    }
  }, [supplier, reset]);


  const onSubmit = async (data: z.infer<typeof SupplierSchema>) => {
    if (!currentUser) {
      setError('Você precisa estar autenticado para executar esta ação.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const submissionData = { 
          ...data, 
          cnpj: data.cnpj?.replace(/\D/g, ''),
          phone: data.phone?.replace(/\D/g, ''),
      };
      if (isEditMode) {
        await updateSupplier({ ...submissionData, id: supplier.id, actor: currentUser.uid });
      } else {
        await createSupplier({ ...submissionData, actor: currentUser.uid });
      }
      onAction();
    } catch (err: any) {
      console.error(err);
      setError(err.message || `Falha ao ${isEditMode ? 'atualizar' : 'criar'} o fornecedor. Tente novamente.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Nome do Fornecedor*</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email*</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
           <Controller
            name="phone"
            control={control}
            render={({ field }) => (
                <Input
                    id="phone"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(formatPhone(e.target.value))}
                />
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cnpj">CNPJ</Label>
          <Controller
            name="cnpj"
            control={control}
            render={({ field }) => (
                <Input
                    id="cnpj"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(formatCNPJ(e.target.value))}
                />
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentTerms">Termos de Pagamento</Label>
          <Input id="paymentTerms" {...register('paymentTerms')} placeholder="Ex: 30 dias líquidos" />
        </div>
      </div>
       {error && (
            <div className="bg-destructive/20 text-destructive-foreground p-4 rounded-lg flex items-center mt-4">
              <AlertCircle className="w-5 h-5 mr-3" />
              <span className="text-sm">{error}</span>
            </div>
        )}
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading} className="bg-finance-primary text-black px-6 py-3 rounded-xl hover:bg-finance-primary/90 transition-all duration-300 border border-transparent hover:border-finance-primary/50 flex items-center justify-center font-semibold disabled:opacity-75 disabled:cursor-not-allowed">
          {isLoading ? <Loader2 className="mr-2 w-5 h-5 animate-spin" /> : null}
          {isLoading ? 'Salvando...' : isEditMode ? 'Salvar Alterações' : 'Salvar Fornecedor'}
        </Button>
      </div>
    </form>
  );
}
