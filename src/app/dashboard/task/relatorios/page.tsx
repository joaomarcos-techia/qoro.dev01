
'use client';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getDashboardMetrics } from '@/ai/flows/task-management';
import { Bar, BarChart, CartesianGrid, Pie, PieChart, Cell } from 'recharts';
import CustomXAxis from '@/components/utils/CustomXAxis';
import CustomYAxis from '@/components/utils/CustomYAxis';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ListTodo, Check, AlertOctagon, Clock, Loader2, ServerCrash } from 'lucide-react';
import type { TaskProfile } from '@/ai/schemas';

interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  pendingTasks: number;
  tasksByPriority: Record<string, number>;
}

const priorityMap: Record<TaskProfile['priority'], { label: string; color: string }> = {
    low: { label: 'Baixa', color: 'hsl(var(--chart-2))' },
    medium: { label: 'Média', color: 'hsl(var(--chart-3))' },
    high: { label: 'Alta', color: 'hsl(var(--chart-4))' },
    urgent: { label: 'Urgente', color: 'hsl(var(--chart-1))' },
};

const MetricCard = ({ title, value, icon: Icon, isLoading, colorClass }: { title: string, value: string | number, icon: React.ElementType, isLoading: boolean, colorClass?: string }) => (
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

export default function RelatoriosPage() {
  const [metrics, setMetrics] = useState<TaskMetrics | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        getDashboardMetrics({ actor: currentUser.uid })
            .then(setMetrics)
            .catch((err) => {
                console.error("Erro ao buscar métricas de tarefas:", err);
                setError('Não foi possível carregar os dados dos relatórios.');
            })
            .finally(() => setIsLoading(false));
    }
  }, [currentUser]);

  const priorityChartData = Object.entries(metrics?.tasksByPriority || {}).map(([name, value]) => ({
      name: priorityMap[name as TaskProfile['priority']]?.label || name,
      value,
      fill: priorityMap[name as TaskProfile['priority']]?.color || 'hsl(var(--muted))'
  }));

  const renderContent = () => {
    if (isLoading) {
        return (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="mt-4 text-muted-foreground">Gerando relatórios de produtividade...</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Total de Tarefas" value={metrics?.totalTasks ?? 0} icon={ListTodo} isLoading={isLoading} />
                <MetricCard title="Tarefas Concluídas" value={metrics?.completedTasks ?? 0} icon={Check} isLoading={isLoading} colorClass="bg-green-500 shadow-green-500/30"/>
                <MetricCard title="Tarefas Pendentes" value={metrics?.pendingTasks ?? 0} icon={Clock} isLoading={isLoading} colorClass="bg-yellow-500 shadow-yellow-500/30"/>
                <MetricCard title="Tarefas Atrasadas" value={metrics?.overdueTasks ?? 0} icon={AlertOctagon} isLoading={isLoading} colorClass="bg-red-500 shadow-red-500/30"/>
            </div>

            <Card className="lg:col-span-2 bg-card p-6 rounded-2xl border-border">
                <CardHeader>
                    <CardTitle>Distribuição por Prioridade</CardTitle>
                    <CardDescription>Como suas tarefas estão distribuídas por nível de prioridade.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <ChartContainer config={{}} className="min-h-[300px] w-full max-w-[400px]">
                        <PieChart>
                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                            <Pie data={priorityChartData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
                                {priorityChartData.map((entry) => (
                                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    );
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Relatórios de Produtividade</h1>
                <p className="text-muted-foreground">
                    Analise o desempenho e a distribuição das suas tarefas.
                </p>
            </div>
        </div>
        {renderContent()}
    </div>
  );
}
