'use client';

import { TaskProfile } from '@/ai/schemas';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Flag, User, ChevronLeft, ChevronRight, Trash2, Eye, CheckSquare, MessageSquare } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface TaskKanbanCardProps {
  task: TaskProfile;
  stageIds: string[];
  onMove: (taskId: string, newStatus: TaskProfile['status']) => void;
  onDelete: (taskId: string) => void;
  onSelect: (task: TaskProfile) => void;
}

const priorityMap: Record<TaskProfile['priority'], { text: string; color: string }> = {
    low: { text: 'Baixa', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
    medium: { text: 'Média', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
    high: { text: 'Alta', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
    urgent: { text: 'Urgente', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
};

export function TaskKanbanCard({ task, stageIds, onMove, onDelete, onSelect }: TaskKanbanCardProps) {
  
  const priorityInfo = priorityMap[task.priority] || priorityMap.medium;
  const currentStageIndex = stageIds.findIndex(id => id === task.status);

  const handleMove = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'next' ? currentStageIndex + 1 : currentStageIndex - 1;
    if (newIndex >= 0 && newIndex < stageIds.length) {
        onMove(task.id, stageIds[newIndex] as TaskProfile['status']);
    }
  };

  const completedSubtasks = task.subtasks?.filter(st => st.isCompleted).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;
  const hasComments = (task.comments?.length || 0) > 0;

  return (
    <div className="bg-card rounded-xl p-4 transition-shadow duration-300 border border-border hover:border-task-primary/50 flex flex-col">
      <h3 className="font-bold text-foreground text-base mb-3 break-words cursor-pointer hover:underline" onClick={() => onSelect(task)}>{task.title}</h3>
      
      <div className="space-y-2 text-sm text-muted-foreground flex-grow">
        {task.description && <p className="text-xs text-muted-foreground/80 mb-2">{task.description}</p>}
        {totalSubtasks > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-muted-foreground/80">Checklist</span>
                <span>{completedSubtasks}/{totalSubtasks}</span>
            </div>
            <Progress value={subtaskProgress} className="h-1.5"/>
          </div>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
            {task.dueDate && (
                <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1.5 text-muted-foreground/70 flex-shrink-0" />
                    <span className="text-xs">
                        {format(parseISO(task.dueDate.toString()), "dd MMM", { locale: ptBR })}
                    </span>
                </div>
            )}
            {task.responsibleUserName && (
                <div className="flex items-center">
                    <User className="w-4 h-4 mr-1.5 text-muted-foreground/70 flex-shrink-0" />
                    <span className="text-xs font-medium">{task.responsibleUserName}</span>
                </div>
            )}
            {hasComments && (
                 <div className="flex items-center">
                    <MessageSquare className="w-4 h-4 mr-1.5 text-muted-foreground/70 flex-shrink-0" />
                    <span className="text-xs font-medium">{task.comments?.length}</span>
                </div>
            )}
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
        <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => handleMove('prev')} disabled={currentStageIndex <= 0}>
                <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-secondary/80 hover:text-foreground" title="Ver Detalhes" onClick={() => onSelect(task)}>
                <Eye className="w-4 h-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-destructive/20 hover:text-red-400" title="Excluir Tarefa">
                    <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir esta tarefa?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. A tarefa será excluída permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(task.id)} className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>Sim, Excluir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
        <div className="flex items-center gap-1">
            <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full border ${priorityInfo.color}`}>
                <Flag className="w-3 h-3 mr-1.5" />
                {priorityInfo.text}
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => handleMove('next')} disabled={currentStageIndex >= stageIds.length - 1}>
                <ChevronRight className="w-4 h-4" />
            </Button>
        </div>
      </div>
    </div>
  );
}
