
'use client';

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConversationItemProps {
    title: string;
    isActive: boolean;
    onClick: () => void;
    onDelete: () => void;
}

export function ConversationItem({ title, isActive, onClick, onDelete }: ConversationItemProps) {
    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent onClick of the parent from firing
        onDelete();
    }

    return (
        <div
            onClick={onClick}
            className={cn(
                "group flex items-center justify-between w-full text-left p-3 rounded-xl cursor-pointer transition-all duration-200",
                isActive 
                ? 'bg-primary text-white shadow-neumorphism-inset' 
                : 'text-gray-700 hover:bg-gray-100 hover:shadow-neumorphism'
            )}
        >
            <span className="text-sm font-medium truncate">{title}</span>
            <Button
                variant="ghost"
                size="icon"
                onClick={handleDeleteClick}
                className={cn(
                    "h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity",
                    isActive ? "hover:bg-primary/80" : "hover:bg-red-100 text-red-500"
                )}
            >
                <Trash2 className="w-4 h-4" />
            </Button>
        </div>
    );
}
