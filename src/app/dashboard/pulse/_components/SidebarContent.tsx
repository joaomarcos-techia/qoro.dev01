
'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { MessageSquare, PlusCircle, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Conversation } from '@/ai/schemas';
import { deleteConversation as deleteConversationFlow } from '@/ai/flows/pulse-flow';

interface SidebarContentProps {
  initialConversations: Conversation[];
  initialError: string | null;
  actorUid: string;
}

export function SidebarContent({ initialConversations, initialError, actorUid }: SidebarContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const conversationId = pathname.split('/').pop();

  const [conversations, setConversations] = useState(initialConversations);
  const [error, setError] = useState(initialError);

  useEffect(() => {
    setConversations(initialConversations);
    setError(initialError);
  }, [initialConversations, initialError]);


  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!actorUid) return;

    const previousConversations = conversations;
    setConversations(prev => prev.filter(c => c.id !== id));

    try {
        await deleteConversationFlow({ conversationId: id, actor: actorUid });
        if (id === conversationId) {
            router.push('/dashboard/pulse/new');
        }
    } catch (err) {
        console.error("Failed to delete conversation", err);
        setError("Falha ao excluir a conversa.");
        setConversations(previousConversations);
    }
  }

  return (
    <div className="flex flex-col h-full">
        <div className="mb-4">
            <Link href="/dashboard/pulse/new">
                <Button className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-neumorphism hover:shadow-neumorphism-hover flex items-center justify-center font-semibold">
                    <PlusCircle className="mr-2 w-5 h-5"/>
                    Nova Conversa
                </Button>
            </Link>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 -mr-2">
            {error && !conversations.length ? (
                <div className="p-4 text-center text-sm text-red-600 bg-red-50 rounded-lg">
                    <AlertTriangle className="mx-auto w-8 h-8 mb-2" />
                    {error}
                </div>
            ) : (
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
                         <div className="text-center text-gray-400 mt-10">
                            <MessageSquare className="mx-auto w-10 h-10 mb-2"/>
                            <p className="text-sm">Seu histórico aparecerá aqui.</p>
                        </div>
                    )}
                </ul>
            )}
        </div>
    </div>
  );
}
