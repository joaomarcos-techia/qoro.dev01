
'use client';
import { PlusCircle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConversationItem } from './ConversationItem';
import type { Conversation } from '@/ai/schemas';

interface ConversationHistoryProps {
    conversations: Conversation[];
    activeConversationId: string | null;
    onSelectConversation: (conversation: Conversation) => void;
    onNewConversation: () => void;
    onDeleteConversation: (conversationId: string) => void;
}

export function ConversationHistory({ 
    conversations, 
    activeConversationId, 
    onSelectConversation, 
    onNewConversation,
    onDeleteConversation 
}: ConversationHistoryProps) {
    return (
        <aside className="w-72 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col shadow-neumorphism-right p-4">
            <Button 
                onClick={onNewConversation}
                className="w-full mb-4 bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-neumorphism hover:shadow-neumorphism-hover flex items-center justify-center font-semibold"
            >
                <PlusCircle className="mr-2 w-5 h-5"/>
                Nova Conversa
            </Button>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {conversations.length > 0 ? (
                    conversations.map(convo => (
                        <ConversationItem
                            key={convo.id}
                            title={convo.title}
                            isActive={convo.id === activeConversationId}
                            onClick={() => onSelectConversation(convo)}
                            onDelete={() => onDeleteConversation(convo.id)}
                        />
                    ))
                ) : (
                    <div className="text-center text-gray-400 mt-10">
                        <MessageSquare className="mx-auto w-10 h-10 mb-2"/>
                        <p className="text-sm">Seu histórico de conversas aparecerá aqui.</p>
                    </div>
                )}
            </div>
        </aside>
    );
}
