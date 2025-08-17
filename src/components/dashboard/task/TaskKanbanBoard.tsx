
'use client';

import { TaskProfile } from '@/ai/schemas';
import { TaskKanbanCard } from './TaskKanbanCard';
import { CheckSquare } from 'lucide-react';

export type KanbanColumn = {
  id: string;
  title: string;
  tasks: TaskProfile[];
};

interface TaskKanbanBoardProps {
  columns: KanbanColumn[];
  onMoveTask: (taskId: string, newStatus: TaskProfile['status']) => void;
  onDeleteTask: (taskId: string) => void;
}

export function TaskKanbanBoard({ columns, onMoveTask, onDeleteTask }: TaskKanbanBoardProps) {

  const totalTasks = columns.reduce((acc, col) => acc + col.tasks.length, 0);
  const stageIds = columns.map(c => c.id);

  if (totalTasks === 0) {
    return (
        <div className="flex flex-col items-center justify-center text-center h-full bg-card/50 rounded-2xl p-8 border border-border">
            <CheckSquare className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold text-foreground">Nenhuma tarefa no quadro</h3>
            <p className="text-muted-foreground mt-2">Crie tarefas na "Minha Lista" para vê-las aqui.</p>
        </div>
    )
  }

  return (
    <div className="flex gap-4 overflow-x-auto p-1 pb-4 h-full">
      {columns.map((column) => (
        <div key={column.id} className="w-80 flex-shrink-0 flex flex-col">
          <div className="bg-secondary/30 rounded-xl p-3 flex flex-col flex-grow">
            <h2 className="text-base font-bold text-foreground mb-4 px-2 flex justify-between items-center">
              <span>{column.title}</span>
              <span className="text-sm font-medium text-muted-foreground bg-secondary rounded-full px-2.5 py-0.5">
                {column.tasks.length}
              </span>
            </h2>
            <div className="space-y-3 min-h-[100px] overflow-y-auto flex-grow pr-1">
              {column.tasks.map((task) => (
                <TaskKanbanCard 
                    key={task.id} 
                    task={task} 
                    stageIds={stageIds}
                    onMove={onMoveTask}
                    onDelete={onDeleteTask}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
