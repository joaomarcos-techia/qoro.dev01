
'use client';

import Link from 'next/link';
import { ChevronLeft, Activity } from 'lucide-react';
import { PulseSidebarContent } from './SidebarContent';

export function PulseSidebar() {
  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col shadow-neumorphism-right">
        <div className="p-4 border-b border-gray-200 space-y-4">
            <div className="flex items-center">
                <div className="p-3 rounded-xl text-white mr-4 shadow-neumorphism bg-purple-500">
                    <Activity className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-black">QoroPulse</h2>
            </div>
            <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-primary transition-colors text-sm font-medium">
                <ChevronLeft className="w-4 h-4 mr-2" />
                <span>Voltar ao Dashboard</span>
            </Link>
        </div>

        <PulseSidebarContent />
    </aside>
  );
}
