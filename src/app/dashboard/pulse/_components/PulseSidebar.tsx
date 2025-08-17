
'use client';

import Link from 'next/link';
import { ChevronLeft, Activity } from 'lucide-react';
import { PulseSidebarContent } from './SidebarContent';

export function PulseSidebar() {
  return (
    <aside className="w-64 flex-shrink-0 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border space-y-4">
            <div className="flex items-center">
                <div className="p-3 rounded-xl text-black mr-4 shadow-lg bg-pulse-primary shadow-pulse-primary/30">
                    <Activity className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-pulse-primary">QoroPulse</h2>
            </div>
            <Link href="/dashboard" className="flex items-center text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                <ChevronLeft className="w-4 h-4 mr-2" />
                <span>Voltar ao Dashboard</span>
            </Link>
        </div>

        <PulseSidebarContent />
    </aside>
  );
}
