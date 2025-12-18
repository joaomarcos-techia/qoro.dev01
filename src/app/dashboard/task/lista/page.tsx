
'use client';

import { useState, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TaskForm } from '@/components/dashboard/task/TaskForm';
import { TaskTable } from '@/components/dashboard/task/TaskTable';
import { TaskProfile, UserProfile } from '@/ai/schemas';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useTasks } from '@/contexts/TasksContext';
import { listUsersFlowWrapper as listUsers } from '@/ai/flows/user-management';

export default function ListaPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskProfile | null>(null);
  const { tasks, loading, error, refreshTasks } = useTasks();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.uid) {
        setIsLoadingUsers(true);
        listUsers({ actor: currentUser.uid })
          .then(setUsers)
          .catch((err) => console.error("Failed to load users", err))
          .finally(() => setIsLoadingUsers(false));
    }
  }, [currentUser]);

  const handleModalOpenChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setSelectedTask(null);
    }
  };

  const handleTaskAction = () => {
    handleModalOpenChange(false);
    refreshTasks();
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
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-foreground">{selectedTask ? 'Editar tarefa' : 'Criar nova tarefa'}</DialogTitle>
              <DialogDescription>
                {selectedTask ? 'Altere as informações da tarefa abaixo.' : 'Preencha as informações abaixo para adicionar uma nova tarefa.'}
              </DialogDescription>
            </DialogHeader>
            <TaskForm onTaskAction={handleTaskAction} task={selectedTask} users={users} />
          </DialogContent>
        </Dialog>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Minha lista de tarefas</h1>
          <p className="text-muted-foreground mt-1">
            Visualize e gerencie todas as suas tarefas em um só lugar.
          </p>
        </div>
        <Button 
          onClick={handleAddTask}
          className="bg-task-primary text-black px-4 py-2 rounded-xl hover:bg-task-primary/90 transition-all duration-300 border border-transparent hover:border-task-primary/50 flex items-center justify-center font-semibold w-full sm:w-auto"
        >
          <PlusCircle className="mr-2 w-5 h-5" />
          Criar tarefa
        </Button>
      </div>

      <div className="bg-card p-4 sm:p-6 rounded-2xl border-border">
        <TaskTable 
            tasks={tasks}
            users={users} 
            isLoading={loading || isLoadingUsers} 
            error={error} 
            onRefresh={refreshTasks}
            onEdit={handleEditTask}
        />
      </div>
    </div>
  );
}
