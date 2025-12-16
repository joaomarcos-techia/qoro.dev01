
'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { PlusCircle, MessageSquare, Loader2, Activity, ChevronLeft, Trash2 } from 'lucide-react';
import { onAuthStateChanged, User as FirebaseUser, getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { listConversations, deleteConversation } from '@/services/pulseService';
import type { ConversationProfile } from '@/ai/schemas';
import { cn } from '@/lib/utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"

const auth = getAuth(app);

interface PulseSidebarProps {
  isMobile?: boolean;
  onLinkClick?: () => void;
}

export function PulseSidebar({ isMobile, onLinkClick }: PulseSidebarProps) {
  const [conversations, setConversations] = useState<ConversationProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
        fetchConversations();
    }
  // The pathname dependency ensures the list re-fetches when navigation occurs.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, pathname]);

  const handleNewConversation = () => {
    startTransition(() => {
        // Navigate to a temporary 'new' route that the page component can handle.
        // This avoids issues with re-using an existing conversation ID.
        router.push('/dashboard/pulse/new');
        if (onLinkClick) onLinkClick();
    });
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!currentUser) return;
    
    // Optimistically remove from UI
    setConversations(prev => prev.filter(c => c.id !== conversationId));

    try {
      await deleteConversation({ conversationId, actor: currentUser.uid });
      // If the deleted conversation was the active one, navigate away
      if (pathname.includes(conversationId)) {
        router.push('/dashboard/pulse');
      }
    } catch (err) {
      console.error("Failed to delete conversation", err);
      // Revert UI change on failure
      fetchConversations(); 
      setError("Falha ao excluir conversa.");
    }
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onLinkClick) {
      onLinkClick();
    }
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
        const displayTitle = convo.title || "Nova conversa";
        return (
            <div key={convo.id} className="group relative flex items-center justify-between p-3 my-1 rounded-xl transition-all duration-200 hover:bg-secondary">
                <Link href={`/dashboard/pulse/${convo.id}`} onClick={handleLinkClick} passHref className="flex-grow flex items-center min-w-0">
                    <div
                    className={cn(
                        'flex items-center text-sm font-medium w-full text-left truncate',
                        isActive
                        ? 'text-foreground'
                        : 'text-muted-foreground group-hover:text-foreground'
                    )}
                    >
                    <MessageSquare className="w-4 h-4 mr-3 flex-shrink-0" />
                    <span className="truncate">{displayTitle}</span>
                    </div>
                </Link>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <button className="flex-shrink-0 p-1 rounded-xl text-muted-foreground opacity-0 group-hover:opacity-100 transition-all active:bg-destructive/10 active:text-red-400">
                            <Trash2 className="w-4 h-4"/>
                        </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Excluir esta conversa?</AlertDialogTitle>
                            <AlertDialogDescription>
                                A conversa "{displayTitle}" será permanentemente excluída. Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDeleteConversation(convo.id); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">
                                Sim, excluir
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        );
      });
  }

  return (
    <aside className={cn(
        "bg-card border-r border-border flex flex-col transition-all duration-300",
        isMobile ? "w-full" : "w-80 flex-shrink-0"
    )}>
       <div className="p-4 border-b border-border space-y-4">
            <div className="flex items-center">
                <div className={'p-3 rounded-xl text-black mr-4 shadow-lg bg-pulse-primary shadow-primary/30'}>
                    <Activity className="w-6 h-6" />
                </div>
                <h2 className={'text-xl font-bold text-pulse-primary'}>QoroPulse</h2>
            </div>
            <Link href="/dashboard" onClick={handleLinkClick} className="flex items-center text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                <ChevronLeft className="w-4 h-4 mr-2" />
                <span>Voltar ao dashboard</span>
            </Link>
        </div>
      
      <div className="p-4">
        <button
          onClick={handleNewConversation}
          disabled={isPending}
          className="w-full flex items-center justify-center bg-pulse-primary text-black px-4 py-2.5 rounded-xl hover:bg-pulse-primary/90 transition-all duration-300 font-semibold"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Nova conversa
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
