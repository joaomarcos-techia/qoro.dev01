
'use client';
import { BarChart3, CheckSquare, DollarSign, Users, TrendingUp, ListTodo, Activity, Folder, Settings, ArrowRight, Bell } from "lucide-react";

const MetricCard = ({ title, value, icon: Icon, color, change, changeType }: { title: string, value: string, icon: React.ElementType, color: string, change: string, changeType: 'up' | 'down' }) => {
    const changeColor = changeType === 'up' ? 'text-green-400' : 'text-red-400';
    return (
        <div className="bg-card/50 border border-border rounded-xl p-4 transition-all duration-300 hover:border-primary/50 hover:-translate-y-1 flex items-center">
            <div className={`p-2 rounded-lg ${color}/20 text-${color} mr-3 shadow-lg`}>
                <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{title}</p>
              <p className="text-lg font-bold text-foreground">{value}</p>
            </div>
        </div>
    )
}

const AppCard = ({ title, description, icon: Icon, color }: { title: string, description: string, icon: React.ElementType, color: string}) => (
    <div className="group bg-card/50 rounded-xl border border-border hover:border-primary/50 transition-all duration-200 flex flex-col h-full hover:-translate-y-1 p-4">
        <div className="flex items-center mb-2">
            <div className={`p-2 rounded-lg ${color}/20 text-${color} mr-3 shadow-lg`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <h4 className="text-sm font-bold text-foreground">{title}</h4>
            </div>
        </div>
        <p className="text-xs text-muted-foreground mb-3 flex-grow">
            {description}
        </p>
        <div className="group/button w-full bg-secondary text-secondary-foreground py-1.5 px-3 rounded-md hover:bg-secondary/80 transition-colors flex items-center justify-center text-xs font-medium">
            <span>Acessar</span>
            <ArrowRight className="w-3 h-3 ml-1 transform transition-transform duration-300 group-hover/button:translate-x-0.5" />
        </div>
    </div>
)

export function DashboardMockup() {
    return (
        <div className="w-full h-full aspect-[16/10] rounded-xl bg-card flex flex-col overflow-hidden border-2 border-border shadow-2xl text-[10px] sm:text-xs">
            {/* Header */}
            <header className="bg-card/80 border-b border-border flex items-center justify-between h-12 px-4 flex-shrink-0">
                 <div className="flex items-center">
                    <h1 className="text-lg font-bold text-foreground cursor-pointer">Qoro</h1>
                </div>
                 <div className="flex items-center space-x-2">
                    <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary transition-all duration-300">
                        <Settings className="w-4 h-4" />
                    </button>
                     <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary transition-all duration-300">
                        <Bell className="w-4 h-4"/>
                    </button>
                    <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-semibold">
                        E
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 overflow-hidden">
                <div className="mb-4">
                    <h2 className="text-xl font-bold text-foreground">
                    Bem-vindo à Qoro!
                    </h2>
                    <p className="text-muted-foreground text-xs">
                    Gerencie toda a sua empresa em uma única plataforma integrada
                    </p>
                </div>
                
                {/* Metrics Section */}
                <div className="mb-6">
                    <h3 className="text-sm font-bold text-foreground mb-3">Métricas e Insights Rápidos</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                        <MetricCard title="Total de Clientes" value="124" icon={Users} color="text-crm-primary" change="+12.5%" changeType="up" />
                        <MetricCard title="Leads no Funil" value="32" icon={TrendingUp} color="text-crm-primary" change="+5" changeType="up" />
                        <MetricCard title="Tarefas Pendentes" value="18" icon={ListTodo} color="text-task-primary" change="-2" changeType="down" />
                        <MetricCard title="Saldo em Contas" value="R$ 78.4k" icon={DollarSign} color="text-finance-primary" change="+R$ 5.2k" changeType="up" />
                    </div>
                </div>
                
                {/* Apps Section */}
                 <div>
                    <h3 className="text-sm font-bold text-foreground mb-3">Seus Aplicativos Qoro</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <AppCard title="QoroCRM" description="Gestão de funil de vendas e conversão." icon={Users} color="text-crm-primary" />
                        <AppCard title="QoroPulse" description="Revele insights com o poder da IA." icon={Activity} color="text-pulse-primary" />
                        <AppCard title="QoroTask" description="Gestão de tarefas e produtividade." icon={CheckSquare} color="text-task-primary" />
                        <AppCard title="QoroFinance" description="Controle financeiro completo." icon={DollarSign} color="text-finance-primary" />
                    </div>
                </div>
            </main>
        </div>
    );
}
