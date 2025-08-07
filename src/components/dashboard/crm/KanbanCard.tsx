'use client';

import { CustomerProfile } from '@/ai/schemas';
import { Button } from '@/components/ui/button';
import { Mail, Phone, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
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
  onDelete: (customerId: string) => void;
}

export function KanbanCard({ customer, stageIds, onMove, onDelete }: KanbanCardProps) {
  
  const currentStageIndex = stageIds.findIndex(id => id === customer.status);

  const handleMove = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'next' ? currentStageIndex + 1 : currentStageIndex - 1;
    if (newIndex >= 0 && newIndex < stageIds.length) {
        onMove(customer.id, stageIds[newIndex] as CustomerProfile['status']);
    }
  };

  const handleDelete = () => {
    onDelete(customer.id);
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-neumorphism hover:shadow-neumorphism-hover transition-shadow duration-300 border border-gray-100">
      <h3 className="font-bold text-black text-base mb-3 break-words">{customer.name}</h3>
      
      <div className="space-y-2 text-sm text-gray-700">
        <div className="flex items-center">
            <Mail className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
            <span className="truncate">{customer.email}</span>
        </div>
         {customer.phone && (
            <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                <span className="truncate">{customer.phone}</span>
            </div>
        )}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMove('prev')} disabled={currentStageIndex <= 0}>
                <ChevronLeft className="w-4 h-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o cliente <span className='font-semibold'>{customer.name}</span> e removerá seus dados de nossos servidores.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>Excluir</AlertDialogAction>
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
