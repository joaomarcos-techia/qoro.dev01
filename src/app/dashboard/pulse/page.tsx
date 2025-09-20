'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createConversation } from '@/services/pulseService';
import type { PulseMessage } from '@/ai/schemas';

const ArrowUpIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" {...props}>
        <path d="M12 23V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 10l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export default function PulsePage() {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const router = useRouter();

    // Gerenciamento de autenticação melhorado
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setAuthLoading(true);
            
            if (!user) {
                console.log('[PulsePage] Usuário não autenticado, redirecionando...');
                router.push('/login');
            } else {
                console.log('[PulsePage] Usuário autenticado:', user.uid);
                setCurrentUser(user);
            }
            
            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    // Validação de entrada melhorada
    const validateInput = (text: string): { isValid: boolean; error?: string } => {
        const trimmed = text.trim();
        
        if (!trimmed) {
            return { isValid: false, error: 'Por favor, digite uma mensagem' };
        }
        
        if (trimmed.length > 4000) {
            return { isValid: false, error: 'Mensagem muito longa. Máximo 4000 caracteres' };
        }
        
        return { isValid: true };
    };

    // Função principal refatorada com melhor tratamento de erros
    const handleSendMessage = async (e?: FormEvent) => {
        e?.preventDefault();
        
        // Validações iniciais
        const validation = validateInput(input);
        if (!validation.isValid) {
            setError(validation.error || 'Entrada inválida');
            return;
        }

        if (isLoading) {
            console.log('[PulsePage] Operação em andamento, ignorando nova solicitação');
            return;
        }

        if (!currentUser) {
            setError('Usuário não autenticado. Faça login novamente.');
            return;
        }

        const messageText = input.trim();
        setIsLoading(true);
        setError(null);

        console.log('[PulsePage] Iniciando criação de conversa:', {
            userId: currentUser.uid,
            messageLength: messageText.length,
            messagePreview: messageText.substring(0, 50) + '...'
        });

        try {
            // Preparar dados da mensagem
            const userMessage: PulseMessage = { 
                role: 'user', 
                content: messageText 
            };

            const conversationData = {
                actor: currentUser.uid,
                messages: [userMessage],
                title: messageText.substring(0, 40).trim() || 'Nova Conversa',
            };

            console.log('[PulsePage] Dados da conversa preparados:', {
                actor: conversationData.actor,
                messagesCount: conversationData.messages.length,
                title: conversationData.title
            });

            // Criar conversa
            const newConversation = await createConversation(conversationData);

            console.log('[PulsePage] Resposta do createConversation:', newConversation);

            // Validar resposta
            if (!newConversation) {
                throw new Error('Resposta inválida do servidor - conversa não criada');
            }

            if (!newConversation.id) {
                console.error('[PulsePage] Conversa criada sem ID:', newConversation);
                throw new Error('Erro interno: conversa criada mas sem identificador válido');
            }

            console.log('[PulsePage] Conversa criada com sucesso, redirecionando para:', `/dashboard/pulse/${newConversation.id}`);

            // Limpar formulário antes de redirecionar
            setInput('');
            
            // Redirecionar para a conversa
            router.push(`/dashboard/pulse/${newConversation.id}`);

        } catch (error: any) {
            console.error('[PulsePage] Erro ao criar conversa:', {
                error: error,
                message: error?.message,
                stack: error?.stack,
                name: error?.name
            });

            let errorMessage = 'Ocorreu um erro inesperado. Tente novamente em alguns momentos.';

            // Tratar diferentes tipos de erro
            if (error?.message) {
                if (error.message.includes('Network')) {
                    errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
                } else if (error.message.includes('500')) {
                    errorMessage = 'Erro interno do servidor. Nossa equipe foi notificada.';
                } else if (error.message.includes('401') || error.message.includes('403')) {
                    errorMessage = 'Sessão expirada. Faça login novamente.';
                } else if (error.message.includes('timeout')) {
                    errorMessage = 'Operação demorou muito. Tente novamente.';
                } else {
                    errorMessage = error.message;
                }
            }

            setError(errorMessage);
            setIsLoading(false);
        }
    };

    // Função para tratamento de teclas
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Loading de autenticação
    if (authLoading) {
        return (
            <div className="flex flex-col h-full bg-black items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Verificando autenticação...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-black">
            <div className="flex-grow flex flex-col items-center w-full px-4 relative">
                <div className="flex-grow w-full max-w-4xl flex flex-col justify-center items-center pb-32">
                    
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center">
                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                            <p className="mt-4 text-muted-foreground">Iniciando conversa...</p>
                            <p className="mt-2 text-xs text-muted-foreground/60">
                                Isso pode levar alguns segundos
                            </p>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="inline-block p-4 bg-pulse-primary/20 rounded-full mb-6 border border-pulse-primary/30">
                                <Sparkles className="w-10 h-10 text-pulse-primary"/>
                            </div>
                            <h1 className="text-4xl font-bold text-foreground mb-4">
                                Como posso te ajudar hoje?
                            </h1>
                            <p className="text-muted-foreground max-w-lg">
                                Você pode perguntar sobre vendas, finanças, tarefas ou qualquer insight sobre seu negócio.
                            </p>
                        </div>
                    )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent">
                    <div className="w-full max-w-4xl mx-auto px-4 pt-4 pb-8">
                        <form onSubmit={handleSendMessage} className="relative bg-card border border-border rounded-2xl shadow-2xl">
                            <Textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Comece uma nova conversa com o QoroPulse..."
                                className="w-full pr-20 pl-4 py-4 bg-transparent rounded-2xl border-none focus:ring-0 text-base resize-none"
                                rows={1}
                                disabled={isLoading}
                                maxLength={4000}
                            />
                            <Button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-pulse-primary text-primary-foreground rounded-2xl transition-all duration-300 hover:bg-pulse-primary/90 disabled:bg-secondary disabled:text-muted-foreground"
                            >
                                {isLoading ? (
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

                        {/* Contador de caracteres */}
                        {input.length > 3500 && (
                            <div className="text-xs text-muted-foreground mt-2 text-center">
                                {input.length}/4000 caracteres
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
