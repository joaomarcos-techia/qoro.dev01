
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
  Package
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Header } from '@/components/dashboard/Header';
import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback } from 'react';
import { PulseSidebar } from '@/components/dashboard/pulse/PulseSidebar';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserAccessInfo } from '@/ai/flows/user-management';
import { UserAccessInfo } from '@/ai/schemas';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  requiredPlan: ('free' | 'growth' | 'performance')[];
}

interface NavGroup {
    group: string;
    icon: LucideIcon;
}

const navConfig: Record<string, NavGroup> = {
    crm: { group: 'QoroCRM', icon: Users },
    task: { group: 'QoroTask', icon: CheckSquare },
    finance: { group: 'QoroFinance', icon: DollarSign },
};

const navItems: Record<string, NavItem[]> = {
    crm: [
        { href: '/dashboard/crm/clientes', label: 'Clientes', icon: Users, requiredPlan: ['free', 'growth', 'performance'] },
        { href: '/dashboard/crm/funil', label: 'Funil', icon: LayoutGrid, requiredPlan: ['free', 'growth', 'performance'] },
        { href: '/dashboard/crm/oportunidades', label: 'Oportunidades', icon: Target, requiredPlan: ['free', 'growth', 'performance'] },
        { href: '/dashboard/crm/produtos', label: 'Produtos', icon: Package, requiredPlan: ['free', 'growth', 'performance'] },
        { href: '/dashboard/crm/servicos', label: 'Serviços', icon: Wrench, requiredPlan: ['free', 'growth', 'performance'] },
        { href: '/dashboard/crm/orcamentos', label: 'Orçamentos', icon: FileText, requiredPlan: ['free', 'growth', 'performance'] },
        { href: '/dashboard/crm/relatorios', label: 'Relatórios', icon: BarChart3, requiredPlan: ['performance'] },
    ],
    task: [
        { href: '/dashboard/task/lista', label: 'Minha Lista', icon: List, requiredPlan: ['free', 'growth', 'performance'] },
        { href: '/dashboard/task/tarefas', label: 'Quadro', icon: LayoutGrid, requiredPlan: ['free', 'growth', 'performance'] },
        { href: '/dashboard/task/calendario', label: 'Calendário', icon: Calendar, requiredPlan: ['growth', 'performance'] },
    ],
    finance: [
        { href: '/dashboard/finance/relatorios', label: 'Relatórios', icon: BarChart3, requiredPlan: ['free', 'growth', 'performance'] },
        { href: '/dashboard/finance/transacoes', label: 'Transações', icon: ArrowLeftRight, requiredPlan: ['free', 'growth', 'performance'] },
        { href: '/dashboard/finance/contas', label: 'Contas', icon: Landmark, requiredPlan: ['growth', 'performance'] },
        { href: '/dashboard/finance/contas-a-pagar', label: 'Contas a Pagar/Receber', icon: Receipt, requiredPlan: ['growth', 'performance'] },
        { href: '/dashboard/finance/fornecedores', label: 'Fornecedores', icon: Truck, requiredPlan: ['performance'] },
        { href: '/dashboard/finance/conciliacao', label: 'Conciliação', icon: GitCompareArrows, requiredPlan: ['performance'] },
    ],
}


export default function DashboardLayout({ 
    children
}: { 
    children: React.ReactNode
}) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [accessInfo, setAccessInfo] = useState<UserAccessInfo | null>(null);
  const [isLoadingAccess, setIsLoadingAccess] = useState(true);

  const fetchAccessInfo = useCallback(async (user: FirebaseUser) => {
    setIsLoadingAccess(true);
    try {
        const info = await getUserAccessInfo({ actor: user.uid });
        setAccessInfo(info);
    } catch (error) {
        console.error("Failed to get user access info:", error);
    } finally {
        setIsLoadingAccess(false);
    }
  }, []);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        if (user) {
            fetchAccessInfo(user);
        } else {
            setIsLoadingAccess(false);
            setAccessInfo(null);
        }
    });
    return () => unsubscribe();
  }, [fetchAccessInfo]);

  const segments = pathname.split('/');
  const currentModule = segments.length > 2 ? segments[2] : 'home';

  const renderSidebarContent = () => {
    if (isLoadingAccess) {
        return (
            <aside className="w-64 flex-shrink-0 bg-card border-r border-border flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </aside>
        )
    }

    if (currentModule === 'home' || !accessInfo) {
        return null;
    }
    
    if (currentModule === 'pulse') {
        // QoroPulse is only for performance plan
        if (accessInfo.planId !== 'performance') {
            // Or render a "locked" state sidebar
            return null; 
        }
        return <PulseSidebar />;
    }

    const moduleConfig = navConfig[currentModule];
    const moduleItems = navItems[currentModule] || [];
    
    if (!moduleConfig) {
        return null;
    }
    
    const { group, icon: GroupIcon } = moduleConfig;

    const visibleItems = moduleItems.filter(item => 
        item.requiredPlan.includes(accessInfo.planId)
    );
    
    return (
        <aside className="w-64 flex-shrink-0 bg-card border-r border-border flex flex-col">
            <div className="p-4 border-b border-border space-y-4">
                <div className="flex items-center">
                    <div className={'p-3 rounded-xl text-black mr-4 shadow-lg bg-primary shadow-primary/30'}>
                        <GroupIcon className="w-6 h-6" />
                    </div>
                    <h2 className={'text-xl font-bold text-primary'}>{group}</h2>
                </div>
                <Link href="/dashboard" className="flex items-center text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    <span>Voltar ao Dashboard</span>
                </Link>
            </div>
            <nav className="flex-grow p-4 overflow-y-auto">
                <ul>
                    {visibleItems.map((item) => (
                    <li key={item.href}>
                        <Link
                        href={item.href}
                        className={`flex items-center px-4 py-3 my-1 rounded-xl text-sm font-medium transition-all duration-200 group ${
                            pathname === item.href
                            ? 'bg-primary text-black shadow-lg shadow-primary/30'
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
         {renderSidebarContent()}
         <main className="flex-1 overflow-y-auto p-8">
           {children}
         </main>
      </div>
    </div>
  );
}
