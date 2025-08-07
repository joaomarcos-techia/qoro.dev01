
'use client';

import { useState, useRef, useEffect, FormEvent, useCallback } from 'react';
import { Send, CornerDownLeft, BrainCircuit, Loader, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { askPulse, listConversations, deleteConversation as deleteConversationFlow } from '@/ai/flows/pulse-flow';
import type { PulseMessage, Conversation } from '@/ai/schemas';
import { ConversationHistory } from '@/components/dashboard/pulse/ConversationHistory';

const exampleQuestions = [
    "Quais são meus clientes mais valiosos este mês?",
    "Resuma o progresso do projeto 'Website Redesign'.",
    "Qual foi a minha principal fonte de despesas em julho?",
    "Crie 3 follow-ups para leads que não respondem há uma semana."
]

export default function PulsePage() {
  const [messages, setMessages] = useState<PulseMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const fetchConversations = useCallback(async () => {
    if (!currentUser) return;
    try {
        const convos = await listConversations(currentUser.uid);
        setConversations(convos);
    } catch (error) {
        console.error("Failed to fetch conversations", error);
    }
  }, [currentUser]);


  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setInput('');
  }

  const handleSelectConversation = (conversation: Conversation) => {
    setActiveConversationId(conversation.id);
    setMessages(conversation.messages);
  }

  const handleDeleteConversation = async (conversationId: string) => {
    if (!currentUser) return;
    try {
        await deleteConversationFlow(conversationId, currentUser.uid);
        setConversations(prev => prev.filter(c => c.id !== conversationId));
        if (activeConversationId === conversationId) {
            handleNewConversation();
        }
    } catch (error) {
        console.error("Failed to delete conversation", error);
    }
  }
  
  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !currentUser) return;
  
    const userMessage: PulseMessage = { role: 'user', content: input };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput('');
    setIsLoading(true);
  
    try {
        const response = await askPulse({
            messages: currentMessages,
            actor: currentUser.uid,
            conversationId: activeConversationId || undefined,
        });

        const assistantMessage: PulseMessage = {
            role: 'assistant',
            content: response.content,
        }
        setMessages(prev => [...prev, assistantMessage]);
        
        // If it was a new conversation, the ID is returned
        if (response.conversationId && !activeConversationId) {
            setActiveConversationId(response.conversationId);
            fetchConversations(); // Refresh history
        }

    } catch (error) {
        console.error("Error calling Pulse Flow:", error);
        const errorMessage: PulseMessage = {
            role: 'assistant',
            content: 'Desculpe, não consegui processar sua solicitação. Tente novamente mais tarde.'
        }
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleSuggestionClick = (question: string) => {
    setInput(question);
  }

  return (
    <div className="flex h-[calc(100vh-120px)]">
        <ConversationHistory 
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            onDeleteConversation={handleDeleteConversation}
        />
        <div className="flex flex-col flex-1 max-w-4xl mx-auto">
            <div className="mb-6 text-center">
                    <h1 className="text-3xl font-bold text-black flex items-center justify-center">
                        <BrainCircuit className="w-8 h-8 mr-3 text-primary"/>
                        QoroPulse
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Converse com seus dados e obtenha insights de negócio em tempo real.
                    </p>
                </div>
            <div 
                ref={scrollAreaRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 bg-white rounded-t-2xl shadow-neumorphism border border-gray-200"
            >
                {messages.length === 0 && !isLoading ? (
                    <div className="text-center text-gray-500">
                        <p className="mb-8">Como posso ajudar você a otimizar sua empresa hoje?</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {exampleQuestions.map((q, i) => (
                                <button 
                                    key={i}
                                    onClick={() => handleSuggestionClick(q)}
                                    className="bg-gray-50/80 hover:bg-gray-100 p-4 rounded-xl text-left text-sm font-medium shadow-neumorphism hover:shadow-neumorphism-hover transition-all duration-300"
                                >
                                {q}
                                </button>
                            ))}
                        </div>
                    </div>
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
                        className={`max-w-lg px-5 py-3 rounded-2xl shadow-sm ${
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
            <div className="bg-white p-4 border-t border-gray-200 rounded-b-2xl shadow-neumorphism">
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
                    className="w-full pr-20 py-3 pl-4 bg-gray-50 rounded-xl shadow-neumorphism-inset focus:ring-2 focus:ring-primary"
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
    </div>
  );
}
