

'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import { Loader2, ServerCrash, CheckCircle } from 'lucide-react';
import { TaskKanbanBoard } from '@/components/dashboard/task/TaskKanbanBoard';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { listTasks, updateTaskStatus } from '@/ai/flows/task-management';
import { TaskProfile } from '@/ai/schemas';

export default function ProgressoPage() {
  const [tasks, setTasks] = useState<TaskProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchTasks = () => {
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
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchTasks();
    }
  }, [currentUser]);

  const showTemporaryFeedback = (message: string) => {
    setFeedbackMessage(message);
    setTimeout(() => {
        setFeedbackMessage(null);
    }, 5000); // A mensagem desaparece após 5 segundos
  };

  const handleMoveTask = (taskId: string, newStatus: TaskProfile['status']) => {
    startTransition(async () => {
        if (!currentUser) return;
        
        const originalTasks = [...tasks];
        
        setTasks(prev => prev.map(t => t.id === taskId ? {...t, status: newStatus} : t));

        if (newStatus === 'done') {
            showTemporaryFeedback("Tarefa concluída! Ela será ocultada deste quadro em 24 horas.");
        }

        try {
            await updateTaskStatus({ taskId, status: newStatus, actor: currentUser.uid });
        } catch (err) {
            console.error("Failed to move task", err);
            setTasks(originalTasks);
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
          <p className="mt-4 text-gray-600">Carregando quadro de progresso...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] bg-red-50 rounded-lg p-8 text-center">
          <ServerCrash className="w-16 h-16 text-red-500 mb-4" />
          <h3 className="text-xl font-bold text-red-700">Ocorreu um erro</h3>
          <p className="text-gray-600 mt-2">{error}</p>
        </div>
      );
    }

    return <TaskKanbanBoard columns={columns} onMoveTask={handleMoveTask} />;
  };

  return (
    <div className='h-[calc(100vh-120px)] flex flex-col'>
      <div className="flex-shrink-0">
        <div className="flex justify-between items-center mb-6">
            <div>
            <h1 className="text-3xl font-bold text-black">Progresso das Tarefas</h1>
            <p className="text-gray-600">
                Visualize e mova suas tarefas entre as fases do fluxo de trabalho.
            </p>
            </div>
             {isPending && <Loader2 className="w-6 h-6 text-primary animate-spin" />}
        </div>
        {feedbackMessage && (
            <div className="mb-4 p-3 rounded-lg flex items-center text-sm bg-green-100 text-green-800 border border-green-200 shadow-sm">
                <CheckCircle className="w-5 h-5 mr-3" />
                <span>{feedbackMessage}</span>
            </div>
        )}
      </div>
      <div className="flex-grow overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}
