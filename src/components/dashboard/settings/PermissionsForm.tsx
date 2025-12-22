
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AppPermissionsSchema, UserProfile, AppPermissions } from '@/ai/schemas';
import { updateUserPermissionsFlowWrapper as updateUserPermissions } from '@/ai/flows/user-management';
import { Loader2, AlertCircle, Lock } from 'lucide-react';
import { z } from 'zod';

const appPermissionKeys = ['qoroCrm', 'qoroTask', 'qoroFinance', 'qoroPulse'] as const;
type AppPermissionKey = (typeof appPermissionKeys)[number];

const permissionLabels: Record<AppPermissionKey, string> = {
  qoroCrm: 'QoroCRM - Vendas e Clientes',
  qoroTask: 'QoroTask - Gestão de Tarefas',
  qoroFinance: 'QoroFinance - Financeiro',
  qoroPulse: 'QoroPulse - Inteligência Artificial',
};

interface PermissionsFormProps {
  user: UserProfile;
  actorUid: string;
  onPermissionsUpdated: () => void;
  planId: 'free' | 'growth' | 'performance' | null;
}

export function PermissionsForm({ user, actorUid, onPermissionsUpdated, planId }: PermissionsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    handleSubmit,
    control,
    reset,
    setValue, // Adicionado `setValue`
    formState: { isDirty },
  } = useForm<z.infer<typeof AppPermissionsSchema>>({
    resolver: zodResolver(AppPermissionsSchema),
    defaultValues: user.permissions || {},
  });

  useEffect(() => {
    reset(user.permissions);
  }, [user, reset]);

  const onSubmit = async (data: AppPermissions) => {
    setIsLoading(true);
    setError(null);
    try {
      await updateUserPermissions({
        userId: user.uid,
        permissions: data,
        actor: actorUid,
      });
      onPermissionsUpdated();
    } catch (err: any) {
      setError(err.message || 'Falha ao atualizar permissões.');
    } finally {
      setIsLoading(false);
    }
  };

  const isPulseLocked = planId !== 'performance';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
      <div className="space-y-4 rounded-xl border border-border bg-secondary/50 p-4">
        {appPermissionKeys.map((key) => {
          const isDisabled = key === 'qoroPulse' && isPulseLocked;
          return (
            <div key={key} className="flex items-center space-x-3">
              <Controller
                name={key}
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id={key}
                    disabled={isDisabled}
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      setValue(key, !!checked, { shouldDirty: true });
                    }}
                  />
                )}
              />
              <Label
                htmlFor={key}
                className={`text-sm font-medium ${isDisabled ? 'text-muted-foreground/50 cursor-not-allowed' : ''}`}
              >
                {permissionLabels[key]}
              </Label>
              {isDisabled && <Lock className="w-4 h-4 text-muted-foreground/50" />}
            </div>
          );
        })}
         {isPulseLocked && (
            <p className="text-xs text-muted-foreground pl-2 pt-2">
                O acesso ao QoroPulse está disponível apenas no plano Performance.
            </p>
        )}
      </div>

      {error && (
        <div className="bg-destructive/20 text-destructive-foreground p-3 rounded-lg flex items-center text-sm">
          <AlertCircle className="w-5 h-5 mr-3" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading || !isDirty}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Permissões
        </Button>
      </div>
    </form>
  );
}
