
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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Header } from '@/components/dashboard/Header';
import { PulseSidebar } from './pulse/_components/PulseSidebar';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
    group: string;
    icon: LucideIcon;
    color: string;
    textColor: string;
    shadowColor: string;
}

const navConfig: Record<string, NavGroup> = {
    crm: {
        group: 'QoroCRM',
        icon: Users,
        color: 'bg-crm-primary',
        textColor: 'text-crm-primary',
        shadowColor: 'shadow-crm-primary/30',
    },
    task: {
        group: 'QoroTask',
        icon: CheckSquare,
        color: 'bg-task-primary',
        textColor: 'text-task-primary',
        shadowColor: 'shadow-task-primary/30',
    },
    finance: {
        group: 'QoroFinance',
        icon: DollarSign,
        color: 'bg-finance-primary',
        textColor: 'text-finance-primary',
        shadowColor: 'shadow-finance-primary/30',
    },
    pulse: {
      group: 'QoroPulse',
      icon: Activity,
      color: 'bg-pulse-primary',
      textColor: 'text-pulse-primary',
      shadowColor: 'shadow-pulse-primary/30',
  },
};

const navItems: Record<string, NavItem[]> = {
    crm: [
        { href: '/dashboard/crm/clientes', label: 'Clientes', icon: Users },
        { href: '/dashboard/crm/funil', label: 'Funil', icon: LayoutGrid },
        { href: '/dashboard/crm/oportunidades', label: 'Oportunidades', icon: Target },
        { href: '/dashboard/crm/produtos', label: 'Produtos', icon: ShoppingCart },
        { href: '/dashboard/crm/servicos', label: 'Serviços', icon: Wrench },
        { href: '/dashboard/crm/orcamentos', label: 'Orçamentos', icon: FileText },
    ],
    task: [
        { href: '/dashboard/task/minha-lista', label: 'Minha Lista', icon: List },
        { href: '/dashboard/task/tarefas', label: 'Progresso', icon: LayoutGrid },
        { href: '/dashboard/task/calendario', label: 'Calendário', icon: Calendar },
    ],
    finance: [
        { href: '/dashboard/finance/visao-geral', label: 'Visão Geral', icon: LayoutDashboard },
        { href: '/dashboard/finance/transacoes', label: 'Transações', icon: ArrowLeftRight },
        { href: '/dashboard/finance/contas', label: 'Contas', icon: Landmark },
        { href: '/dashboard/finance/conciliacao', label: 'Conciliação', icon: GitCompareArrows },
        { href: '/dashboard/finance/fornecedores', label: 'Fornecedores', icon: Truck },
    ],
    pulse: []
}


export default function DashboardLayout({ 
    children
}: { 
    children: React.ReactNode
}) {
  const pathname = usePathname();
  const segments = pathname.split('/');
  const currentModule = segments.length > 2 ? segments[2] : 'home';

  const renderSidebarContent = () => {
    if (currentModule === 'pulse') {
        return <PulseSidebar />;
    }
    
    const moduleConfig = navConfig[currentModule];
    const moduleItems = navItems[currentModule] || [];
    
    if (!moduleConfig) {
        return null;
    }
    
    const { group, icon: GroupIcon, color, textColor, shadowColor } = moduleConfig;
    
    return (
        <aside className="w-64 flex-shrink-0 bg-card border-r border-border flex flex-col">
            <div className="p-4 border-b border-border space-y-4">
                <div className="flex items-center">
                    <div className={`p-3 rounded-xl text-black mr-4 shadow-lg ${color} ${shadowColor}`}>
                        <GroupIcon className="w-6 h-6" />
                    </div>
                    <h2 className={`text-xl font-bold ${textColor}`}>{group}</h2>
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
                        className={`flex items-center px-4 py-3 my-1 rounded-xl text-sm font-medium transition-all duration-200 group ${
                            pathname === item.href
                            ? `${color} text-black shadow-lg ${shadowColor}`
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                        }`}
                        >
                        <item.icon className={`w-5 h-5 mr-3 transition-colors ${pathname === item.href ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'}`} />
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
    <div className="min-h-screen bg-black text-foreground">
      <Header />
      <div className="flex h-[calc(100vh-65px)]">
         {currentModule !== 'home' && renderSidebarContent()}
         <main className="flex-1 overflow-y-auto">
            <div className="p-8">
              {children}
            </div>
         </main>
      </div>
    </div>
  );
}
