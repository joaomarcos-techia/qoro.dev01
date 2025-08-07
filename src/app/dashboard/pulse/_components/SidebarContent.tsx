
'use client';

import { useEffect, useState, useTransition, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { listConversations, deleteConversation as deleteConversationFlow, listConversationsSortedByCreation } from '@/ai/flows/pulse-flow';
import type { Conversation } from '@/ai/schemas';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PlusCircle, MessageSquare, Trash2, AlertTriangle, Loader2 } from 'lucide-react';

export function PulseSidebarContent() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const pathname = usePathname();
  const router = useRouter();
  const conversationId = pathname.split('/').pop();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const fetchConversations = useCallback(async (user: User) => {
    setIsLoading(true);
    setError(null);
    try {
      // Tenta primeiro com 'updatedAt', que precisa do índice novo.
      const convos = await listConversations({ actor: user.uid });
      const sortedConvos = [...convos].sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
      setConversations(sortedConvos);
    } catch (err: any) {
        console.warn("Query by 'updatedAt' failed, falling back to 'createdAt'. This is expected while the index is building.", err.message);
        try {
            // Se a primeira falhar (índice construindo), usa 'createdAt' que já tem índice.
            const convos = await listConversationsSortedByCreation({ actor: user.uid });
            setConversations(convos);
        } catch (finalErr) {
            console.error("Failed to fetch conversations with fallback:", finalErr);
            setError("Não foi possível carregar o histórico. Tente recarregar a página em alguns minutos.");
        }
    } finally {
      setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    if (currentUser) {
      fetchConversations(currentUser);
    }
  }, [currentUser, pathname, fetchConversations]);

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!currentUser) return;

    startDeleteTransition(async () => {
        const previousConversations = conversations;
        setConversations(prev => prev.filter(c => c.id !== id));

        try {
            await deleteConversationFlow({ conversationId: id, actor: currentUser.uid });
            if (id === conversationId) {
                router.push('/dashboard/pulse/new');
            } else {
                router.refresh(); 
            }
        } catch (err) {
            console.error("Failed to delete conversation", err);
            setError("Falha ao excluir a conversa.");
            setConversations(previousConversations);
        }
    });
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-full p-4">
          <div className="text-center">
            <Loader2 className="mx-auto w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-gray-500 mt-2">Carregando conversas...</p>
            <p className="text-xs text-gray-400 mt-1">(Isso pode levar um minuto na primeira vez)</p>
          </div>
        </div>
      );
    }
    if (error) {
        return (
            <div className="p-4 m-4 text-center text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                <AlertTriangle className="mx-auto w-8 h-8 mb-2" />
                <p className="font-semibold">Ocorreu um Erro</p>
                <p>{error}</p>
            </div>
        )
    }
    return (
        <ul className="space-y-1">
            {conversations.length > 0 ? conversations.map(convo => (
            <li key={convo.id}>
                <Link
                    href={`/dashboard/pulse/${convo.id}`}
                    className={cn(
                        "group flex items-center justify-between w-full text-left p-3 rounded-xl cursor-pointer transition-all duration-200",
                        convo.id === conversationId 
                        ? 'bg-primary text-white shadow-neumorphism-inset' 
                        : 'text-gray-700 hover:bg-gray-100 hover:shadow-neumorphism'
                    )}
                >
                    <span className="text-sm font-medium truncate flex items-center">
                        <MessageSquare className="w-4 h-4 mr-3 flex-shrink-0" />
                        {convo.title}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDeleteConversation(convo.id, e)}
                        disabled={isDeleting}
                        className={cn(
                            "h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0",
                            convo.id === conversationId ? "hover:bg-primary/80" : "hover:bg-red-100 text-red-500"
                        )}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </Link>
            </li>
            )) : (
                <div className="text-center text-gray-400 mt-10 px-4">
                    <MessageSquare className="mx-auto w-10 h-10 mb-2"/>
                    <p className="text-sm">Seu histórico de conversas aparecerá aqui.</p>
                </div>
            )}
        </ul>
    );
  }

  return (
    <>
        <div className="p-4 border-b border-gray-200">
             <Link href="/dashboard/pulse/new">
                <Button className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-neumorphism hover:shadow-neumorphism-hover flex items-center justify-center font-semibold">
                    <PlusCircle className="mr-2 w-5 h-5"/>
                    Nova Conversa
                </Button>
            </Link>
        </div>
        
        <nav className="flex-grow p-4 overflow-y-auto">
            {renderContent()}
        </nav>
    </>
  );
}
