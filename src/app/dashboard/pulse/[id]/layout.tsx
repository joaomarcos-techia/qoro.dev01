

'use client';

import { PulseSidebar } from '@/components/dashboard/pulse/PulseSidebar';

export default function PulseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      <PulseSidebar />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
