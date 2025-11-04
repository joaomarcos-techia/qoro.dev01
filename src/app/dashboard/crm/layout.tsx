
'use client';

import {
  Users,
  LayoutGrid,
  FileText,
  Wrench,
  Package,
} from 'lucide-react';
import { ModuleSidebar } from '@/components/dashboard/ModuleSidebar';
import type { NavItem, NavGroup } from '@/components/dashboard/ModuleSidebar';

const crmNavGroup: NavGroup = {
  group: 'QoroCRM',
  icon: Users,
  colorClass: 'bg-crm-primary text-crm-primary',
  module: 'crm',
};

const crmNavItems: NavItem[] = [
  { href: '/dashboard/crm/clientes', label: 'Clientes', icon: Users, permissionKey: 'qoroCrm', plan: ['free', 'growth', 'performance'] },
  { href: '/dashboard/crm/funil', label: 'Funil', icon: LayoutGrid, permissionKey: 'qoroCrm', plan: ['free', 'growth', 'performance'] },
  { href: '/dashboard/crm/produtos', label: 'Produtos', icon: Package, permissionKey: 'qoroCrm', plan: ['growth', 'performance'] },
  { href: '/dashboard/crm/servicos', label: 'Serviços', icon: Wrench, permissionKey: 'qoroCrm', plan: ['growth', 'performance'] },
  { href: '/dashboard/crm/orcamentos', label: 'Orçamentos', icon: FileText, permissionKey: 'qoroCrm', plan: ['performance'] },
];

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      <ModuleSidebar navGroup={crmNavGroup} navItems={crmNavItems} />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
