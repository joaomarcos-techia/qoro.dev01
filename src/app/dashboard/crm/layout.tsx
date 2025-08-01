
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  LayoutGrid,
  ShoppingCart,
  Wrench,
  FileText,
  ChevronLeft,
  BarChart3,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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
            { href: '/dashboard/crm/clientes', label: 'Clientes', icon: Users },
            { href: '/dashboard/crm/funil', label: 'Funil', icon: LayoutGrid },
            { href: '/dashboard/crm/relatorios', label: 'Relatórios', icon: BarChart3 },
            { href: '/dashboard/crm/servicos', label: 'Serviços', icon: Wrench },
            { href: '/dashboard/crm/produtos', label: 'Produtos', icon: ShoppingCart },
            { href: '/dashboard/crm/orcamentos', label: 'Orçamentos', icon: FileText },
        ]
    }
};


export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const navData = navConfig.crm;
  const { group, icon: GroupIcon, color, items } = navData;

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col shadow-neumorphism-right">
        <div className="p-4 border-b border-gray-200">
            <div className="flex items-center mb-4">
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
        <nav className="flex-grow p-4">
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
         <main className="flex-1 overflow-y-auto">
            <div className="p-8">
              {children}
            </div>
         </main>
    </aside>
  );
}
