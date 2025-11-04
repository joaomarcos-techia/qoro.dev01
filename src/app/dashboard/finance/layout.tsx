
'use client';

import {
  DollarSign,
  ArrowLeftRight,
  Receipt,
  Landmark,
  Truck,
  GitCompareArrows,
} from 'lucide-react';
import { ModuleSidebar } from '@/components/dashboard/ModuleSidebar';
import type { NavItem, NavGroup } from '@/components/dashboard/ModuleSidebar';

const financeNavGroup: NavGroup = {
    group: 'QoroFinance', 
    icon: DollarSign, 
    colorClass: 'bg-finance-primary text-finance-primary',
    module: 'finance'
};

const financeNavItems: NavItem[] = [
    { href: '/dashboard/finance/transacoes', label: 'Transações', icon: ArrowLeftRight, permissionKey: 'qoroFinance', plan: ['free', 'growth', 'performance'] },
    { href: '/dashboard/finance/contas', label: 'Contas', icon: Landmark, permissionKey: 'qoroFinance', plan: ['growth', 'performance'] },
    { href: '/dashboard/finance/contas-a-pagar', label: 'A pagar/receber', icon: Receipt, permissionKey: 'qoroFinance', plan: ['growth', 'performance'] },
    { href: '/dashboard/finance/fornecedores', label: 'Fornecedores', icon: Truck, permissionKey: 'qoroFinance', plan: ['performance'] },
    { href: '/dashboard/finance/conciliacao', label: 'Conciliação', icon: GitCompareArrows, permissionKey: 'qoroFinance', plan: ['performance'] },
];


export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
        <ModuleSidebar navGroup={financeNavGroup} navItems={financeNavItems} />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            {children}
        </main>
    </div>
  );
}
