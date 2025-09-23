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
  updateTaskInState: (updatedTask: TaskProfile) => void;
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
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        setTasks([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const refreshTasks = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const updateTaskInState = useCallback((updatedTask: TaskProfile) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    );
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      try {
        const result = await listTasks({ actor: currentUser.uid });
        setTasks(result);
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
    <TasksContext.Provider value={{ tasks, loading, error, refreshTasks, updateTaskInState }}>
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
