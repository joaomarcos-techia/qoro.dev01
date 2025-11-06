
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon, ChevronLeft, Loader2, Lock, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlan } from '@/contexts/PlanContext';
import { AppPermissions } from '@/ai/schemas';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permissionKey: keyof AppPermissions;
  plan: ('free' | 'growth' | 'performance')[];
}

export interface NavGroup {
  group: string;
  icon: LucideIcon;
  colorClass: string;
  module: 'crm' | 'task' | 'finance' | 'pulse';
}

interface ModuleSidebarProps {
  navGroup: NavGroup;
  navItems: NavItem[];
}

function SidebarContent({ navGroup, navItems, onLinkClick }: ModuleSidebarProps & { onLinkClick?: () => void }) {
  const pathname = usePathname();
  const { permissions, isLoading, planId } = usePlan();
  
  const { group, icon: GroupIcon, colorClass, module } = navGroup;
  const [bgColor, textColor] = colorClass.split(' ');

  const handleLinkClick = () => {
    if (onLinkClick) {
      onLinkClick();
    }
  };

  const isAllowed = (item: NavItem) => {
    if (isLoading || !planId || !permissions) return false;
    const hasPlanPermission = item.plan.includes(planId);
    const hasRolePermission = permissions[item.permissionKey] === true;
    return hasPlanPermission && hasRolePermission;
  };

  return (
    <>
      <div className="p-4 border-b border-border space-y-4">
        <div className="flex items-center">
          <div className={cn('p-3 rounded-xl text-black mr-4 shadow-lg', bgColor, `shadow-${module}-primary/30`)}>
            <GroupIcon className="w-6 h-6" />
          </div>
          <h2 className={cn('text-xl font-bold', textColor)}>{group}</h2>
        </div>
        <Link href="/dashboard" onClick={handleLinkClick} className="flex items-center text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
          <ChevronLeft className="w-4 h-4 mr-2" />
          <span>Voltar ao Dashboard</span>
        </Link>
      </div>
      <nav className="flex-grow p-4 overflow-y-auto">
        <ul>
          {navItems.map((item) => {
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
              );
            }

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={handleLinkClick}
                  className={cn(`flex items-center px-4 py-3 my-1 rounded-xl text-sm font-medium transition-all duration-200 group`,
                    isActive
                      ? `${bgColor} text-black shadow-lg shadow-${module}-primary/30`
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <item.icon className={cn(`w-5 h-5 mr-3 transition-colors`, isActive ? 'text-black' : 'text-muted-foreground group-hover:text-foreground')} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

export function ModuleSidebar({ navGroup, navItems }: ModuleSidebarProps) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    return (
        <>
            {/* Botão para abrir em mobile */}
            <div className="md:hidden p-4 fixed top-16 left-0 z-30">
                <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(true)} className="bg-card/50 backdrop-blur-md border border-border">
                    <Menu className="w-6 h-6"/>
                </Button>
            </div>
            
            {/* Overlay para mobile */}
            {isMobileOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-black/60 md:hidden" 
                    onClick={() => setIsMobileOpen(false)}
                >
                    <aside 
                        className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 transform-gpu"
                        onClick={e => e.stopPropagation()}
                    >
                        <SidebarContent navGroup={navGroup} navItems={navItems} onLinkClick={() => setIsMobileOpen(false)} />
                    </aside>
                </div>
            )}

            {/* Sidebar para desktop */}
            <aside className="hidden md:flex w-64 flex-shrink-0 flex-col bg-card border-r border-border">
              <SidebarContent navGroup={navGroup} navItems={navItems} />
            </aside>
        </>
    );
}
