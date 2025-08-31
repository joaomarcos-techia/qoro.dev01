
'use client';

import { CustomerProfile } from '@/ai/schemas';
import { Button } from '@/components/ui/button';
import { User, Building, ChevronLeft, ChevronRight, Archive, Phone, FileText } from 'lucide-react';
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
  customer: CustomerProfile;
  stageIds: string[];
  onMove: (customerId: string, newStatus: CustomerProfile['status']) => void;
}

const formatCPF = (value?: string) => {
    if (!value) return null;
    return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

const formatPhone = (value?: string) => {
    if (!value) return null;
    if (value.length === 11) return value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    if (value.length === 10) return value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    return value;
};

export function CustomerKanbanCard({ customer, stageIds, onMove }: KanbanCardProps) {
  
  const currentStageIndex = stageIds.findIndex(id => id === customer.status);
  const isLostStage = customer.status === 'lost';
  const isWonStage = customer.status === 'won';

  const handleMove = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'next' ? currentStageIndex + 1 : currentStageIndex - 1;
    if (newIndex >= 0 && newIndex < stageIds.length) {
        onMove(customer.id, stageIds[newIndex] as CustomerProfile['status']);
    }
  };
  
  const handleArchive = () => {
    onMove(customer.id, 'archived');
  }

  return (
    <AlertDialog>
        <div className="bg-card rounded-xl p-4 transition-shadow duration-300 border border-border hover:border-primary/50">
        <h3 className="font-bold text-foreground text-base mb-3 break-words">{customer.name}</h3>
        
        <div className="space-y-2 text-sm text-muted-foreground min-h-[4rem]">
            {customer.company && (
                <div className="flex items-center">
                    <Building className="w-4 h-4 mr-2 text-muted-foreground/70 flex-shrink-0" />
                    <span className="truncate">{customer.company}</span>
                </div>
            )}
            {customer.cpf && (
                <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-muted-foreground/70 flex-shrink-0" />
                    <span className="truncate">{formatCPF(customer.cpf)}</span>
                </div>
            )}
            {customer.phone && (
                <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-muted-foreground/70 flex-shrink-0" />
                    <span className="truncate">{formatPhone(customer.phone)}</span>
                </div>
            )}
        </div>
        
        <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMove('prev')} disabled={currentStageIndex <= 0}>
                <ChevronLeft className="w-4 h-4" />
            </Button>
            
            {(isLostStage || isWonStage) ? (
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-400" title="Arquivar Cliente">
                        <Archive className="w-4 h-4" />
                    </Button>
                </AlertDialogTrigger>
            ) : (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMove('next')} disabled={currentStageIndex >= stageIds.length - 1}>
                    <ChevronRight className="w-4 h-4" />
                </Button>
            )}
        </div>
        </div>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Arquivar cliente?</AlertDialogTitle>
                <AlertDialogDescription>
                    O cliente "{customer.name}" será removido do funil, mas seus dados continuarão salvos na lista de clientes. Você tem certeza?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleArchive}>
                    Sim, arquivar
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
  );
}
