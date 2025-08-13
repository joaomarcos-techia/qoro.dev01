
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  LayoutGrid,
  CheckSquare,
  ClipboardList,
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
    items: NavItem[];
}

const navConfig: Record<string, NavGroup> = {
    crm: {
        group: 'QoroCRM',
        icon: Users,
        color: 'bg-blue-500',
        items: [
            { href: '/dashboard/crm/dashboard', label: 'Dashboard', icon: BarChart3 },
            { href: '/dashboard/crm/clientes', label: 'Clientes', icon: Users },
            { href: '/dashboard/crm/funil', label: 'Funil', icon: LayoutGrid },
            { href: '/dashboard/crm/produtos', label: 'Produtos', icon: ShoppingCart },
            { href: '/dashboard/crm/servicos', label: 'Serviços', icon: Wrench },
            { href: '/dashboard/crm/orcamentos', label: 'Orçamentos', icon: FileText },
        ]
    },
    task: {
        group: 'QoroTask',
        icon: CheckSquare,
        color: 'bg-green-500',
        items: [
            { href: '/dashboard/task/dashboard', label: 'Dashboard', icon: BarChart3 },
            { href: '/dashboard/task/minha-lista', label: 'Minha Lista', icon: List },
            { href: '/dashboard/task/tarefas', label: 'Progresso', icon: LayoutGrid },
            { href: '/dashboard/task/calendario', label: 'Calendário', icon: Calendar },
        ]
    },
    finance: {
        group: 'QoroFinance',
        icon: DollarSign,
        color: 'bg-orange-500',
        items: [
            { href: '/dashboard/finance/visao-geral', label: 'Visão Geral', icon: LayoutDashboard },
            { href: '/dashboard/finance/transacoes', label: 'Transações', icon: ArrowLeftRight },
            { href: '/dashboard/finance/contas', label: 'Contas', icon: Landmark },
            { href: '/dashboard/finance/fornecedores', label: 'Fornecedores', icon: Truck },
        ]
    },
};


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
    
    const navData = navConfig[currentModule];
    if (!navData) {
        return null; // No sidebar for home or other top-level pages
    }
    
    const { group, icon: GroupIcon, color, items } = navData;
    
    return (
        <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col shadow-neumorphism-right">
            <div className="p-4 border-b border-gray-200 space-y-4">
                <div className="flex items-center">
                    <div className={`p-3 rounded-xl text-white mr-4 shadow-neumorphism ${color}`}>
                        <GroupIcon className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-black">{group}</h2>
                </div>
                <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-primary transition-colors text-sm font-medium">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    <span>Voltar ao Dashboard</span>
                </Link>
            </div>
            <nav className="flex-grow p-4 overflow-y-auto">
                <ul>
                    {items.map((item) => (
                    <li key={item.href}>
                        <Link
                        href={item.href}
                        className={`flex items-center px-4 py-3 my-1 rounded-xl text-sm font-medium transition-all duration-200 ${
                            pathname.startsWith(item.href)
                            ? 'bg-primary text-white shadow-neumorphism-inset'
                            : 'text-gray-700 hover:bg-gray-100 hover:shadow-neumorphism'
                        }`}
                        >
                        <item.icon className="w-5 h-5 mr-3" />
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <div className="flex h-[calc(100vh-64px)]">
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
