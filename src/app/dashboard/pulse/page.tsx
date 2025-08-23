
'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Send, BrainCircuit, Loader, AlertCircle, Sparkles, Code, Pencil, FlaskConical, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { askPulse } from '@/ai/flows/pulse-flow';
import type { PulseMessage } from '@/ai/schemas';

const exampleQuestions = [
    { text: "Qual foi meu produto mais vendido?", icon: Sparkles },
    { text: "Crie um script de follow-up para um cliente.", icon: Pencil },
    { text: "Qual a principal fonte de despesas este mês?", icon: FlaskConical },
    { text: "Resuma as tarefas de alta prioridade.", icon: Code },
];

export default function PulsePage() {
  const [messages, setMessages] = useState<PulseMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: FormEvent) => {
    e?.preventDefault();
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
        });

        const assistantMessage: PulseMessage = {
            role: 'assistant',
            content: response.content,
        }
        setMessages(prev => [...prev, assistantMessage]);

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
    <div className="flex-grow flex flex-col items-center justify-center text-center">
        <div className="flex items-center text-4xl font-bold text-foreground mb-10">
             <Sparkles className="w-9 h-9 mr-4 text-pulse-primary" />
            <span>Boa tarde, {userName.split(' ')[0]}</span>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-black">
        {/* Main Content */}
        <div className="flex-grow flex flex-col items-center w-full px-4">
            {/* Chat Area */}
            <div 
                ref={scrollAreaRef}
                className="flex-grow w-full max-w-4xl overflow-y-auto space-y-8 flex flex-col pt-8"
            >
                {messages.length === 0 && !isLoading ? (
                    renderWelcomeScreen()
                ) : (
                    messages.map((message, index) => (
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
                            : 'bg-transparent text-foreground'
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
                )}
                {isLoading && (
                <div className="flex items-start gap-4 mx-auto w-full">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pulse-primary text-black flex items-center justify-center">
                        <BrainCircuit size={18} />
                    </div>
                    <div className="max-w-lg px-5 py-3 rounded-2xl bg-secondary text-foreground flex items-center">
                        <Loader className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                </div>
                )}
            </div>

            {/* Input Area */}
            <div className="w-full max-w-4xl pt-4 pb-8 bg-black">
                 {messages.length === 0 && !isLoading && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        {exampleQuestions.map((q, i) => {
                            const Icon = q.icon;
                            return (
                            <Button 
                                key={i}
                                onClick={() => handleSuggestionClick(q.text)}
                                variant="outline"
                                className="bg-secondary/50 border-border hover:bg-secondary/80 justify-start"
                            >
                                <Icon className="w-4 h-4 mr-2 text-pulse-primary"/>
                                {q.text}
                            </Button>
                        )})}
                    </div>
                )}
                <div className="relative">
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            handleSendMessage(e);
                        }
                        }}
                        placeholder="Pergunte qualquer coisa sobre seu negócio..."
                        className="w-full pr-14 py-4 pl-4 bg-secondary rounded-2xl border-2 border-border focus:ring-2 focus:ring-pulse-primary/50 text-base resize-none"
                        rows={1}
                        disabled={isLoading}
                    />
                    <Button
                        type="button"
                        onClick={() => handleSendMessage()}
                        size="icon"
                        disabled={isLoading || !input.trim()}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-pulse-primary text-primary-foreground rounded-lg hover:bg-pulse-primary/90 disabled:bg-gray-600"
                    >
                        <Send size={20} />
                    </Button>
                </div>
                 {error && (
                    <div className="text-destructive text-sm mt-2 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        {error}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
