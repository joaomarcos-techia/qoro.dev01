
'use client';
import { BarChart3, CheckSquare, DollarSign, Users, TrendingUp, ListTodo, Activity, Folder, Settings, ArrowRight, Bell } from "lucide-react";
import { Logo } from "../ui/logo";

const Placeholder = ({ className }: { className?: string }) => <div className={`bg-white/10 rounded-full ${className}`} />;

const MetricCard = ({ icon: Icon, color }: { icon: React.ElementType, color: string}) => {
    return (
        <div className="bg-card/50 border border-border rounded-xl p-4 transition-all duration-300 hover:border-primary/50 hover:-translate-y-1 flex items-center">
            <div className={`p-2 rounded-lg ${color}/20 text-${color} mr-3 shadow-lg flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="w-full space-y-1.5">
              <Placeholder className="w-3/4 h-2.5" />
              <Placeholder className="w-1/2 h-3.5" />
            </div>
        </div>
    )
}

const AppCard = ({ title, icon: Icon, color }: { title: string, icon: React.ElementType, color: string}) => (
    <div className="group bg-card/50 rounded-xl border border-border hover:border-primary/50 transition-all duration-200 flex flex-col h-full hover:-translate-y-1 p-4">
        <div className="flex items-center mb-3">
            <div className={`p-2 rounded-lg ${color}/20 text-${color} mr-3 shadow-lg flex-shrink-0`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <h4 className="text-sm font-bold text-foreground">{title}</h4>
            </div>
        </div>
        <div className="space-y-1.5 mb-3 flex-grow">
            <Placeholder className="w-full h-2" />
            <Placeholder className="w-5/6 h-2" />
        </div>
        <div className="w-full bg-secondary py-1.5 px-3 rounded-md flex items-center justify-center text-xs font-medium">
            <Placeholder className="w-1/3 h-3" />
        </div>
    </div>
)

export function DashboardMockup() {
    return (
        <div className="w-full h-full aspect-[16/10] rounded-xl bg-card flex flex-col overflow-hidden border-2 border-border shadow-2xl text-[10px]">
            {/* Header */}
            <header className="bg-card/80 border-b border-border flex items-center justify-between h-12 px-4 flex-shrink-0">
                 <div className="flex items-center">
                    <Logo height={24}/>
                </div>
                 <div className="flex items-center space-x-2">
                    <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary transition-all duration-300">
                        <Settings className="w-4 h-4" />
                    </button>
                     <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary transition-all duration-300">
                        <Bell className="w-4 h-4"/>
                    </button>
                    <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-semibold">
                        <Users className="w-4 h-4" />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 overflow-hidden">
                <div className="mb-4 space-y-2">
                    <Placeholder className="w-1/3 h-5" />
                    <Placeholder className="w-1/2 h-3" />
                </div>
                
                {/* Metrics Section */}
                <div className="mb-6">
                    <Placeholder className="w-1/4 h-4 mb-3" />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                        <MetricCard icon={Users} color="text-crm-primary" />
                        <MetricCard icon={TrendingUp} color="text-crm-primary" />
                        <MetricCard icon={ListTodo} color="text-task-primary" />
                        <MetricCard icon={DollarSign} color="text-finance-primary" />
                    </div>
                </div>
                
                {/* Apps Section */}
                 <div>
                    <Placeholder className="w-1/4 h-4 mb-3" />
                    <div className="grid grid-cols-2 gap-2">
                        <AppCard title="QoroCRM" icon={Users} color="text-crm-primary" />
                        <AppCard title="QoroPulse" icon={Activity} color="text-pulse-primary" />
                        <AppCard title="QoroTask" icon={CheckSquare} color="text-task-primary" />
                        <AppCard title="QoroFinance" icon={DollarSign} color="text-finance-primary" />
                    </div>
                </div>
            </main>
        </div>
    );
}
