
'use client';

import { useState, useRef, useEffect, FormEvent, useCallback, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Send, BrainCircuit, Loader2, AlertCircle, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { askPulse } from '@/ai/flows/pulse-flow';
import { getConversation } from '@/services/pulseService';
import type { PulseMessage } from '@/ai/schemas';

export default function PulseConversationPage() {
  const [messages, setMessages] = useState<PulseMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string | undefined;

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserName(userDoc.data().name || user.email || 'Usuário');
        }
      } else {
        setCurrentUser(null);
        setUserName('');
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);
  
  const fetchConversationHistory = useCallback(async () => {
    if (conversationId && currentUser) {
      setIsLoadingHistory(true);
      setError(null);
      setMessages([]);
      try {
        const conversation = await getConversation({ conversationId, actor: currentUser.uid });
        if (conversation && conversation.messages) {
           setMessages(conversation.messages);
        }
      } catch (err: any) {
        console.error("Error loading conversation", err);
        setError(err.message || "Não foi possível carregar o histórico desta conversa.");
      } finally {
        setIsLoadingHistory(false);
      }
    } else {
      setMessages([]);
    }
  }, [conversationId, currentUser]);


  useEffect(() => {
    fetchConversationHistory();
  }, [fetchConversationHistory]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  const handleSendMessage = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isSending || !currentUser) return;
  
    const userMessage: PulseMessage = { role: 'user', content: input };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput('');
    setIsSending(true);
    setError(null);
  
    try {
        const response = await askPulse({
            messages: currentMessages,
            actor: currentUser.uid,
            conversationId: conversationId,
        });

        setMessages(prev => [...prev, response.response]);

        if (!conversationId && response.conversationId) {
            startTransition(() => {
                router.push(`/dashboard/pulse/${response.conversationId}`);
            });
        }

    } catch (error: any) {
        console.error("Error calling Pulse Flow:", error);
        setError(error.message || 'Ocorreu um erro ao comunicar com a IA. Tente novamente.');
        setMessages(prev => prev.slice(0, -1));
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
                            className="w-full pr-16 pl-4 py-4 bg-transparent rounded-2xl border-none focus:ring-0 text-base resize-none shadow-none"
                            rows={1}
                            disabled={isSending || isPending}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={isSending || isPending || !input.trim()}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-pulse-primary text-primary-foreground rounded-lg hover:bg-pulse-primary/90 disabled:bg-gray-600"
                        >
                            <Send size={20} />
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
