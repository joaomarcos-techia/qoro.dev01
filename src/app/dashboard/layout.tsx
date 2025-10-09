
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  LayoutGrid,
  CheckSquare,
  Calendar,
  DollarSign,
  Activity,
  ChevronLeft,
  FileText,
  Wrench,
  LayoutDashboard,
  ArrowLeftRight,
  Receipt,
  Landmark,
  Truck,
  List,
  GitCompareArrows,
  Loader2,
  Package,
  Home,
  Lock,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Header } from '@/components/dashboard/Header';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { PulseSidebar } from '@/components/dashboard/pulse/PulseSidebar';
import { TasksProvider } from '@/contexts/TasksContext';
import { PlanProvider, usePlan } from '@/contexts/PlanContext';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permissionKey: 'qoroCrm' | 'qoroTask' | 'qoroFinance' | 'qoroPulse';
  plan: ('free' | 'growth' | 'performance')[];
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
        { href: '/dashboard/crm/clientes', label: 'Clientes', icon: Users, permissionKey: 'qoroCrm', plan: ['free', 'growth', 'performance'] },
        { href: '/dashboard/crm/funil', label: 'Funil', icon: LayoutGrid, permissionKey: 'qoroCrm', plan: ['free', 'growth', 'performance'] },
        { href: '/dashboard/crm/produtos', label: 'Produtos', icon: Package, permissionKey: 'qoroCrm', plan: ['growth', 'performance'] },
        { href: '/dashboard/crm/servicos', label: 'Serviços', icon: Wrench, permissionKey: 'qoroCrm', plan: ['growth', 'performance'] },
        { href: '/dashboard/crm/orcamentos', label: 'Orçamentos', icon: FileText, permissionKey: 'qoroCrm', plan: ['growth', 'performance'] },
    ],
    task: [
        { href: '/dashboard/task/visao-geral', label: 'Visão Geral', icon: Home, permissionKey: 'qoroTask', plan: ['free', 'growth', 'performance'] },
        { href: '/dashboard/task/lista', label: 'Minha Lista', icon: List, permissionKey: 'qoroTask', plan: ['free', 'growth', 'performance'] },
        { href: '/dashboard/task/tarefas', label: 'Quadro', icon: LayoutGrid, permissionKey: 'qoroTask', plan: ['growth', 'performance'] },
        { href: '/dashboard/task/calendario', label: 'Calendário', icon: Calendar, permissionKey: 'qoroTask', plan: ['growth', 'performance'] },
    ],
    finance: [
        { href: '/dashboard/finance/transacoes', label: 'Transações', icon: ArrowLeftRight, permissionKey: 'qoroFinance', plan: ['free', 'growth', 'performance'] },
        { href: '/dashboard/finance/contas', label: 'Contas', icon: Landmark, permissionKey: 'qoroFinance', plan: ['free', 'growth', 'performance'] },
        { href: '/dashboard/finance/contas-a-pagar', label: 'A pagar/receber', icon: Receipt, permissionKey: 'qoroFinance', plan: ['growth', 'performance'] },
        { href: '/dashboard/finance/fornecedores', label: 'Fornecedores', icon: Truck, permissionKey: 'qoroFinance', plan: ['performance'] },
        { href: '/dashboard/finance/conciliacao', label: 'Conciliação', icon: GitCompareArrows, permissionKey: 'qoroFinance', plan: ['performance'] },
    ],
}


function ModuleSidebar() {
    const pathname = usePathname();
    const { permissions, isLoading, planId } = usePlan();
    const segments = pathname.split('/');
    const currentModule = segments.length > 2 ? segments[2] : 'home';
  
    if (currentModule === 'pulse') {
        return <PulseSidebar />;
    }
  
    if (!navConfig.hasOwnProperty(currentModule) || !navConfig[currentModule]) {
      return null;
    }
  
    const { group, icon: GroupIcon, colorClass } = navConfig[currentModule];
    const moduleItems = navItems[currentModule] || [];
    const [bgColor, textColor] = colorClass.split(' ');

    const isAllowed = (item: NavItem) => {
      if (isLoading || !planId) return false;
      const hasPlanPermission = item.plan.includes(planId);
      const hasRolePermission = permissions?.[item.permissionKey] ?? false;
      return hasPlanPermission && hasRolePermission;
    }
  
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
            {moduleItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const allowed = isAllowed(item);

              if (isLoading) {
                return (
                  <li key={item.href} className="flex items-center justify-between px-4 py-3 my-1 rounded-xl text-sm font-medium text-muted-foreground/50">
                    <div className="flex items-center">
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      {item.label}
                    </div>
                  </li>
                );
              }

              if (!allowed) {
                return (
                  <li key={item.href} className="relative">
                    <div className={cn(`flex items-center justify-between px-4 py-3 my-1 rounded-xl text-sm font-medium text-muted-foreground/50 cursor-not-allowed`)}>
                      <div className="flex items-center">
                        <item.icon className={cn(`w-5 h-5 mr-3 text-muted-foreground/50`)} />
                        {item.label}
                      </div>
                      <Lock className="w-4 h-4 text-muted-foreground/50" />
                    </div>
                  </li>
                )
              }

              return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(`flex items-center px-4 py-3 my-1 rounded-xl text-sm font-medium transition-all duration-200 group`,
                    isActive
                      ? `${bgColor} text-black shadow-lg shadow-${currentModule}-primary/30`
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <item.icon className={cn(`w-5 h-5 mr-3 transition-colors`, isActive ? 'text-black' : 'text-muted-foreground group-hover:text-foreground')} />
                  {item.label}
                </Link>
              </li>
            )})}
          </ul>
        </nav>
      </aside>
    );
  }

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const segments = pathname.split('/');
    const currentModule = segments.length > 2 ? segments[2] : 'home';
    const isPulseModule = currentModule === 'pulse';

  return (
    <TasksProvider>
        <div className="min-h-screen bg-black text-foreground">
            <Header />
            <div className="flex h-[calc(100vh-65px)]">
                <ModuleSidebar />
                <main className={cn(
                    "flex-1 overflow-y-auto",
                    isPulseModule ? 'p-0' : 'p-8' // Remove padding for pulse to allow full-screen chat
                )}>
                   {children}
                </main>
            </div>
        </div>
    </TasksProvider>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlanProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </PlanProvider>
  )
}
