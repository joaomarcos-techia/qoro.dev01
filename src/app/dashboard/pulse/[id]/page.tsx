'use client';

import { useState, useRef, useEffect, FormEvent, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BrainCircuit, Loader2, AlertCircle, User, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { askPulse } from '@/ai/flows/pulse-flow';
import { getConversation } from '@/services/pulseService';
import type { PulseMessage } from '@/ai/schemas';

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
      } else {
        setCurrentUser(user);
      }
    });
    return () => unsubscribe();
  }, [router]);
  
  const handleSendMessage = useCallback(async (e?: FormEvent, messagesOverride?: PulseMessage[]) => {
    e?.preventDefault();
    if (isSending || !currentUser?.uid) return;

    const currentInput = input;
    const messagesToSend = messagesOverride || [...messages, { role: 'user', content: currentInput.trim() }];

    if (!messagesToSend.length || (!messagesOverride && !currentInput.trim())) return;

    setIsSending(true);
    setError(null);
    
    if (!messagesOverride) {
      setMessages(prev => [...prev, { role: 'user', content: currentInput.trim() }]);
      setInput('');
    }

    try {
      const result = await askPulse({
        messages: messagesToSend,
        actor: currentUser.uid,
        conversationId,
      });

      if (result?.response) {
        setMessages(prev => [...prev, result.response]);
      } else {
        throw new Error('Resposta inválida da IA.');
      }
    } catch (err: any) {
      let errorMessage = 'Erro ao comunicar com a IA. Tente novamente.';
      if (err.message?.includes('500')) errorMessage = 'Erro interno do servidor. Tente em alguns momentos.';
      setError(errorMessage);
      setMessages(prev => prev.slice(0, prev.length -1)); // Revert optimistic update
    } finally {
      setIsSending(false);
    }
  }, [currentUser, conversationId, isSending, messages, input]);


  const fetchConversation = useCallback(async () => {
    if (!currentUser || !conversationId) return;

    setIsLoadingHistory(true);
    setError(null);
    try {
        const conversation = await getConversation({ conversationId, actor: currentUser.uid });
        if (conversation?.messages) {
            setMessages(conversation.messages);
            // This is handled by a separate useEffect now
        } else {
            throw new Error('Conversa não encontrada ou acesso negado.');
        }
    } catch (err: any) {
        setError('Não foi possível carregar a conversa.');
        setTimeout(() => router.push('/dashboard/pulse'), 3000);
    } finally {
        setIsLoadingHistory(false);
    }
  }, [currentUser, conversationId, router]);

  // Effect for initial loading
  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);
  
  // Effect for auto-triggering the first response
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'user' && !isSending) {
        handleSendMessage(undefined, messages);
    }
  }, [messages, isSending, handleSendMessage]);


  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isSending) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessages = () => {
    if (isLoadingHistory) {
      return (
        <div className="flex-grow flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando conversa...</p>
        </div>
      );
    }

    return messages.map((message, index) => (
      <div key={index} className={`flex items-start gap-4 mx-auto w-full ${message.role === 'user' ? 'justify-end' : ''}`}>
        {message.role !== 'user' && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pulse-primary text-black flex items-center justify-center">
            <BrainCircuit size={18} />
          </div>
        )}
        <div className={`max-w-2xl px-5 py-3 rounded-2xl ${message.role === 'user' ? 'bg-secondary text-primary-foreground' : 'bg-card text-foreground border'}`}>
          <p className="whitespace-pre-wrap text-base leading-relaxed">{message.content}</p>
        </div>
        {message.role === 'user' && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-muted-foreground flex items-center justify-center">
            <User size={18} />
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="flex flex-col h-full bg-black">
      <div className="flex-grow flex flex-col items-center w-full px-4 relative">
        <div ref={scrollAreaRef} className="flex-grow w-full max-w-4xl overflow-y-auto space-y-8 flex flex-col pt-8 pb-32">
          {renderMessages()}
          {isSending && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
            <div className="flex items-start gap-4 mx-auto w-full">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pulse-primary text-black flex items-center justify-center"><BrainCircuit size={18} /></div>
              <div className="max-w-lg px-5 py-3 rounded-2xl bg-card text-foreground border flex items-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Pensando...</span>
              </div>
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent">
          <div className="w-full max-w-4xl mx-auto px-4 pt-4 pb-8">
            <form onSubmit={handleSendMessage} className="relative">
              <div className="relative bg-card border border-border rounded-2xl shadow-2xl">
                <Textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={isSending ? "Aguarde a resposta..." : "Pergunte qualquer coisa sobre seu negócio..."} className="w-full pr-16 pl-4 py-4 bg-transparent rounded-2xl border-none focus:ring-0 text-base resize-none min-h-[56px] max-h-[120px]" disabled={isSending} />
                <Button type="submit" disabled={isSending || !input.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-pulse-primary text-primary-foreground rounded-xl transition-all duration-200 hover:bg-pulse-primary/90 disabled:bg-secondary disabled:text-muted-foreground">
                  {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUpIcon className="w-6 h-6" />}
                </Button>
              </div>
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
    </div>
  );
}
