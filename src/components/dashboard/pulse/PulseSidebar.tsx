
'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { PlusCircle, MessageSquare, Loader2, Activity, ChevronLeft } from 'lucide-react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { listConversations } from '@/services/pulseService';
import type { ConversationProfile } from '@/ai/schemas';
import { cn } from '@/lib/utils';

export function PulseSidebar() {
  const [conversations, setConversations] = useState<ConversationProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const fetchConversations = useCallback(() => {
    if (currentUser) {
      setIsLoading(true);
      setError(null);
      listConversations({ actor: currentUser.uid })
        .then((data) => {
          setConversations(data);
        })
        .catch((err) => {
          console.error("Error loading conversations:", err);
          setError("Não foi possível carregar o histórico.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
        fetchConversations();
    }
  }, [currentUser, pathname, fetchConversations]);

  const handleNewConversation = () => {
    startTransition(() => {
        router.push('/dashboard/pulse');
    });
  };

  const renderHistory = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground text-sm">Carregando...</span>
        </div>
      );
    }
    if (error) {
      return <div className="p-4 text-sm text-destructive">{error}</div>;
    }
    if (conversations.length === 0) {
        return <div className="p-4 text-sm text-muted-foreground text-center">Nenhuma conversa anterior.</div>;
    }
    return conversations.map((convo) => {
        const isActive = pathname.includes(convo.id);
        const displayTitle = convo.title || "Nova Conversa";
        return (
          <Link key={convo.id} href={`/dashboard/pulse/${convo.id}`} passHref>
            <div
              className={cn(
                'flex items-center p-3 my-1 rounded-xl text-sm font-medium transition-all duration-200 group w-full text-left truncate',
                isActive
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <MessageSquare className="w-4 h-4 mr-3 flex-shrink-0" />
              <span className="truncate">{displayTitle}</span>
            </div>
          </Link>
        );
      });
  }

  return (
    <aside className="w-80 flex-shrink-0 bg-card border-r border-border flex flex-col">
       <div className="p-4 border-b border-border space-y-4">
            <div className="flex items-center">
                <div className={'p-3 rounded-xl text-black mr-4 shadow-lg bg-pulse-primary shadow-primary/30'}>
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
          <PlusCircle className="w-5 h-5 mr-2" />
          Nova Conversa
        </button>
      </div>
      
      <div className="flex-grow p-4 pt-0 overflow-y-auto">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">Histórico</h3>
        <nav className="flex flex-col gap-1">
            {renderHistory()}
        </nav>
      </div>
    </aside>
  );
}
