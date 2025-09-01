
'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { listTasks } from '@/ai/flows/task-management';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { TaskProfile } from '@/ai/schemas';

interface TasksContextType {
  tasks: TaskProfile[];
  loading: boolean;
  error: string | null;
  refreshTasks: () => void;
}

const TasksContext = createContext<TasksContextType | null>(null);

export const TasksProvider = ({ children }: { children: React.ReactNode }) => {
  const [tasks, setTasks] = useState<TaskProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoading(true); 
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const refreshTasks = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!currentUser) {
        setTasks([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      console.log('🔄 Tentando carregar tarefas...');
      try {
        const result = await listTasks({ actor: currentUser.uid });
        const sortedTasks = result.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
        setTasks(sortedTasks);
        console.log('✅ Tarefas carregadas com sucesso:', sortedTasks.length);
      } catch (err: any) {
        console.error('❌ Erro ao carregar tarefas no contexto:', err);
        setError(err.message || 'Erro no servidor. Tente novamente em alguns minutos.');
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, [currentUser, refreshTrigger]);
  
  return (
    <TasksContext.Provider value={{ tasks, loading, error, refreshTasks }}>
      {children}
    </TasksContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks deve ser usado dentro de TasksProvider');
  }
  return context;
};
