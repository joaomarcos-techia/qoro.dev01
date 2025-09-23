
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  LayoutGrid,
  CheckSquare,
  Calendar,
  BarChart3,
  DollarSign,
  Activity,
  ChevronLeft,
  FileText,
  ShoppingCart,
  Wrench,
  LayoutDashboard,
  ArrowLeftRight,
  Receipt,
  Landmark,
  Truck,
  List,
  GitCompareArrows,
  Target,
  Loader2,
  Package,
  Home
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Header } from '@/components/dashboard/Header';
import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback } from 'react';
import { PulseSidebar } from '@/components/dashboard/pulse/PulseSidebar';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { TasksProvider } from '@/contexts/TasksContext';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
    group: string;
    icon: LucideIcon;
    colorClass: string;
}

const navConfig: Record<string, NavGroup> = {
    crm: { group: 'QoroCRM', icon: Users, colorClass: 'bg-crm-primary text-crm-primary' },
    task: { group: 'QoroTask', icon: CheckSquare, colorClass: 'bg-task-primary text-task-primary' },
    finance: { group: 'QoroFinance', icon: DollarSign, colorClass: 'bg-finance-primary text-finance-primary' },
    pulse: { group: 'QoroPulse', icon: Activity, colorClass: 'bg-pulse-primary text-pulse-primary' },
};

const navItems: Record<string, NavItem[]> = {
    crm: [
        { href: '/dashboard/crm/clientes', label: 'Clientes', icon: Users },
        { href: '/dashboard/crm/funil', label: 'Funil', icon: LayoutGrid },
        { href: '/dashboard/crm/produtos', label: 'Produtos', icon: Package },
        { href: '/dashboard/crm/servicos', label: 'Serviços', icon: Wrench },
        { href: '/dashboard/crm/orcamentos', label: 'Orçamentos', icon: FileText },
        { href: '/dashboard/crm/relatorios', label: 'Relatórios', icon: BarChart3 },
    ],
    task: [
        { href: '/dashboard/task/visao-geral', label: 'Visão Geral', icon: Home },
        { href: '/dashboard/task/lista', label: 'Minha Lista', icon: List },
        { href: '/dashboard/task/tarefas', label: 'Quadro', icon: LayoutGrid },
        { href: '/dashboard/task/calendario', label: 'Calendário', icon: Calendar },
        { href: '/dashboard/task/relatorios', label: 'Relatórios', icon: BarChart3 },
    ],
    finance: [
        { href: '/dashboard/finance/transacoes', label: 'Transações', icon: ArrowLeftRight },
        { href: '/dashboard/finance/contas', label: 'Contas', icon: Landmark },
        { href: '/dashboard/finance/contas-a-pagar', label: 'Contas a Pagar/Receber', icon: Receipt },
        { href: '/dashboard/finance/fornecedores', label: 'Fornecedores', icon: Truck },
        { href: '/dashboard/finance/conciliacao', label: 'Conciliação', icon: GitCompareArrows },
        { href: '/dashboard/finance/relatorios', label: 'Relatórios', icon: BarChart3 },
    ],
}


export default function DashboardLayout({ 
    children
}: { 
    children: React.ReactNode
}) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const segments = pathname.split('/');
  const currentModule = segments.length > 2 ? segments[2] : 'home';
  
  const hasModuleSidebar = navConfig.hasOwnProperty(currentModule);

  const renderSidebarContent = () => {
    // Render a placeholder or loader on the server
    if (!isClient) {
        return (
             <aside className="w-64 flex-shrink-0 bg-card border-r border-border flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </aside>
        );
    }

    if (!hasModuleSidebar) {
        return null;
    }
    
    if (currentModule === 'pulse') {
        return <PulseSidebar />;
    }

    const moduleConfig = navConfig[currentModule];
    const moduleItems = navItems[currentModule] || [];
    
    if (!moduleConfig) {
        return null;
    }
    
    const { group, icon: GroupIcon, colorClass } = moduleConfig;
    const [bgColor, textColor] = colorClass.split(' ');

    return (
        <aside className="w-64 flex-shrink-0 bg-card border-r border-border flex flex-col">
            <div className="p-4 border-b border-border space-y-4">
                <div className="flex items-center">
                    <div className={cn('p-3 rounded-xl text-black mr-4 shadow-lg', bgColor, `shadow-${currentModule}-primary/30`)}>
                        <GroupIcon className="w-6 h-6" />
                    </div>
                    <h2 className={cn('text-xl font-bold', textColor)}>{group}</h2>
                </div>
                <Link href="/dashboard" className="flex items-center text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    <span>Voltar ao Dashboard</span>
                </Link>
            </div>
            <nav className="flex-grow p-4 overflow-y-auto">
                <ul>
                    {moduleItems.map((item) => (
                    <li key={item.href}>
                        <Link
                        href={item.href}
                        className={cn(`flex items-center px-4 py-3 my-1 rounded-xl text-sm font-medium transition-all duration-200 group`,
                            pathname === item.href
                            ? `${bgColor} text-black shadow-lg shadow-${currentModule}-primary/30`
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                        )}
                        >
                        <item.icon className={cn(`w-5 h-5 mr-3 transition-colors`, pathname === item.href ? 'text-black' : 'text-muted-foreground group-hover:text-foreground')} />
                        {item.label}
                        </Link>
                    </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
  };

  return (
    <TasksProvider>
        <div className="min-h-screen bg-black text-foreground">
        <Header />
        <div className="flex h-[calc(100vh-65px)]">
            {renderSidebarContent()}
            <main className="flex-1 overflow-y-auto p-8">
            {children}
            </main>
        </div>
        </div>
    </TasksProvider>
  );
}
