
'use client';

import { SaleLeadProfile } from '@/ai/schemas';
import { Button } from '@/components/ui/button';
import { User, DollarSign, ChevronLeft, ChevronRight, Archive } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"

interface KanbanCardProps {
  lead: SaleLeadProfile;
  stageIds: string[];
  onMove: (leadId: string, newStage: SaleLeadProfile['stage']) => void;
}

const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value);
};


export function KanbanCard({ lead, stageIds, onMove }: KanbanCardProps) {
  
  const currentStageIndex = stageIds.findIndex(id => id === lead.stage);

  const handleMove = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'next' ? currentStageIndex + 1 : currentStageIndex - 1;
    if (newIndex >= 0 && newIndex < stageIds.length) {
        onMove(lead.id, stageIds[newIndex] as SaleLeadProfile['stage']);
    }
  };

  const isTerminalStage = lead.stage === 'won' || lead.stage === 'lost';

  return (
    <div className="bg-card rounded-xl p-4 transition-shadow duration-300 border border-border hover:border-primary/50">
      <h3 className="font-bold text-foreground text-base mb-3 break-words">{lead.title}</h3>
      
      <div className="space-y-2 text-sm text-muted-foreground min-h-[4rem]">
        {lead.customerName && (
            <div className="flex items-center">
                <User className="w-4 h-4 mr-2 text-muted-foreground/70 flex-shrink-0" />
                <span className="truncate">{lead.customerName}</span>
            </div>
        )}
        <div className="flex items-center font-semibold">
            <DollarSign className="w-4 h-4 mr-2 text-green-400/70 flex-shrink-0" />
            <span className="truncate text-green-400">{formatCurrency(lead.value)}</span>
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMove('prev')} disabled={currentStageIndex <= 0 || isTerminalStage}>
            <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMove('next')} disabled={currentStageIndex >= stageIds.length - 3}>
            <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
