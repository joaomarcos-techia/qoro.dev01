
'use client';

import {
  CheckSquare,
  Home,
  List,
  LayoutGrid,
  Calendar,
} from 'lucide-react';
import { ModuleSidebar } from '@/components/dashboard/ModuleSidebar';
import type { NavItem, NavGroup } from '@/components/dashboard/ModuleSidebar';
import { usePathname } from 'next/navigation';

const taskNavGroup: NavGroup = {
    group: 'QoroTask', 
    icon: CheckSquare, 
    colorClass: 'bg-task-primary text-task-primary',
    module: 'task'
};

const taskNavItems: NavItem[] = [
    { href: '/dashboard/task/visao-geral', label: 'Visão Geral', icon: Home, permissionKey: 'qoroTask', plan: ['free', 'growth', 'performance'] },
    { href: '/dashboard/task/lista', label: 'Minha Lista', icon: List, permissionKey: 'qoroTask', plan: ['free', 'growth', 'performance'] },
    { href: '/dashboard/task/tarefas', label: 'Quadro', icon: LayoutGrid, permissionKey: 'qoroTask', plan: ['growth', 'performance'] },
    { href: '/dashboard/task/calendario', label: 'Calendário', icon: Calendar, permissionKey: 'qoroTask', plan: ['growth', 'performance'] },
];

export default function TaskLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isTarefasPage = pathname === '/dashboard/task/tarefas';

  return (
    <div className="flex h-full">
      <ModuleSidebar navGroup={taskNavGroup} navItems={taskNavItems} />
      <main className={`flex-1 p-4 md:p-8 ${isTarefasPage ? 'overflow-y-hidden' : 'overflow-y-auto'}`}>
        {children}
      </main>
    </div>
  );
}
