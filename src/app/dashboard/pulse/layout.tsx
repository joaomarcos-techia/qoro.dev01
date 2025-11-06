
'use client';

import { PulseSidebar } from '@/components/dashboard/pulse/PulseSidebar';
import { usePathname } from 'next/navigation';

export default function PulseLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isConversationPage = pathname.startsWith('/dashboard/pulse/');

  return (
    <div className="flex h-full">
      <PulseSidebar />
      <main className={`flex-1 ${isConversationPage ? 'overflow-y-hidden' : 'overflow-y-auto'}`}>
        {children}
      </main>
    </div>
  );
}
