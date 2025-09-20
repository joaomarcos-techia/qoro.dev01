
'use client';

import { useState, useEffect, useRef, FormEvent, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, AlertCircle, Sparkles, Send, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getConversation } from '@/services/pulseService';
import { askPulse, type PulseMessage } from '@/ai/flows/pulse-flow';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';

const PulseMessageBubble = ({ message }: { message: PulseMessage }) => {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex items-start gap-4', isUser ? 'justify-end' : '')}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pulse-primary/20 flex items-center justify-center border border-pulse-primary/30">
          <Sparkles className="w-5 h-5 text-pulse-primary" />
        </div>
      )}
      <div
        className={cn(
          'max-w-2xl rounded-2xl p-4',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-card'
        )}
      >
        <p className="whitespace-pre-wrap text-sm md:text-base">{message.content}</p>
      </div>
       {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
          <UserIcon className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
};


export default function PulseConversationPage() {
    const [messages, setMessages] = useState<PulseMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const router = useRouter();
    const params = useParams();
    const conversationId = params.id as string;
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            if (user) {
                setCurrentUser(user);
            } else {
                router.push('/login');
            }
        });
        return () => unsubscribe();
    }, [router]);

    const fetchConversation = useCallback(async () => {
        if (!currentUser || !conversationId) return;

        setPageLoading(true);
        setError(null);
        try {
            const conversation = await getConversation({ conversationId, actor: currentUser.uid });
            if (conversation) {
                setMessages(conversation.messages);
            } else {
                setError('Conversa não encontrada ou acesso negado.');
            }
        } catch (err: any) {
            console.error("Erro ao buscar conversa:", err);
            setError(err.message || 'Falha ao carregar a conversa.');
        } finally {
            setPageLoading(false);
        }
    }, [currentUser, conversationId]);

    useEffect(() => {
        fetchConversation();
    }, [fetchConversation]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e?: FormEvent) => {
        e?.preventDefault();
        const trimmedInput = input.trim();
        if (!trimmedInput || isLoading || !currentUser) return;

        const userMessage: PulseMessage = { role: 'user', content: trimmedInput };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const response = await askPulse({
                messages: newMessages,
                actor: currentUser.uid,
                conversationId: conversationId,
            });
            setMessages([...newMessages, response.response]);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Ocorreu um erro ao comunicar com a IA. Tente novamente.');
            setMessages(messages); // Revert to previous state on error
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (pageLoading) {
        return (
            <div className="flex flex-col h-full bg-black items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Carregando conversa...</p>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col h-full bg-black">
            <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-6">
                {messages.map((msg, index) => (
                    <PulseMessageBubble key={index} message={msg} />
                ))}

                 {isLoading && (
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pulse-primary/20 flex items-center justify-center border border-pulse-primary/30">
                            <Sparkles className="w-5 h-5 text-pulse-primary" />
                        </div>
                        <div className="max-w-2xl rounded-2xl p-4 bg-card flex items-center">
                            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

             <div className="bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent">
                <div className="w-full max-w-4xl mx-auto px-4 pt-4 pb-8">
                    <form onSubmit={handleSendMessage} className="relative bg-card border border-border rounded-2xl shadow-2xl">
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Continue a conversa..."
                            className="w-full pr-20 pl-4 py-4 bg-transparent rounded-2xl border-none focus:ring-0 text-base resize-none"
                            rows={1}
                            disabled={isLoading}
                        />
                        <Button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-pulse-primary text-primary-foreground rounded-2xl transition-all duration-300 hover:bg-pulse-primary/90 disabled:bg-secondary disabled:text-muted-foreground"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                        </Button>
                    </form>
                    {error && (
                        <div className="text-destructive text-sm mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start">
                            <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
