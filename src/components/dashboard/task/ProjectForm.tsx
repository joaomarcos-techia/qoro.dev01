
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createProject } from '@/ai/flows/project-management';
import { ProjectSchema } from '@/ai/schemas';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2, AlertCircle, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const FormSchema = ProjectSchema.extend({
    dueDate: z.union([z.string().datetime(), z.date(), z.null()]).optional(),
});
type FormValues = z.infer<typeof FormSchema>;

type ProjectFormProps = {
  onProjectAction: () => void;
};

export function ProjectForm({ onProjectAction }: ProjectFormProps) {
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
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      status: 'not_started',
      description: '',
      dueDate: null,
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!currentUser) {
      setError('Você precisa estar autenticado para criar um projeto.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const submissionData = {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      };
      await createProject({ ...submissionData, actor: currentUser.uid });
      onProjectAction();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Falha ao criar o projeto. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Projeto*</Label>
        <Input id="name" {...register('name')} placeholder="Ex: Lançamento do Novo Site" />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" {...register('description')} placeholder="Descreva o objetivo principal do projeto..." />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status inicial" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Não Iniciado</SelectItem>
                  <SelectItem value="in_progress">Em Progresso</SelectItem>
                  <SelectItem value="on_hold">Em Espera</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
           <Label>Data de Entrega</Label>
            <Controller
                name="dueDate"
                control={control}
                render={({ field }) => (
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(new Date(field.value), "PPP") : <span>Escolha uma data</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={field.onChange}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                )}
            />
        </div>
      </div>
       {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-3" />
              <span className="text-sm">{error}</span>
            </div>
        )}
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-neumorphism hover:shadow-neumorphism-hover flex items-center justify-center font-semibold disabled:opacity-75 disabled:cursor-not-allowed">
          {isLoading ? <Loader2 className="mr-2 w-5 h-5 animate-spin" /> : null}
          {isLoading ? 'Salvando...' : 'Salvar Projeto'}
        </Button>
      </div>
    </form>
  );
}
