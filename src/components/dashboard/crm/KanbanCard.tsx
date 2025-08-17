
'use client';

import { CustomerProfile } from '@/ai/schemas';
import { Button } from '@/components/ui/button';
import { Mail, Phone, ChevronLeft, ChevronRight, Archive } from 'lucide-react';
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
  onArchive: (customerId: string) => void;
}

export function KanbanCard({ customer, stageIds, onMove, onArchive }: KanbanCardProps) {
  
  const currentStageIndex = stageIds.findIndex(id => id === customer.status);

  const handleMove = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'next' ? currentStageIndex + 1 : currentStageIndex - 1;
    if (newIndex >= 0 && newIndex < stageIds.length) {
        onMove(customer.id, stageIds[newIndex] as CustomerProfile['status']);
    }
  };

  const handleArchive = () => {
    onArchive(customer.id);
  }

  return (
    <div className="bg-card rounded-xl p-4 transition-shadow duration-300 border border-border hover:border-primary/50">
      <h3 className="font-bold text-foreground text-base mb-3 break-words">{customer.name}</h3>
      
      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center">
            <Mail className="w-4 h-4 mr-2 text-muted-foreground/70 flex-shrink-0" />
            <span className="truncate">{customer.email}</span>
        </div>
         {customer.phone && (
            <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2 text-muted-foreground/70 flex-shrink-0" />
                <span className="truncate">{customer.phone}</span>
            </div>
        )}
      </div>
      
      <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
        <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMove('prev')} disabled={currentStageIndex <= 0}>
                <ChevronLeft className="w-4 h-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-secondary hover:text-foreground" title="Arquivar Cliente">
                    <Archive className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Arquivar este cliente?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação irá remover o cliente <span className='font-semibold'>{customer.name}</span> da visualização do funil. Ele não será excluído e poderá ser encontrado na lista geral de clientes.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleArchive} className='bg-primary text-primary-foreground hover:bg-primary/90'>Sim, Arquivar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMove('next')} disabled={currentStageIndex >= stageIds.length - 1}>
            <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
