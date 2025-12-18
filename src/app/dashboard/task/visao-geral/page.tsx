
'use client';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getOverviewMetrics } from '@/ai/flows/task-management';
import { TaskProfile, UserProfile } from '@/ai/schemas';
import { ListTodo, Check, Clock, AlertOctagon, Loader2, ServerCrash, Edit, Flag, Calendar as CalendarIcon, User as UserIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
  } from '@/components/ui/dialog';
import { TaskForm } from '@/components/dashboard/task/TaskForm';
import { listUsers } from '@/ai/flows/user-management';


interface OverviewMetrics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  overdue: TaskProfile[];
  dueSoon: TaskProfile[];
}

const MetricCard = ({ title, value, icon: Icon, colorClass, isLoading }: { title: string, value: string | number, icon: React.ElementType, colorClass?: string, isLoading: boolean }) => (
  <div className="bg-card p-6 rounded-2xl border border-border flex items-center">
    <div className={`p-3 rounded-xl text-black mr-4 shadow-lg ${colorClass || 'bg-task-primary shadow-task-primary/30'}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-muted-foreground text-sm font-medium">{title}</p>
      {isLoading ? (
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin mt-1" />
      ) : (
        <p className="text-3xl font-bold text-foreground">{value}</p>
      )}
    </div>
  </div>
);

const TaskRow = ({ task, onSelect }: { task: TaskProfile, onSelect: (task: TaskProfile) => void }) => (
    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer" onClick={() => onSelect(task)}>
      <div className="flex-grow pr-4">
        <p className="font-medium text-foreground truncate">{task.title}</p>
        <div className="flex items-center text-xs text-muted-foreground gap-4 mt-1">
            {task.responsibleUserName && <div className="flex items-center"><UserIcon className="w-3 h-3 mr-1.5"/>{task.responsibleUserName}</div>}
            <div className={`flex items-center`}><Flag className="w-3 h-3 mr-1.5"/>{task.priority}</div>
        </div>
      </div>
      <div className="flex items-center text-sm">
        <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground"/>
        {task.dueDate ? format(parseISO(task.dueDate.toString()), 'dd MMM', { locale: ptBR }) : 'Sem data'}
      </div>
    </div>
);

export default function VisaoGeralPage() {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
        if (!currentUser?.uid) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const [metricsData, usersData] = await Promise.all([
                getOverviewMetrics({ actor: currentUser.uid }),
                listUsers({ actor: currentUser.uid })
            ]);
            setMetrics(metricsData);
            setUsers(usersData);
        } catch (err: any) {
            setError(err.message || 'Não foi possível carregar os dados.');
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [currentUser?.uid, refreshTrigger]);

  const handleSelectTask = (task: TaskProfile) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };
  
  const handleTaskAction = () => {
    setIsModalOpen(false);
    setRefreshTrigger(prev => prev + 1); // Trigger a refresh
  }

  const renderContent = () => {
    if (isLoading) {
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-12 h-12 text-task-primary animate-spin" />
            <p className="mt-4 text-muted-foreground">Carregando sua visão geral...</p>
          </div>
        );
    }  
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-destructive/10 rounded-lg p-8 text-center border border-destructive">
          <ServerCrash className="w-16 h-16 text-destructive mb-4" />
          <h3 className="text-xl font-bold text-destructive">Ocorreu um erro</h3>
          <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      );
    }
    
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Total de tarefas" value={metrics?.totalTasks ?? 0} icon={ListTodo} isLoading={isLoading} />
                <MetricCard title="Concluídas" value={metrics?.completedTasks ?? 0} icon={Check} isLoading={isLoading} colorClass="bg-green-500 shadow-green-500/30"/>
                <MetricCard title="Pendentes" value={metrics?.pendingTasks ?? 0} icon={Clock} isLoading={isLoading} colorClass="bg-yellow-500 shadow-yellow-500/30"/>
                <MetricCard title="Atrasadas" value={metrics?.overdueTasks ?? 0} icon={AlertOctagon} isLoading={isLoading} colorClass="bg-red-500 shadow-red-500/30"/>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-card p-6 rounded-2xl border-border">
                    <h3 className="text-lg font-bold text-red-400 mb-4">Atenção imediata (atrasadas)</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {metrics?.overdue && metrics.overdue.length > 0 ? (
                            metrics.overdue.map(task => <TaskRow key={task.id} task={task} onSelect={handleSelectTask} />)
                        ) : (
                            <p className="text-muted-foreground text-sm text-center py-4">Nenhuma tarefa atrasada. Bom trabalho!</p>
                        )}
                    </div>
                </div>
                 <div className="bg-card p-6 rounded-2xl border-border">
                    <h3 className="text-lg font-bold text-yellow-400 mb-4">Próximos prazos (7 dias)</h3>
                     <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {metrics?.dueSoon && metrics.dueSoon.length > 0 ? (
                            metrics.dueSoon.map(task => <TaskRow key={task.id} task={task} onSelect={handleSelectTask} />)
                        ) : (
                            <p className="text-muted-foreground text-sm text-center py-4">Nenhuma tarefa com vencimento próximo.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-foreground">Detalhes da tarefa</DialogTitle>
                    <DialogDescription>Visualize os detalhes e adicione comentários. Para editar, acesse a "Minha lista".</DialogDescription>
                </DialogHeader>
                <TaskForm onTaskAction={handleTaskAction} task={selectedTask} users={users} viewOnly />
            </DialogContent>
        </Dialog>

        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground">Visão geral de tarefas</h1>
                    <p className="text-muted-foreground mt-1">
                        Seu painel rápido de produtividade e prioridades.
                    </p>
                </div>
            </div>
            {renderContent()}
        </div>
    </>
  );
}
