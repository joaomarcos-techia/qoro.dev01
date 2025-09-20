'use client';

import { useState, useRef, useEffect, FormEvent, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BrainCircuit, Loader2, AlertCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { askPulse } from '@/ai/flows/pulse-flow';
import { getConversation } from '@/services/pulseService';
import { getUserProfile, getUserAccessInfo } from '@/ai/flows/user-management';
import type { PulseMessage } from '@/ai/schemas';

const ArrowUpIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M12 23V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 10l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function normalizeMessages(messages: PulseMessage[]): PulseMessage[] {
  if (!Array.isArray(messages)) return [];
  return messages.map((m) => ({
    role: m.role || 'user',
    content: String(m.content || '').trim() || '[mensagem vazia]',
  }));
}

export default function PulseConversationPage() {
  const [messages, setMessages] = useState<PulseMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<{name?: string, organizationName?: string, planId?: string} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsAutoTrigger, setNeedsAutoTrigger] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;

  // Autenticação e busca de perfil
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
      } else {
        setCurrentUser(user);
        if (!userProfile) {
            try {
                const [profile, access] = await Promise.all([
                    getUserProfile({actor: user.uid}),
                    getUserAccessInfo({actor: user.uid})
                ]);
                setUserProfile({ name: profile.name, organizationName: profile.organizationName, planId: access.planId });
            } catch (err) {
                setError("Não foi possível carregar os dados do seu perfil.");
            }
        }
      }
    });
    return () => unsubscribe();
  }, [router, userProfile]);

  // Handler principal para envio de mensagens
  const handleSendMessage = useCallback(async (e?: FormEvent) => {
    e?.preventDefault();
    const messageText = input.trim();

    // Validações
    if (!messageText && !needsAutoTrigger) return;
    if (isSending || !currentUser || !conversationId || !userProfile) return;

    const currentMessages = [...messages];
    
    // Adicionar nova mensagem do usuário (se não for auto-trigger)
    if (!needsAutoTrigger && messageText) {
      const userMessage: PulseMessage = { role: 'user', content: messageText };
      currentMessages.push(userMessage);
      setMessages(currentMessages);
      setInput('');
    }

    setIsSending(true);
    setError(null);
    setNeedsAutoTrigger(false);

    try {
      const result = await askPulse({
        messages: normalizeMessages(currentMessages),
        actor: currentUser.uid,
        conversationId,
        userName: userProfile.name,
        organizationName: userProfile.organizationName,
        planId: userProfile.planId,
      });

      const safeResponse: PulseMessage = {
        role: 'assistant',
        content: String(result.response.content || 'Resposta vazia').trim() || '[sem resposta]',
      };

      setMessages(prev => [...prev, safeResponse]);

    } catch (error: any) {
      const errorMessage = error.message?.includes('temporariamente indisponível')
        ? error.message
        : 'Erro ao comunicar com a IA. Tente novamente.';
      
      setError(errorMessage);

      // Desfazer UI otimista apenas para mensagens normais
      if (!needsAutoTrigger && messageText) {
        setMessages(prev => prev.slice(0, -1));
      }
    } finally {
      setIsSending(false);
    }
  }, [input, messages, isSending, currentUser, conversationId, needsAutoTrigger, userProfile]);

  // Carregamento do histórico
  const fetchConversationHistory = useCallback(async () => {
    if (!conversationId || !currentUser) return;

    setIsLoadingHistory(true);
    setError(null);

    try {
      const conversation = await getConversation({ 
        conversationId, 
        actor: currentUser.uid 
      });

      if (conversation?.messages) {
        const normalized = normalizeMessages(conversation.messages);
        setMessages(normalized);

        // Marcar para auto-trigger se necessário
        if (normalized.length === 1 && normalized[0].role === 'user') {
          setNeedsAutoTrigger(true);
        }
      } else {
        setError('Conversa não encontrada ou sem permissão de acesso.');
        setTimeout(() => router.push('/dashboard/pulse'), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Não foi possível carregar o histórico.');
    } finally {
      setIsLoadingHistory(false);
    }
  }, [conversationId, currentUser, router]);

  // Efeito para auto-trigger após carregamento
  useEffect(() => {
    if (needsAutoTrigger && !isSending && !isLoadingHistory && messages.length > 0) {
      // Delay para garantir que o componente está pronto
      const timer = setTimeout(() => {
        handleSendMessage();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [needsAutoTrigger, isSending, isLoadingHistory, messages.length, handleSendMessage]);

  useEffect(() => {
    if (currentUser) {
      fetchConversationHistory();
    }
  }, [currentUser, fetchConversationHistory]);

  // Auto-scroll
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Tratamento de teclas
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isSending) {
        handleSendMessage();
      }
    }
  };

  // Renderização das mensagens
  const renderMessages = () => {
    if (isLoadingHistory || !userProfile) {
      return (
        <div className="flex-grow flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Carregando conversa...</p>
        </div>
      );
    }

    if (messages.length === 0) {
      return (
        <div className="flex-grow flex flex-col items-center justify-center">
          <BrainCircuit className="w-12 h-12 text-pulse-primary mb-4" />
          <p className="text-muted-foreground text-center">
            Comece uma conversa com o QoroPulse
          </p>
        </div>
      );
    }

    return messages.map((message, index) => (
      <div
        key={`${message.role}-${index}`}
        className={`flex items-start gap-4 mx-auto w-full ${
          message.role === 'user' ? 'justify-end' : ''
        }`}
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
              : 'bg-card text-foreground border'
          }`}
        >
          <p className="whitespace-pre-wrap text-base leading-relaxed">
            {message.content}
          </p>
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
        <div
          ref={scrollAreaRef}
          className="flex-grow w-full max-w-4xl overflow-y-auto space-y-8 flex flex-col pt-8 pb-32"
        >
          {renderMessages()}

          {/* Indicador de digitação */}
          {isSending && (
            <div className="flex items-start gap-4 mx-auto w-full">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pulse-primary text-black flex items-center justify-center">
                <BrainCircuit size={18} />
              </div>
              <div className="max-w-lg px-5 py-3 rounded-2xl bg-card text-foreground border flex items-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Pensando...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Área de input */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent">
          <div className="w-full max-w-4xl mx-auto px-4 pt-4 pb-8">
            <form onSubmit={handleSendMessage} className="relative">
              <div className="relative bg-card border border-border rounded-2xl shadow-2xl">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pergunte qualquer coisa sobre seu negócio..."
                  className="w-full pr-16 pl-4 py-4 bg-transparent rounded-2xl border-none focus:ring-0 text-base resize-none min-h-[56px] max-h-[120px]"
                  disabled={isSending}
                />
                <Button
                  type="submit"
                  disabled={isSending || !input.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-pulse-primary text-primary-foreground rounded-xl transition-all duration-200 hover:bg-pulse-primary/90 disabled:bg-secondary disabled:text-muted-foreground"
                >
                  {isSending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowUpIcon className="w-6 h-6" />
                  )}
                </Button>
              </div>
            </form>
            
            {/* Exibição de erro */}
            {error && (
              <div className="text-destructive text-sm mt-3 flex items-center justify-center bg-destructive/10 rounded-lg p-2">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-center">{error}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
