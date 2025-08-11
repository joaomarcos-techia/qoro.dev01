
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
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { listTasks } from '@/ai/flows/task-management';
import { TaskProfile } from '@/ai/schemas';
import { TaskTable } from '@/components/dashboard/task/TaskTable';

export default function MinhaListaPage() {
  const [tasks, setTasks] = useState<TaskProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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
    if (currentUser) {
      fetchTasks();
    } else if (!auth.currentUser) {
        setIsLoading(false);
    }
  }, [currentUser, fetchTasks]);


  const handleTaskAction = () => {
    setIsModalOpen(false);
    fetchTasks(); // Refresh the list after an action
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black">Minha Lista de Tarefas</h1>
          <p className="text-gray-600">
            Adicione, gerencie e acompanhe todas as suas atividades.
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
            <TaskForm onTaskCreated={handleTaskAction} />
          </DialogContent>
        </Dialog>
      </div>

       <div className="bg-white p-6 rounded-2xl shadow-neumorphism border border-gray-200">
            <TaskTable data={tasks} isLoading={isLoading} error={error} onRefresh={fetchTasks} />
        </div>
    </div>
  );
}
