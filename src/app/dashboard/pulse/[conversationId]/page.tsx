
'use client';

import { useState, useRef, useEffect, FormEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Send, BrainCircuit, Loader, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { askPulse, getConversation } from '@/ai/flows/pulse-flow';
import type { PulseMessage, Conversation } from '@/ai/schemas';

const exampleQuestions = [
    "Quais são meus clientes mais valiosos este mês?",
    "Resuma o progresso do projeto 'Website Redesign'.",
    "Qual foi a minha principal fonte de despesas em julho?",
    "Crie 3 follow-ups para leads que não respondem há uma semana."
]

export default function PulsePage({ params }: { params: { conversationId: string } }) {
  const [messages, setMessages] = useState<PulseMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const conversationId = params.conversationId;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!currentUser || !conversationId) return;

    if (conversationId === 'new') {
        setMessages([]);
        setIsHistoryLoading(false);
        return;
    }
    
    setIsHistoryLoading(true);
    try {
        const convo = await getConversation({ actor: currentUser.uid, conversationId });
        if (convo) {
            setMessages(convo.messages);
        } else {
             setError("Conversa não encontrada ou acesso negado.");
        }
    } catch (err) {
        console.error("Failed to fetch conversation history:", err);
        setError("Não foi possível carregar o histórico da conversa.");
    } finally {
        setIsHistoryLoading(false);
    }
  }, [currentUser, conversationId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);


  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !currentUser) return;
  
    const userMessage: PulseMessage = { role: 'user', content: input };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput('');
    setIsLoading(true);
    setError(null);
  
    try {
        const response = await askPulse({
            messages: currentMessages,
            actor: currentUser.uid,
            conversationId: conversationId,
        });

        const assistantMessage: PulseMessage = {
            role: 'assistant',
            content: response.content,
        }
        setMessages(prev => [...prev, assistantMessage]);
        
        // If this was a new conversation, the backend returns the new ID.
        // We then redirect to the new URL, which triggers a re-render of the layout.
        if (response.conversationId && conversationId !== response.conversationId) {
             router.push(`/dashboard/pulse/${response.conversationId}`);
        }

    } catch (error) {
        console.error("Error calling Pulse Flow:", error);
        const errorMessage: PulseMessage = {
            role: 'assistant',
            content: 'Desculpe, não consegui processar sua solicitação. Tente novamente mais tarde.'
        }
        setMessages(prev => [...prev, errorMessage]);
        setError('Ocorreu um erro ao comunicar com a IA.');
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleSuggestionClick = (question: string) => {
    setInput(question);
    const textarea = document.querySelector('textarea');
    if (textarea) textarea.focus();
  }

  const renderWelcomeScreen = () => (
     <div className="text-center text-gray-500 h-full flex flex-col justify-center max-w-2xl mx-auto">
        <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-black flex items-center justify-center">
                <BrainCircuit className="w-8 h-8 mr-3 text-primary"/>
                QoroPulse
            </h1>
            <p className="text-gray-600 mt-2">
                Converse com seus dados e obtenha insights de negócio em tempo real.
            </p>
        </div>
        <p className="mb-8">Como posso ajudar você a otimizar sua empresa hoje?</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exampleQuestions.map((q, i) => (
                <button 
                    key={i}
                    onClick={() => handleSuggestionClick(q)}
                    className="bg-white hover:bg-gray-100 p-4 rounded-xl text-left text-sm font-medium shadow-neumorphism hover:shadow-neumorphism-hover transition-all duration-300 border border-gray-100"
                >
                {q}
                </button>
            ))}
        </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
        <div 
            ref={scrollAreaRef}
            className="flex-1 overflow-y-auto p-6 space-y-6"
        >
            {isHistoryLoading ? (
                 <div className="flex justify-center items-center h-full">
                    <Loader className="w-8 h-8 animate-spin text-primary" />
                 </div>
            ) : messages.length === 0 && conversationId === 'new' ? (
                renderWelcomeScreen()
            ) : (
                messages.map((message, index) => (
                <div
                    key={index}
                    className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}
                >
                    {message.role === 'assistant' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                            <BrainCircuit size={18} />
                        </div>
                    )}
                    <div
                    className={`max-w-xl px-5 py-3 rounded-2xl shadow-sm ${
                        message.role === 'user'
                        ? 'bg-primary/90 text-white rounded-br-none'
                        : 'bg-gray-100 text-black rounded-bl-none'
                    }`}
                    >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center shadow-md font-semibold">
                            {currentUser?.email?.[0].toUpperCase() ?? 'U'}
                        </div>
                    )}
                </div>
                ))
            )}
            {isLoading && (
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                    <BrainCircuit size={18} />
                </div>
                <div className="max-w-lg px-5 py-3 rounded-2xl shadow-sm bg-gray-100 text-black rounded-bl-none flex items-center">
                    <Loader className="w-5 h-5 animate-spin text-gray-500" />
                </div>
            </div>
            )}
        </div>
        <div className="bg-transparent px-4 pb-4">
            {error && (
                <div className="bg-red-100 text-red-700 p-2 rounded-md text-sm mb-2 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {error}
                </div>
            )}
            <form onSubmit={handleSendMessage} className="relative">
            <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                }
                }}
                placeholder="Pergunte qualquer coisa sobre seu negócio..."
                className="w-full pr-20 py-3 pl-4 bg-white rounded-xl shadow-neumorphism-inset focus:ring-2 focus:ring-primary border border-gray-200"
                rows={1}
                disabled={isLoading}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                <p className="text-xs text-gray-400 mr-2 hidden sm:block">
                    <kbd className="font-sans">Shift</kbd> + <kbd className="font-sans">Enter</kbd> para nova linha
                </p>
                <Button
                    type="submit"
                    size="icon"
                    disabled={isLoading || !input.trim()}
                    className="w-10 h-10 bg-primary text-white rounded-lg shadow-neumorphism hover:shadow-neumorphism-hover disabled:bg-gray-300"
                >
                    <Send size={20} />
                </Button>
            </div>
            </form>
        </div>
    </div>
  );
}
