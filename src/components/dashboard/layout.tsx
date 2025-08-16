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
  GitCompareArrows,
  ShoppingBag,
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
        color: 'bg-[#39FF14]',
        textColor: 'text-[#39FF14]',
        shadowColor: 'shadow-[#39FF14]/30',
    },
    task: {
        group: 'QoroTask',
        icon: CheckSquare,
        color: 'bg-[#FF6600]',
        textColor: 'text-[#FF6600]',
        shadowColor: 'shadow-[#FF6600]/30',
    },
    finance: {
        group: 'QoroFinance',
        icon: DollarSign,
        color: 'bg-[#00F0FF]',
        textColor: 'text-[#00F0FF]',
        shadowColor: 'shadow-[#00F0FF]/30',
    },
    pulse: {
        group: 'QoroPulse',
        icon: Activity,
        color: 'bg-[#9D4EDD]',
        textColor: 'text-[#9D4EDD]',
        shadowColor: 'shadow-[#9D4EDD]/30',
    },
};

const navItems: Record<string, NavItem[]> = {
    crm: [
        { href: '/dashboard/crm/dashboard', label: 'Dashboard', icon: BarChart3 },
        { href: '/dashboard/crm/clientes', label: 'Clientes', icon: Users },
        { href: '/dashboard/crm/funil', label: 'Funil', icon: LayoutGrid },
        { href: '/dashboard/crm/produtos', label: 'Produtos', icon: ShoppingCart },
        { href: '/dashboard/crm/servicos', label: 'Serviços', icon: Wrench },
        { href: '/dashboard/crm/orcamentos', label: 'Orçamentos', icon: FileText },
    ],
    task: [
        { href: '/dashboard/task/dashboard', label: 'Dashboard', icon: BarChart3 },
        { href: '/dashboard/task/minha-lista', label: 'Minha Lista', icon: List },
        { href: '/dashboard/task/tarefas', label: 'Progresso', icon: LayoutGrid },
        { href: '/dashboard/task/calendario', label: 'Calendário', icon: Calendar },
    ],
    finance: [
        { href: '/dashboard/finance/visao-geral', label: 'Visão Geral', icon: LayoutDashboard },
        { href: '/dashboard/finance/transacoes', label: 'Transações', icon: ArrowLeftRight },
        { href: '/dashboard/finance/contas-a-pagar', label: 'Contas a Pagar', icon: Receipt },
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
        return null; // No sidebar for home or other top-level pages
    }
    
    const { group, icon: GroupIcon, color, textColor, shadowColor } = moduleConfig;
    
    return (
        <aside className="w-64 flex-shrink-0 bg-black border-r border-[#2C2C2C] flex flex-col">
            <div className="p-4 border-b border-[#2C2C2C] space-y-4">
                <div className="flex items-center">
                    <div className={`p-3 rounded-xl text-black mr-4 shadow-lg ${color} ${shadowColor}`}>
                        <GroupIcon className="w-6 h-6" />
                    </div>
                    <h2 className={`text-xl font-bold ${textColor}`}>{group}</h2>
                </div>
                <Link href="/dashboard" className="flex items-center text-[#B3B3B3] hover:text-white transition-colors text-sm font-medium">
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
                            pathname.startsWith(item.href)
                            ? `${color} text-black shadow-lg ${shadowColor}`
                            : 'text-[#B3B3B3] hover:bg-[#2C2C2C] hover:text-white'
                        }`}
                        >
                        <item.icon className={`w-5 h-5 mr-3 transition-colors ${pathname.startsWith(item.href) ? 'text-black' : 'text-[#B3B3B3] group-hover:text-white'}`} />
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
    <div className="min-h-screen bg-black text-white">
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
