
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createTask, updateTask } from '@/ai/flows/task-management';
import { TaskSchema, TaskProfile, UserProfile } from '@/ai/schemas';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2, AlertCircle, CalendarIcon, PlusCircle, Trash2, Send, MessageSquare, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';

const FormSchema = TaskSchema.extend({
    dueDate: z.union([z.string().datetime(), z.date(), z.null()]).optional(),
});
type FormValues = z.infer<typeof FormSchema>;


type TaskFormProps = {
  onTaskAction: () => void;
  task?: TaskProfile | null;
  users: UserProfile[];
};

export function TaskForm({ onTaskAction, task, users }: TaskFormProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  
  const isEditMode = !!task;

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
    getValues,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        responsibleUserId: '',
        dueDate: null,
        subtasks: [],
        comments: [],
    }
  });

  const { fields: subtaskFields, append: appendSubtask, remove: removeSubtask, update: updateSubtask } = useFieldArray({
    control,
    name: "subtasks"
  });

  const { fields: commentFields, append: appendComment } = useFieldArray({
    control,
    name: "comments"
  });

  useEffect(() => {
    if (task) {
        const dueDate = task.dueDate ? parseISO(task.dueDate.toString()) : null;
        const comments = task.comments?.map(c => ({...c, createdAt: new Date(c.createdAt)})) || [];
        reset({ ...task, dueDate, comments, responsibleUserId: task.responsibleUserId || '' });
    } else {
        reset({
            title: '',
            description: '',
            status: 'todo',
            priority: 'medium',
            responsibleUserId: '',
            dueDate: null,
            subtasks: [],
            comments: [],
        });
    }
  }, [task, reset]);

  const handleAddSubtask = () => {
    if (newSubtaskText.trim() !== '') {
        appendSubtask({ id: `new-${Date.now()}`, text: newSubtaskText, isCompleted: false });
        setNewSubtaskText('');
    }
  };

  const handleAddComment = () => {
    if (newCommentText.trim() !== '' && currentUser) {
        appendComment({
            id: `new-${Date.now()}`,
            authorId: currentUser.uid,
            authorName: currentUser.displayName || currentUser.email || 'Usuário',
            text: newCommentText,
            createdAt: new Date(),
        });
        setNewCommentText('');
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!currentUser) {
      setError('Você precisa estar autenticado para realizar esta ação.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const submissionData = {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        responsibleUserId: data.responsibleUserId === 'unassigned' ? undefined : data.responsibleUserId,
        comments: data.comments?.map(c => ({...c, createdAt: new Date(c.createdAt).toISOString()})),
      };

      if (isEditMode) {
        await updateTask({ ...submissionData, id: task.id, actor: currentUser.uid });
      } else {
        await createTask({ ...submissionData, actor: currentUser.uid });
      }
      onTaskAction();
    } catch (err: any) {
      console.error(err);
      setError(err.message || `Falha ao ${isEditMode ? 'atualizar' : 'criar'} a tarefa. Tente novamente.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
      {/* Main Task Info */}
      <div className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="title">Título da Tarefa*</Label>
            <Input id="title" {...register('title')} placeholder="Ex: Fazer follow-up com cliente X" />
            {errors.title && <p className="text-destructive text-sm">{errors.title.message}</p>}
        </div>
        <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" {...register('description')} placeholder="Adicione mais detalhes sobre a tarefa..." />
        </div>
      </div>
      
       {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Controller name="status" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent><SelectItem value="todo">A Fazer</SelectItem><SelectItem value="in_progress">Em Progresso</SelectItem><SelectItem value="review">Revisão</SelectItem><SelectItem value="done">Concluída</SelectItem></SelectContent>
              </Select>
          )}/>
        </div>
        <div className="space-y-2">
          <Label>Prioridade</Label>
          <Controller name="priority" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent><SelectItem value="low">Baixa</SelectItem><SelectItem value="medium">Média</SelectItem><SelectItem value="high">Alta</SelectItem><SelectItem value="urgent">Urgente</SelectItem></SelectContent>
                </Select>
            )}/>
        </div>
         <div className="space-y-2">
          <Label>Responsável</Label>
          <Controller name="responsibleUserId" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Selecione um responsável"/></SelectTrigger>
                <SelectContent><SelectItem value="unassigned">Ninguém</SelectItem>{users.map(user => (<SelectItem key={user.uid} value={user.uid}>{user.name || user.email}</SelectItem>))}</SelectContent>
              </Select>
            )}/>
        </div>
        <div className="space-y-2">
           <Label>Data de Vencimento</Label>
            <Controller name="dueDate" control={control} render={({ field }) => (
                <Popover>
                    <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal",!field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4"/>{field.value ? format(new Date(field.value), "PPP", {locale: ptBR}) : <span>Escolha uma data</span>}</Button></PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={field.onChange} initialFocus/></PopoverContent>
                </Popover>
            )}/>
        </div>
      </div>

      {/* Subtasks */}
      <div className="space-y-4">
        <Label className="flex items-center"><CheckSquare className="w-4 h-4 mr-2 text-muted-foreground"/>Subtarefas (Checklist)</Label>
        <div className="p-4 rounded-xl border border-border bg-secondary/30 space-y-2">
            {subtaskFields.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2 group">
                    <Checkbox id={`subtask-${index}`} checked={item.isCompleted} onCheckedChange={(checked) => {updateSubtask(index, {...item, isCompleted: !!checked})}} />
                    <Input value={item.text} onChange={(e) => updateSubtask(index, {...item, text: e.target.value})} className={cn("flex-1 bg-card border-border", item.isCompleted && "line-through text-muted-foreground")}/>
                    <Button type="button" variant="ghost" size="icon" className="w-8 h-8 opacity-50 group-hover:opacity-100" onClick={() => removeSubtask(index)}><Trash2 className="w-4 h-4 text-red-500"/></Button>
                </div>
            ))}
             <div className="flex items-center gap-2 pt-2">
                <Input placeholder="Adicionar nova subtarefa..." value={newSubtaskText} onChange={(e) => setNewSubtaskText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}/>
                <Button type="button" onClick={handleAddSubtask}><PlusCircle className="w-4 h-4 mr-2"/>Adicionar</Button>
             </div>
        </div>
      </div>

       {/* Comments */}
       <div className="space-y-4">
            <Label className="flex items-center"><MessageSquare className="w-4 h-4 mr-2 text-muted-foreground"/>Comentários</Label>
            <div className="p-4 rounded-xl border border-border bg-secondary/30 space-y-4">
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                    {commentFields.map((comment) => (
                        <div key={comment.id} className="text-sm">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-foreground">{comment.authorName}</span>
                                <span className="text-xs text-muted-foreground">{format(new Date(comment.createdAt), "dd/MM HH:mm")}</span>
                            </div>
                            <p className="bg-card p-2 rounded-lg whitespace-pre-wrap">{comment.text}</p>
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <Textarea placeholder="Adicionar um comentário..." value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)} rows={1} />
                    <Button type="button" onClick={handleAddComment} size="icon"><Send className="w-4 h-4"/></Button>
                </div>
            </div>
       </div>

       {error && (
            <div className="bg-destructive/20 text-destructive-foreground p-4 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-3" />
              <span className="text-sm">{error}</span>
            </div>
        )}
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-all duration-300 border border-transparent hover:border-primary/50 flex items-center justify-center font-semibold disabled:opacity-75 disabled:cursor-not-allowed">
          {isLoading ? <Loader2 className="mr-2 w-5 h-5 animate-spin" /> : null}
          {isLoading ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Salvar Tarefa')}
        </Button>
      </div>
    </form>
  );
}
