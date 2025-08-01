'use client';

import { SaleLeadProfile } from '@/ai/schemas';
import { KanbanCard } from './KanbanCard';
import { LayoutGrid } from 'lucide-react';

export type KanbanColumn = {
  id: string;
  title: string;
  leads: SaleLeadProfile[];
};

interface KanbanBoardProps {
  columns: KanbanColumn[];
}

export function KanbanBoard({ columns }: KanbanBoardProps) {

  const totalLeads = columns.reduce((acc, col) => acc + col.leads.length, 0);

  if (totalLeads === 0) {
    return (
        <div className="flex flex-col items-center justify-center text-center min-h-[400px] bg-gray-50/50 rounded-2xl">
            <LayoutGrid className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-black">Nenhuma oportunidade no funil</h3>
            <p className="text-gray-500 mt-2">Comece criando um cliente e uma oportunidade de venda para vê-la aqui.</p>
        </div>
    )
  }

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {columns.map((column) => (
        <div key={column.id} className="w-80 flex-shrink-0">
          <div className="bg-gray-100 rounded-xl p-3 shadow-neumorphism-inset">
            <h2 className="text-base font-bold text-black mb-4 px-2 flex justify-between items-center">
              <span>{column.title}</span>
              <span className="text-sm font-medium text-gray-500 bg-gray-200 rounded-full px-2.5 py-0.5">
                {column.leads.length}
              </span>
            </h2>
            <div className="space-y-4 min-h-[100px]">
              {column.leads.map((lead) => (
                <KanbanCard key={lead.id} lead={lead} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
