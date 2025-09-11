
'use client';

import { useState, useRef, useEffect, FormEvent, useCallback, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BrainCircuit, Loader2, AlertCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { askPulse } from '@/ai/flows/pulse-flow';
import { getConversation } from '@/services/pulseService';
import type { PulseMessage, Conversation } from '@/ai/schemas';

const ArrowUpIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" {...props}>
        <path d="M12 23V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 10l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);


export default function PulseConversationPage() {
  const [messages, setMessages] = useState<PulseMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;

  // Helper to normalize messages for display
  const normalizeMessagesForDisplay = (dbMessages: any[]): PulseMessage[] => {
    if (!dbMessages || !Array.isArray(dbMessages)) return [];
    
    return dbMessages
        .map((msg: any): PulseMessage | null => {
            if (!msg || !msg.role) return null;
            const role = msg.role === 'model' ? 'assistant' : msg.role;
            if (role !== 'user' && role !== 'assistant') return null;

            let content = '';
            if (typeof msg.content === 'string') {
                content = msg.content;
            } else if (Array.isArray(msg.parts)) {
                content = msg.parts.map((p: any) => p.text).filter(Boolean).join('\n');
            }
            
            if (content) {
                return { role, content };
            }
            return null;
        })
        .filter((msg): msg is PulseMessage => msg !== null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
      } else {
        setCurrentUser(user);
      }
    });
    return () => unsubscribe();
  }, [router]);
  
  const fetchConversationHistory = useCallback(async () => {
    if (!conversationId || !currentUser) return;

    setIsLoadingHistory(true);
    setError(null);
    try {
        const conversation = await getConversation({ conversationId, actor: currentUser.uid });

        if (conversation && Array.isArray(conversation.messages)) {
            const displayMessages = normalizeMessagesForDisplay(conversation.messages);
            setMessages(displayMessages);

            // If the conversation is new and only has one user message, trigger AI response.
            if (displayMessages.length === 1 && displayMessages[0].role === 'user') {
                // Pass the single message to the flow
                handleSendMessage(undefined, [displayMessages[0]]);
            }
        } else {
            setError("Não foi possível encontrar a conversa ou você não tem permissão para vê-la.");
            setTimeout(() => router.push('/dashboard/pulse'), 3000);
        }
    } catch (err: any) {
        console.error("Error loading conversation", err);
        setError(err.message || "Não foi possível carregar o histórico desta conversa.");
    } finally {
        setIsLoadingHistory(false);
    }
  }, [conversationId, currentUser, router]);


  useEffect(() => {
    if(currentUser) {
        fetchConversationHistory();
    }
  }, [currentUser, fetchConversationHistory]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  const handleSendMessage = async (e?: FormEvent, initialMessages?: PulseMessage[]) => {
    e?.preventDefault();
    
    const isInitialTrigger = !!initialMessages;
    
    if (!isInitialTrigger && !input.trim()) return;
    if (isSending || !currentUser || !conversationId) return;

    const messagesToSend: PulseMessage[] = isInitialTrigger 
        ? initialMessages
        : [...messages, { role: 'user', content: input }];

    // Optimistic UI update for manual messages
    if (!isInitialTrigger) {
        setMessages(messagesToSend);
        setInput('');
    }
    
    setIsSending(true);
    setError(null);

    try {
      const result = await askPulse({
          messages: messagesToSend,
          actor: currentUser.uid,
          conversationId: conversationId,
      });
      setMessages(prev => [...prev, result.response]);
    } catch (error: any) {
        console.error("Error calling Pulse Flow:", error);
        setError(error.message || 'Ocorreu um erro ao comunicar com a IA. Tente novamente.');
        // Revert optimistic update only for manual messages on failure
        if (!isInitialTrigger) {
            setMessages(prev => prev.slice(0, -1));
        }
    } finally {
        setIsSending(false);
    }
  };

  const renderMessages = () => {
    if (isLoadingHistory) {
      return (
        <div className="flex-grow flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Carregando conversa...</p>
        </div>
      );
    }
    
    return messages.map((message, index) => (
      <div
          key={index}
          className={`flex items-start gap-4 mx-auto w-full ${message.role === 'user' ? 'justify-end' : ''}`}
      >
          {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pulse-primary text-black flex items-center justify-center">
                  <BrainCircuit size={18} />
              </div>
          )}
          <div
          className={`max-w-2xl px-5 py-3 rounded-2xl ${
              message.role === 'user'
              ? 'bg-secondary text-primary-foreground'
              : 'bg-card text-foreground'
          }`}
          >
          <p className="whitespace-pre-wrap text-base">{message.content}</p>
          </div>
          {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-muted-foreground flex items-center justify-center font-semibold">
                  <User size={18}/>
              </div>
          )}
      </div>
    ))
  }

  return (
    <div className="flex flex-col h-full bg-black">
        <div className="flex-grow flex flex-col items-center w-full px-4 relative">
            <div 
                ref={scrollAreaRef}
                className="flex-grow w-full max-w-4xl overflow-y-auto space-y-8 flex flex-col pt-8 pb-32"
            >
                {renderMessages()}
                
                {isSending && (
                <div className="flex items-start gap-4 mx-auto w-full">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pulse-primary text-black flex items-center justify-center">
                        <BrainCircuit size={18} />
                    </div>
                    <div className="max-w-lg px-5 py-3 rounded-2xl bg-card text-foreground flex items-center">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                </div>
                )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent">
                <div className="w-full max-w-4xl mx-auto px-4 pt-4 pb-8">
                    <form onSubmit={handleSendMessage} className="relative bg-card border border-border rounded-2xl shadow-2xl">
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                            }}
                            placeholder="Pergunte qualquer coisa sobre seu negócio..."
                            className="w-full pr-20 pl-4 py-4 bg-transparent rounded-2xl border-none focus:ring-0 text-base resize-none"
                            rows={1}
                            disabled={isSending}
                        />
                        <Button
                            type="submit"
                            disabled={isSending || !input.trim()}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-pulse-primary text-primary-foreground rounded-2xl transition-all duration-300 hover:bg-pulse-primary/90 disabled:bg-secondary disabled:text-muted-foreground"
                        >
                            <ArrowUpIcon className="w-6 h-6" />
                        </Button>
                    </form>
                    {error && (
                        <div className="text-destructive text-sm mt-2 flex items-center justify-center">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}

    