
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
import { Calendar, Flag, User, ChevronLeft, ChevronRight, Archive } from 'lucide-react';

interface TaskKanbanCardProps {
  task: TaskProfile;
  stageIds: string[];
  onMove: (taskId: string, newStatus: TaskProfile['status']) => void;
  onArchive: (taskId: string) => void;
}

const priorityMap: Record<TaskProfile['priority'], { text: string; color: string }> = {
    low: { text: 'Baixa', color: 'bg-green-100 text-green-800 border-green-200' },
    medium: { text: 'Média', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    high: { text: 'Alta', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    urgent: { text: 'Urgente', color: 'bg-red-100 text-red-800 border-red-200' },
};

export function TaskKanbanCard({ task, stageIds, onMove, onArchive }: TaskKanbanCardProps) {
  
  const priorityInfo = priorityMap[task.priority] || priorityMap.medium;
  const currentStageIndex = stageIds.findIndex(id => id === task.status);

  const handleMove = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'next' ? currentStageIndex + 1 : currentStageIndex - 1;
    if (newIndex >= 0 && newIndex < stageIds.length) {
        onMove(task.id, stageIds[newIndex] as TaskProfile['status']);
    }
  };


  return (
    <div className="bg-white rounded-xl p-4 shadow-neumorphism hover:shadow-neumorphism-hover transition-shadow duration-300 border border-gray-100">
      <h3 className="font-bold text-black text-base mb-3 break-words">{task.title}</h3>
      
      <div className="space-y-2 text-sm text-gray-700 min-h-[4rem]">
        {task.description && <p className="text-xs text-gray-500 mb-2">{task.description}</p>}
        {task.dueDate && (
            <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                <span className="text-xs">
                    {format(parseISO(task.dueDate.toString()), "dd 'de' MMM, yyyy", { locale: ptBR })}
                </span>
            </div>
        )}
        {task.responsibleUserName && (
            <div className="flex items-center">
                <User className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                <span className="text-xs font-medium">{task.responsibleUserName}</span>
            </div>
        )}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMove('prev')} disabled={currentStageIndex <= 0}>
                <ChevronLeft className="w-4 h-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:bg-gray-100 hover:text-gray-600" title="Arquivar Tarefa">
                    <Archive className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Arquivar esta tarefa?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação irá mover a tarefa para o arquivo. Ela não será excluída e poderá ser consultada posteriormente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onArchive(task.id)} className='bg-primary text-primary-foreground hover:bg-primary/90'>Sim, Arquivar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
        <div className="flex items-center gap-1">
            <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full border ${priorityInfo.color}`}>
                <Flag className="w-3 h-3 mr-1.5" />
                {priorityInfo.text}
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMove('next')} disabled={currentStageIndex >= stageIds.length - 1}>
                <ChevronRight className="w-4 h-4" />
            </Button>
        </div>
      </div>
    </div>
  );
}
