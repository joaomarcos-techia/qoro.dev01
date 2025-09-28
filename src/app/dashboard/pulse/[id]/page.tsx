
'use client';

import { useState, useRef, useEffect, FormEvent, useCallback, useTransition } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { BrainCircuit, Loader2, AlertCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { askPulse } from '@/ai/flows/pulse-flow';
import { getConversation } from '@/services/pulseService';
import type { PulseMessage } from '@/ai/schemas';
import { MarkdownRenderer } from '@/components/utils/MarkdownRenderer';

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
                          const params = useParams();
                            const [currentConversationId, setCurrentConversationId] = useState(params.id as string);
                              const [isPending, startTransition] = useTransition();
                                
                                  const scrollAreaRef = useRef<HTMLDivElement>(null);
                                    const router = useRouter();
                                      const searchParams = useSearchParams();

                                        // Ref para garantir que a mensagem inicial seja enviada apenas uma vez
                                          const initialMessageSentRef = useRef(false);

                                            const handleSendMessage = useCallback(async (e?: FormEvent, initialMessage?: string) => {
                                              e?.preventDefault();
                                              const messageContent = initialMessage || input.trim();
                                              if (isSending || !currentUser?.uid || !messageContent) return;
                                          
                                              setIsSending(true);
                                              setError(null);
                                              if (!initialMessage) {
                                                setInput('');
                                              }
                                          
                                              const optimisticUserMessage: PulseMessage = { role: 'user', content: messageContent };
                                          
                                              const messagesToSend = [...messages, optimisticUserMessage];
                                              setMessages(messagesToSend);
                                          
                                              const conversationIdToSend = currentConversationId === 'new' ? undefined : currentConversationId;
                                          
                                              try {
                                                const result = await askPulse({
                                                  messages: messagesToSend,
                                                  actor: currentUser.uid,
                                                  conversationId: conversationIdToSend,
                                                });
                                          
                                                if (result?.response) {
                                                  // Replace optimistic response with actual response
                                                  setMessages([...messages, optimisticUserMessage, result.response]);
                                                } else {
                                                  throw new Error('Resposta inválida da IA.');
                                                }
                                          
                                                if (currentConversationId === 'new' && result.conversationId) {
                                                  setCurrentConversationId(result.conversationId);
                                                  startTransition(() => {
                                                    router.replace(`/dashboard/pulse/${result.conversationId}`, { scroll: false });
                                                  });
                                                }
                                          
                                              } catch (err: any) {
                                                console.error("Error in handleSendMessage:", err);
                                                setError(err.message || 'Falha ao gerar resposta da IA.');
                                                setMessages(prev => prev.slice(0, -1));
                                              } finally {
                                                setIsSending(false);
                                              }
                                            }, [currentUser, currentConversationId, isSending, messages, input, router]);
                                                                                                                                                                                                                                                                                                    
                                              useEffect(() => {
                                                  if (currentConversationId === 'new' && currentUser && !initialMessageSentRef.current) {
                                                        const initialQuery = searchParams.get('q');
                                                              if (initialQuery) {
                                                                      initialMessageSentRef.current = true; 
                                                                              handleSendMessage(undefined, initialQuery);
                                                                                    } else {
                                                                                            setIsLoadingHistory(false);
                                                                                                  }
                                                                                                      }
                                                                                                        }, [currentConversationId, currentUser, searchParams, handleSendMessage]);


                                                                                                              const fetchConversation = useCallback(async () => {
                                                                                                                  if (!currentUser || !currentConversationId || currentConversationId === 'new') {
                                                                                                                          setIsLoadingHistory(false);
                                                                                                                                  return;
                                                                                                                                      }

                                                                                                                                          setIsLoadingHistory(true);
                                                                                                                                              setError(null);
                                                                                                                                                  try {
                                                                                                                                                          const conversation = await getConversation({ conversationId: currentConversationId, actor: currentUser.uid });
                                                                                                                                                                  if (conversation?.messages) {
                                                                                                                                                                              setMessages(conversation.messages);
                                                                                                                                                                                      } else {
                                                                                                                                                                                                  router.push('/dashboard/pulse');
                                                                                                                                                                                                          }
                                                                                                                                                                                                              } catch (err: any) {
                                                                                                                                                                                                                      setError(err.message || 'Não foi possível carregar a conversa.');
                                                                                                                                                                                                                              setTimeout(() => router.push('/dashboard/pulse'), 3000);
                                                                                                                                                                                                                                  } finally {
                                                                                                                                                                                                                                          setIsLoadingHistory(false);
                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                }, [currentUser, currentConversationId, router]);

                                                                                                                                                                                                                                                  useEffect(() => {
                                                                                                                                                                                                                                                      const unsubscribe = onAuthStateChanged(auth, (user) => {
                                                                                                                                                                                                                                                            if (user) {
                                                                                                                                                                                                                                                                    setCurrentUser(user);
                                                                                                                                                                                                                                                                          } else {
                                                                                                                                                                                                                                                                                  router.push('/login');
                                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                                            });
                                                                                                                                                                                                                                                                                                return () => unsubscribe();
                                                                                                                                                                                                                                                                                                  }, [router]);

                                                                                                                                                                                                                                                                                                    useEffect(() => {
                                                                                                                                                                                                                                                                                                        if (currentConversationId !== 'new') {
                                                                                                                                                                                                                                                                                                                fetchConversation();
                                                                                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                                                                                      }, [currentConversationId, fetchConversation]);

                                                                                                                                                                                                                                                                                                                        useEffect(() => {
                                                                                                                                                                                                                                                                                                                            if (scrollAreaRef.current) {
                                                                                                                                                                                                                                                                                                                                  scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
                                                                                                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                                                                                                        }, [messages, isSending]);

                                                                                                                                                                                                                                                                                                                                          const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                                                                                                                                                                                                                                                                                                                                              if (e.key === 'Enter' && !e.shiftKey && !isSending) {
                                                                                                                                                                                                                                                                                                                                                    e.preventDefault();
                                                                                                                                                                                                                                                                                                                                                          handleSendMessage();
                                                                                                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                                                                                                                };

                                                                                                                                                                                                                                                                                                                                                                  const renderMessages = () => {
                                                                                                                                                                                                                                                                                                                                                                      if (isLoadingHistory && currentConversationId !== 'new') {
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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       {message.role === 'user' ? (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       <p className="whitespace-pre-wrap text-base leading-relaxed">{message.content}</p>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   ) : (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   <MarkdownRenderer content={message.content} />
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               )}
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
                <div className="flex flex-col h-full bg-background">
                <div ref={scrollAreaRef} className="flex-grow flex flex-col items-center w-full px-4 overflow-y-auto relative">
                  <div className="w-full max-w-4xl flex-grow flex flex-col justify-end">
                    <div className="space-y-6 py-8">
                        {renderMessages()}
                        {isSending && (
                            <div className="flex items-start gap-4 mx-auto w-full">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pulse-primary text-black flex items-center justify-center">
                                <Loader2 className="animate-spin" size={18} />
                                </div>
                                <div className="max-w-2xl px-5 py-3 rounded-2xl bg-card text-foreground border">
                                <p className="text-muted-foreground">QoroPulse está pensando...</p>
                                </div>
                            </div>
                        )}
                    </div>
                  </div>
                </div>

                <div className="w-full bg-gradient-to-t from-background via-background/90 to-transparent">
                    <div className="w-full max-w-4xl mx-auto px-4 pt-4 pb-8">
                        <form onSubmit={handleSendMessage} className="relative bg-card border border-border rounded-2xl shadow-2xl">
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Continue a conversa..."
                            className="w-full pr-20 pl-4 py-4 bg-transparent rounded-2xl border-none focus:ring-0 text-base resize-none"
                            rows={1}
                            disabled={isSending || isLoadingHistory}
                            maxLength={4000}
                        />
                        <Button
                            type="submit"
                            disabled={isSending || !input.trim() || isLoadingHistory}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-pulse-primary text-primary-foreground rounded-2xl transition-all duration-300 hover:bg-pulse-primary/90 disabled:bg-secondary disabled:text-muted-foreground"
                        >
                            {isSending ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <ArrowUpIcon className="w-6 h-6" />
                            )}
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
