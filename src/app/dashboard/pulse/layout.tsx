
'use client';

import { PulseSidebar } from '@/components/dashboard/pulse/PulseSidebar';

export default function PulseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      <PulseSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
