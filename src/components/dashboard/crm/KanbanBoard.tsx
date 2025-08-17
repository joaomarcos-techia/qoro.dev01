
'use client';

import { CustomerProfile } from '@/ai/schemas';
import { KanbanCard } from './KanbanCard';
import { LayoutGrid } from 'lucide-react';

export type KanbanColumn = {
  id: string;
  title: string;
  customers: CustomerProfile[];
};

interface KanbanBoardProps {
  columns: KanbanColumn[];
  onMoveCustomer: (customerId: string, newStatus: CustomerProfile['status']) => void;
  onArchiveCustomer: (customerId: string) => void;
}

export function KanbanBoard({ columns, onMoveCustomer, onArchiveCustomer }: KanbanBoardProps) {

  const totalCustomers = columns.reduce((acc, col) => acc + col.customers.length, 0);
  const stageIds = columns.map(c => c.id);

  if (totalCustomers === 0) {
    return (
        <div className="flex flex-col items-center justify-center text-center h-full bg-card/50 rounded-2xl p-8 border border-border">
            <LayoutGrid className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold text-foreground">Nenhum cliente no funil</h3>
            <p className="text-muted-foreground mt-2">Adicione novos clientes para gerenciá-los aqui.</p>
        </div>
    )
  }

  return (
    <div className="flex gap-4 overflow-x-auto p-1 pb-4 h-full">
      {columns.map((column) => (
        <div key={column.id} className="w-72 lg:w-80 flex-shrink-0 flex flex-col">
          <div className="bg-secondary/30 rounded-xl p-3 flex flex-col flex-grow">
            <h2 className="text-base font-bold text-foreground mb-4 px-2 flex justify-between items-center flex-shrink-0">
              <span>{column.title}</span>
              <span className="text-sm font-medium text-muted-foreground bg-secondary rounded-full px-2.5 py-0.5">
                {column.customers.length}
              </span>
            </h2>
            <div className="space-y-3 min-h-[100px] overflow-y-auto flex-grow pr-1">
              {column.customers.map((customer) => (
                <KanbanCard 
                  key={customer.id} 
                  customer={customer} 
                  stageIds={stageIds}
                  onMove={onMoveCustomer}
                  onArchive={onArchiveCustomer}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
