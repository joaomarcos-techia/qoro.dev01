
'use client';

import { useState, useEffect, useMemo } from 'react';
import { PlusCircle, Loader2, ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskKanbanBoard } from '@/components/dashboard/task/TaskKanbanBoard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TaskForm } from '@/components/dashboard/task/TaskForm';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { listTasks } from '@/ai/flows/task-management';
import { TaskProfile } from '@/ai/schemas';

export default function TarefasPage() {
  const [tasks, setTasks] = useState<TaskProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      setIsLoading(true);
      setError(null);
      listTasks({ actor: currentUser.uid })
        .then(setTasks)
        .catch((err) => {
          console.error(err);
          setError('Não foi possível carregar as tarefas.');
        })
        .finally(() => setIsLoading(false));
    } else if (!auth.currentUser) {
        setIsLoading(false);
    }
  }, [currentUser, refreshCounter]);


  const handleTaskCreated = () => {
    setIsModalOpen(false);
    setRefreshCounter(prev => prev + 1); // Trigger a refresh
  };
  
  const columns = useMemo(() => {
    const statusOrder: TaskProfile['status'][] = [
      'todo',
      'in_progress',
      'review',
      'done',
    ];
    
    const statusNames: Record<TaskProfile['status'], string> = {
        todo: 'A Fazer',
        in_progress: 'Em Progresso',
        review: 'Revisão',
        done: 'Concluída'
    };

    const columns = statusOrder.map((status) => ({
      id: status,
      title: statusNames[status],
      tasks: tasks.filter((task) => task.status === status),
    }));

    return columns;
  }, [tasks]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-96">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="mt-4 text-gray-600">Carregando tarefas...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-red-50 rounded-lg p-8 text-center">
          <ServerCrash className="w-16 h-16 text-red-500 mb-4" />
          <h3 className="text-xl font-bold text-red-700">Ocorreu um erro</h3>
          <p className="text-gray-600 mt-2">{error}</p>
        </div>
      );
    }

    return <TaskKanbanBoard columns={columns} />;
  };


  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black">Minhas Tarefas</h1>
          <p className="text-gray-600">
            Gerencie suas atividades com o quadro Kanban.
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-neumorphism hover:shadow-neumorphism-hover flex items-center justify-center font-semibold">
              <PlusCircle className="mr-2 w-5 h-5" />
              Criar Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-black">Criar Nova Tarefa</DialogTitle>
              <DialogDescription>
                Preencha as informações abaixo para adicionar uma nova tarefa.
              </DialogDescription>
            </DialogHeader>
            <TaskForm onTaskCreated={handleTaskCreated} />
          </DialogContent>
        </Dialog>
      </div>

      {renderContent()}
    </div>
  );
}
