'use client';

import { SaleLeadProfile } from '@/ai/schemas';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, User, Calendar, Flag } from 'lucide-react';

interface KanbanCardProps {
  lead: SaleLeadProfile;
}

const priorityMap = {
    low: { text: 'Baixa', color: 'bg-green-100 text-green-800 border-green-200' },
    medium: { text: 'Média', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    high: { text: 'Alta', color: 'bg-orange-100 text-orange-800 border-orange-200' },
};

export function KanbanCard({ lead }: KanbanCardProps) {
  const formattedValue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(lead.value);
  
  const priorityInfo = priorityMap[lead.priority] || priorityMap.medium;

  return (
    <div className="bg-white rounded-xl p-4 shadow-neumorphism hover:shadow-neumorphism-hover transition-shadow duration-300 border border-gray-100">
      <h3 className="font-bold text-black text-base mb-3 break-words">{lead.title}</h3>
      
      <div className="space-y-2 text-sm text-gray-700">
        <div className="flex items-center">
            <User className="w-4 h-4 mr-2 text-gray-400" />
            <span>{lead.customerName || 'Cliente não informado'}</span>
        </div>
        <div className="flex items-center font-semibold text-green-600">
            <DollarSign className="w-4 h-4 mr-2 text-green-400" />
            <span>{formattedValue}</span>
        </div>
        <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            <span className="text-xs">
                {format(lead.expectedCloseDate, "dd 'de' MMM, yyyy", { locale: ptBR })}
            </span>
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
        <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full border ${priorityInfo.color}`}>
          <Flag className="w-3 h-3 mr-1.5" />
          {priorityInfo.text}
        </div>
        <Button variant="ghost" size="sm" className="text-primary h-auto p-1 text-xs">
            Detalhes
        </Button>
      </div>
    </div>
  );
}
