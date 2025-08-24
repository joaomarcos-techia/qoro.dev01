
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useTransition } from 'react';
import { PenSquare, MessageSquare, Loader2, Activity, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { listConversations } from '@/services/pulseService';
import type { ConversationProfile } from '@/ai/schemas';

export function PulseSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<ConversationProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchConversations() {
      if (currentUser) {
        setIsLoading(true);
        try {
          const convos = await listConversations({ actor: currentUser.uid });
          setConversations(convos);
        } catch (error) {
          console.error("Failed to fetch conversations", error);
        } finally {
          setIsLoading(false);
        }
      }
    }
    fetchConversations();
  }, [currentUser, pathname]); // Refetch when pathname changes to update history

  const handleNewConversation = () => {
    startTransition(() => {
        router.push('/dashboard/pulse');
    });
  };

  return (
    <aside className="w-72 flex-shrink-0 bg-card/50 border-r border-border flex flex-col">
       <div className="p-4 border-b border-border space-y-4">
            <div className="flex items-center">
                <div className={'p-3 rounded-xl text-black mr-4 shadow-lg bg-pulse-primary shadow-pulse-primary/30'}>
                    <Activity className="w-6 h-6" />
                </div>
                <h2 className={'text-xl font-bold text-pulse-primary'}>QoroPulse</h2>
            </div>
            <Link href="/dashboard" className="flex items-center text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                <ChevronLeft className="w-4 h-4 mr-2" />
                <span>Voltar ao Dashboard</span>
            </Link>
        </div>
        
        <div className="p-4">
            <button
                onClick={handleNewConversation}
                disabled={isPending}
                className="w-full flex items-center justify-center bg-primary text-primary-foreground px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-all duration-300 font-semibold"
            >
                <PenSquare className="w-5 h-5 mr-2" />
                {isPending ? 'Carregando...' : 'Nova Conversa'}
            </button>
        </div>
      
        <div className="flex-grow overflow-y-auto space-y-1 px-4 pb-4">
            <h3 className="text-sm font-semibold text-muted-foreground px-2 mb-2">Histórico</h3>
            {isLoading ? (
                <div className="flex justify-center items-center h-full">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
            ) : (
                conversations.map((convo) => (
                    <Link key={convo.id} href={`/dashboard/pulse/${convo.id}`}>
                        <div
                            className={cn(
                            'flex items-center p-2 rounded-lg text-sm truncate cursor-pointer transition-colors',
                            pathname === `/dashboard/pulse/${convo.id}`
                                ? 'bg-secondary text-foreground'
                                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                            )}
                        >
                            <MessageSquare className="w-4 h-4 mr-3 flex-shrink-0" />
                            <span className="truncate">{convo.title}</span>
                        </div>
                    </Link>
                ))
            )}
            {!isLoading && conversations.length === 0 && (
                <p className="text-xs text-muted-foreground text-center px-2 py-4">
                    Nenhuma conversa ainda. Inicie uma para ver seu histórico aqui.
                </p>
            )}
        </div>
    </aside>
  );
}
