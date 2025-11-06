
'use client';

import { Header } from '@/components/dashboard/Header';
import { PlanProvider } from '@/contexts/PlanContext';
import { TasksProvider } from '@/contexts/TasksContext';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="h-[calc(100vh-64px)]">
        {children}
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlanProvider>
      <TasksProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </TasksProvider>
    </PlanProvider>
  );
}
