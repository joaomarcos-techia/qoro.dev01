
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TaskForm } from '@/components/dashboard/task/TaskForm';
import { TaskTable } from '@/components/dashboard/task/TaskTable';
import { TaskProfile } from '@/ai/schemas';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { listTasks } from '@/ai/flows/task-management';

export default function ListaPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskProfile | null>(null);
  const [tasks, setTasks] = useState<TaskProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const fetchTasks = useCallback(() => {
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
    }
  }, [currentUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if(currentUser) {
      fetchTasks();
    }
  }, [currentUser, fetchTasks]);

  const handleModalOpenChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setSelectedTask(null);
    }
  };

  const handleTaskAction = () => {
    handleModalOpenChange(false);
    fetchTasks();
  };

  const handleEditTask = (task: TaskProfile) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };
  
  const handleAddTask = () => {
    setSelectedTask(null);
    setIsModalOpen(true);
  }

  return (
    <div>
       <Dialog open={isModalOpen} onOpenChange={handleModalOpenChange}>
          <DialogTrigger asChild>
            {/* O gatilho agora é o botão principal da página */}
            <span />
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-foreground">{selectedTask ? 'Editar Tarefa' : 'Criar Nova Tarefa'}</DialogTitle>
              <DialogDescription>
                {selectedTask ? 'Altere as informações da tarefa abaixo.' : 'Preencha as informações abaixo para adicionar uma nova tarefa.'}
              </DialogDescription>
            </DialogHeader>
            <TaskForm onTaskAction={handleTaskAction} task={selectedTask} />
          </DialogContent>
        </Dialog>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Minha Lista de Tarefas</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie todas as suas tarefas em um só lugar.
          </p>
        </div>
        <Button 
          onClick={handleAddTask}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-all duration-300 border border-transparent hover:border-primary/50 flex items-center justify-center font-semibold"
        >
          <PlusCircle className="mr-2 w-5 h-5" />
          Criar Tarefa
        </Button>
      </div>

      <div className="bg-card p-6 rounded-2xl border-border">
        <TaskTable 
            data={tasks} 
            isLoading={isLoading} 
            error={error} 
            onRefresh={fetchTasks}
            onEdit={handleEditTask}
        />
      </div>
    </div>
  );
}
