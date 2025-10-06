
'use client';

import { useState, useEffect, useMemo, useTransition, useCallback } from 'react';
import { Loader2, ServerCrash, CheckCircle, AlertCircle, PlusCircle } from 'lucide-react';
import { TaskKanbanBoard } from '@/components/dashboard/task/TaskKanbanBoard';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { updateTaskStatus, deleteTask, updateTask } from '@/ai/flows/task-management';
import { listUsers } from '@/ai/flows/user-management';
import { TaskProfile, UserProfile, Subtask } from '@/ai/schemas';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TaskForm } from '@/components/dashboard/task/TaskForm';
import { Button } from '@/components/ui/button';
import { useTasks } from '@/contexts/TasksContext';

export default function ProgressoPage() {
  const { tasks, loading, error, refreshTasks, updateTaskInState } = useTasks();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [feedback, setFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [isPending, startTransition] = useTransition();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskProfile | null>(null);
  const [isViewOnlyModal, setIsViewOnlyModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
        setIsLoadingUsers(true);
        listUsers({ actor: currentUser.uid })
          .then(setUsers)
          .catch((err) => console.error("Failed to load users", err))
          .finally(() => setIsLoadingUsers(false));
    } else {
        setIsLoadingUsers(false);
    }
  }, [currentUser]);

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
    refreshTasks();
  };

  const handleSelectTask = (task: TaskProfile) => {
    setSelectedTask(task);
    setIsViewOnlyModal(true); // Always open in view-only from kanban
    setIsModalOpen(true);
  };
  
  const handleAddTask = () => {
    setSelectedTask(null);
    setIsViewOnlyModal(false); // Open in edit mode for new task
    setIsModalOpen(true);
  }

  const handleMoveTask = (taskId: string, newStatus: TaskProfile['status']) => {
    startTransition(async () => {
        if (!currentUser) return;
        
        const originalTasks = [...tasks];
        
        // Optimistic UI update
        const taskToUpdate = tasks.find(t => t.id === taskId);
        if (taskToUpdate) {
            const updatedTask = { ...taskToUpdate, status: newStatus };
            updateTaskInState(updatedTask);
        }

        try {
            await updateTaskStatus({ taskId, status: newStatus, actor: currentUser.uid });
            // The state is already updated optimistically, so we don't need a full refresh.
            if (newStatus === 'done') {
                showTemporaryFeedback("Tarefa concluída!");
            }
        } catch (err) {
            console.error("Failed to move task", err);
            // Revert on failure
            updateTaskInState(originalTasks.find(t => t.id === taskId)!); 
            showTemporaryFeedback("Erro ao mover a tarefa.", "error");
        }
    });
  };
  
  const handleUpdateSubtask = (taskId: string, subtasks: Subtask[]) => {
      startTransition(async () => {
          if (!currentUser) return;

          const taskToUpdate = tasks.find(t => t.id === taskId);
          if (!taskToUpdate) return;
          
          const originalTask = { ...taskToUpdate };
          
          // Optimistic UI update
          updateTaskInState({ ...taskToUpdate, subtasks });

          try {
              await updateTask({ 
                  ...taskToUpdate, 
                  subtasks, 
                  id: taskId, 
                  actor: currentUser.uid, 
                  dueDate: taskToUpdate.dueDate ? new Date(taskToUpdate.dueDate).toISOString() : null,
                  comments: taskToUpdate.comments || []
              });
          } catch(err) {
              console.error("Failed to update subtask", err);
              updateTaskInState(originalTask); // Revert
              showTemporaryFeedback("Erro ao atualizar o checklist.", "error");
          }
      });
  };

  const handleDeleteTask = (taskId: string) => {
    startTransition(async () => {
        if (!currentUser) return;
        
        try {
            await deleteTask({ taskId, actor: currentUser.uid });
            refreshTasks();
            showTemporaryFeedback("Tarefa excluída com sucesso.");
        } catch (err) {
            console.error("Failed to delete task", err);
            showTemporaryFeedback("Erro ao excluir a tarefa.", "error");
        }
    });
  };
  
  const columns = useMemo(() => {
    const statusOrder: TaskProfile['status'][] = ['todo', 'in_progress', 'review', 'done'];
    const statusNames: Record<TaskProfile['status'], string> = {
        todo: 'A fazer',
        in_progress: 'Em progresso',
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
    if (loading || isLoadingUsers) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <Loader2 className="w-12 h-12 text-task-primary animate-spin" />
          <p className="mt-4 text-muted-foreground">Carregando quadro de progresso...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-destructive/10 rounded-lg p-8 text-center border border-destructive">
          <ServerCrash className="w-16 h-16 text-destructive mb-4" />
          <h3 className="text-xl font-bold text-destructive">Ocorreu um erro</h3>
          <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      );
    }

    return <TaskKanbanBoard 
        columns={columns} 
        users={users} 
        onMoveTask={handleMoveTask} 
        onDeleteTask={handleDeleteTask} 
        onSelectTask={handleSelectTask}
        onUpdateSubtask={handleUpdateSubtask}
    />;
  };

  return (
    <div className='h-full flex flex-col'>
        <Dialog open={isModalOpen} onOpenChange={handleModalOpenChange}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
               <DialogTitle className="text-2xl font-bold text-foreground">
                {selectedTask ? (isViewOnlyModal ? 'Detalhes da tarefa' : 'Editar tarefa') : 'Criar nova tarefa'}
              </DialogTitle>
              <DialogDescription>
                {isViewOnlyModal ? "Visualize os detalhes e adicione comentários. Para editar, acesse a minha lista." : "Preencha as informações para criar ou editar a tarefa."}
              </DialogDescription>
            </DialogHeader>
            <TaskForm onTaskAction={handleTaskAction} task={selectedTask} users={users} viewOnly={isViewOnlyModal}/>
          </DialogContent>
        </Dialog>

      <div className="flex-shrink-0">
        <div className="flex justify-between items-center mb-6">
            <div>
            <h1 className="text-4xl font-bold text-foreground">Quadro de tarefas</h1>
            <p className="text-muted-foreground">
                Visualize e mova suas tarefas entre as fases do fluxo de trabalho.
            </p>
            </div>
            <div className="flex items-center gap-4">
                {isPending && <Loader2 className="w-6 h-6 text-task-primary animate-spin" />}
                 <Button onClick={handleAddTask} className="bg-task-primary text-black px-4 py-2 rounded-xl hover:bg-task-primary/90 transition-all duration-300 border border-transparent hover:border-task-primary/50 flex items-center justify-center font-semibold">
                    <PlusCircle className="mr-2 w-5 h-5" />
                    Criar tarefa
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
      <div className="flex-grow overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
}
