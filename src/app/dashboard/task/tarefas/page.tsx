
'use client';

import { useState, useEffect, useMemo, useTransition, useCallback } from 'react';
import { Loader2, ServerCrash, CheckCircle, AlertCircle, PlusCircle } from 'lucide-react';
import { TaskKanbanBoard } from '@/components/dashboard/task/TaskKanbanBoard';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { listTasks, updateTaskStatus, deleteTask } from '@/ai/flows/task-management';
import { listUsers } from '@/ai/flows/user-management';
import { TaskProfile, UserProfile } from '@/ai/schemas';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TaskForm } from '@/components/dashboard/task/TaskForm';
import { Button } from '@/components/ui/button';

export default function ProgressoPage() {
  const [tasks, setTasks] = useState<TaskProfile[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [isPending, startTransition] = useTransition();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskProfile | null>(null);

  const fetchAllData = useCallback(() => {
    if (currentUser) {
      setIsLoading(true);
      setError(null);
      Promise.all([
        listTasks({ actor: currentUser.uid }),
        listUsers({ actor: currentUser.uid })
      ]).then(([tasksData, usersData]) => {
        setTasks(tasksData);
        setUsers(usersData);
      }).catch((err) => {
        console.error(err);
        setError('Não foi possível carregar as tarefas.');
      }).finally(() => {
        setIsLoading(false);
      });
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
      fetchAllData();
    }
  }, [currentUser, fetchAllData]);

  const showTemporaryFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => {
        setFeedback(null);
    }, 5000);
  };
  
  const handleModalOpenChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
        setSelectedTask(null);
    }
  }

  const handleTaskAction = () => {
    handleModalOpenChange(false);
    fetchAllData();
  };

  const handleEditTask = (task: TaskProfile) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };
  
  const handleAddTask = () => {
    setSelectedTask(null);
    setIsModalOpen(true);
  }

  const handleMoveTask = (taskId: string, newStatus: TaskProfile['status']) => {
    startTransition(async () => {
        if (!currentUser) return;
        
        const originalTasks = [...tasks];
        
        setTasks(prev => prev.map(t => t.id === taskId ? {...t, status: newStatus} : t));

        if (newStatus === 'done') {
            showTemporaryFeedback("Tarefa concluída!");
        }

        try {
            await updateTaskStatus({ taskId, status: newStatus, actor: currentUser.uid });
        } catch (err) {
            console.error("Failed to move task", err);
            setTasks(originalTasks);
            showTemporaryFeedback("Erro ao mover a tarefa.", "error");
        }
    });
  };

  const handleDeleteTask = (taskId: string) => {
    startTransition(async () => {
        if (!currentUser) return;
        
        const originalTasks = [...tasks];
        
        setTasks(prev => prev.filter(t => t.id !== taskId));
        showTemporaryFeedback("Tarefa excluída com sucesso.");

        try {
            await deleteTask({ taskId, actor: currentUser.uid });
        } catch (err) {
            console.error("Failed to delete task", err);
            setTasks(originalTasks);
            showTemporaryFeedback("Erro ao excluir a tarefa.", "error");
        }
    });
  };
  
  const columns = useMemo(() => {
    const statusOrder: TaskProfile['status'][] = ['todo', 'in_progress', 'review', 'done'];
    const statusNames: Record<TaskProfile['status'], string> = {
        todo: 'A Fazer',
        in_progress: 'Em Progresso',
        review: 'Revisão',
        done: 'Concluída'
    };

    return statusOrder.map((status) => ({
      id: status,
      title: statusNames[status],
      tasks: tasks.filter((task) => task.status === status),
    }));
  }, [tasks]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="mt-4 text-muted-foreground">Carregando quadro de progresso...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] bg-destructive/10 rounded-lg p-8 text-center border border-destructive">
          <ServerCrash className="w-16 h-16 text-destructive mb-4" />
          <h3 className="text-xl font-bold text-destructive">Ocorreu um erro</h3>
          <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      );
    }

    return <TaskKanbanBoard columns={columns} users={users} onMoveTask={handleMoveTask} onDeleteTask={handleDeleteTask} onEditTask={handleEditTask} />;
  };

  return (
    <div className='h-[calc(100vh-120px)] flex flex-col'>
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
            <TaskForm onTaskAction={handleTaskAction} task={selectedTask} users={users}/>
          </DialogContent>
        </Dialog>

      <div className="flex-shrink-0">
        <div className="flex justify-between items-center mb-6">
            <div>
            <h1 className="text-4xl font-bold text-foreground">Quadro de Tarefas</h1>
            <p className="text-muted-foreground">
                Visualize e mova suas tarefas entre as fases do fluxo de trabalho.
            </p>
            </div>
            <div className="flex items-center gap-4">
                {isPending && <Loader2 className="w-6 h-6 text-primary animate-spin" />}
                 <Button onClick={handleAddTask} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-all duration-300 border border-transparent hover:border-primary/50 flex items-center justify-center font-semibold">
                    <PlusCircle className="mr-2 w-5 h-5" />
                    Criar Tarefa
                </Button>
            </div>
        </div>
        {feedback && (
            <div className={`mb-4 p-3 rounded-lg flex items-center text-sm ${feedback.type === 'success' ? 'bg-green-800/20 text-green-300 border border-green-500/30' : 'bg-red-800/20 text-red-300 border border-red-500/30'}`}>
                {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3" /> : <AlertCircle className="w-5 h-5 mr-3" />}
                <span>{feedback.message}</span>
            </div>
        )}
      </div>
      <div className="flex-grow overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}
