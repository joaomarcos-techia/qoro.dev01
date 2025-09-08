
'use client';

import { useState, useEffect, FormEvent, useTransition } from 'react';
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
  const [isSending, setIsSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isLoading = isSending || isPending;

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
  

  const handleSendMessage = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || !currentUser) return;
  
    const userMessage: PulseMessage = { role: 'user', content: input };
    
    setInput('');
    setIsSending(true);
    setError(null);
  
    try {
        const { id: newConversationId } = await createConversation(currentUser.uid, 'Nova Conversa', [userMessage]);

        if (newConversationId) {
             startTransition(() => {
                router.push(`/dashboard/pulse/${newConversationId}`);
            });
        } else {
            throw new Error("Não foi possível criar a conversa.");
        }

    } catch (error: any) {
        console.error("Error creating conversation:", error);
        setError(error.message || 'Ocorreu um erro ao iniciar a conversa. Tente novamente.');
        setIsSending(false);
    }
  };


  return (
    <div className="flex flex-col h-full bg-black">
        <div className="flex-grow flex flex-col items-center w-full px-4 relative">
            <div className="flex-grow w-full max-w-4xl flex flex-col justify-center items-center pb-32">
                
                {isLoading ? (
                     <div className="flex flex-col items-center justify-center">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="mt-4 text-muted-foreground">Iniciando conversa...</p>
                    </div>
                ) : (
                    <div className="text-center">
                        <div className="inline-block p-4 bg-pulse-primary/20 rounded-full mb-6 border border-pulse-primary/30">
                            <Sparkles className="w-10 h-10 text-pulse-primary"/>
                        </div>
                        <h1 className="text-4xl font-bold text-foreground mb-4">Como posso te ajudar hoje?</h1>
                        <p className="text-muted-foreground max-w-lg">Você pode perguntar sobre vendas, finanças, tarefas ou qualquer insight sobre seu negócio.</p>
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
                            placeholder="Comece uma nova conversa com o QoroPulse..."
                            className="w-full pr-20 pl-4 py-4 bg-transparent rounded-2xl border-none focus:ring-0 text-base resize-none"
                            rows={1}
                            disabled={isLoading}
                        />
                        <Button
                            type="submit"
                            disabled={isLoading || !input.trim()}
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
