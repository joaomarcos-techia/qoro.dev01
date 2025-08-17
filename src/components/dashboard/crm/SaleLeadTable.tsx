'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoreHorizontal, ArrowUpDown, Search, Loader2, Target } from 'lucide-react';
import { listSaleLeads } from '@/ai/flows/crm-management';
import type { SaleLeadProfile } from '@/ai/schemas';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { format, parseISO } from 'date-fns';

const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const stageMap: Record<SaleLeadProfile['stage'], { text: string; color: string }> = {
    new: { text: 'Novo', color: 'bg-blue-500/20 text-blue-300' },
    initial_contact: { text: 'Contato Inicial', color: 'bg-cyan-500/20 text-cyan-300' },
    qualified: { text: 'Qualificado', color: 'bg-purple-500/20 text-purple-300' },
    proposal: { text: 'Proposta', color: 'bg-indigo-500/20 text-indigo-300' },
    negotiation: { text: 'Negociação', color: 'bg-yellow-500/20 text-yellow-300' },
    won: { text: 'Ganho', color: 'bg-green-500/20 text-green-300' },
    lost: { text: 'Perdido', color: 'bg-red-500/20 text-red-300' },
};

export const columns: ColumnDef<SaleLeadProfile>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Título <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    ),
    cell: ({ row }) => <div className="font-medium text-foreground">{row.getValue('title')}</div>,
  },
  {
    accessorKey: 'customerName',
    header: 'Cliente',
  },
  {
    accessorKey: 'value',
    header: 'Valor',
    cell: ({ row }) => formatCurrency(row.getValue('value')),
  },
  {
    accessorKey: 'stage',
    header: 'Estágio',
    cell: ({ row }) => {
        const stage = row.getValue('stage') as keyof typeof stageMap;
        const { text, color } = stageMap[stage] || { text: 'Desconhecido', color: 'bg-gray-500/20 text-gray-300' };
        return (
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${color}`}>
            {text}
          </span>
        );
      },
  },
  {
    accessorKey: 'expectedCloseDate',
    header: 'Fechamento Previsto',
    cell: ({ row }) => {
      const dateStr = row.getValue('expectedCloseDate') as string;
      return format(parseISO(dateStr), 'dd/MM/yyyy');
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const lead = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem>Editar Oportunidade</DropdownMenuItem>
            <DropdownMenuItem className="text-red-500 focus:bg-destructive/20 focus:text-red-400">Excluir Oportunidade</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function SaleLeadTable() {
  const [data, setData] = React.useState<SaleLeadProfile[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentUser, setCurrentUser] = React.useState<FirebaseUser | null>(null);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    async function fetchData() {
      if (!currentUser) return;
      setIsLoading(true);
      setError(null);
      try {
        const leads = await listSaleLeads({ actor: currentUser.uid });
        setData(leads);
      } catch (err: any) {
        console.error('Failed to fetch sale leads:', err);
        setError(err.message || 'Não foi possível carregar as oportunidades.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [currentUser]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="mt-4 text-muted-foreground">Carregando oportunidades...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center min-h-[400px]">{error}</div>;
  }
  
  if (data.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center text-center min-h-[400px]">
            <Target className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold text-foreground">Nenhuma oportunidade de venda criada</h3>
            <p className="text-muted-foreground mt-2">Comece criando sua primeira oportunidade para gerenciá-la aqui.</p>
        </div>
    )
  }

  return (
    <div>
       <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Pipeline de Vendas</h2>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                placeholder="Buscar por título ou cliente..."
                value={(table.getColumn('title')?.getFilterValue() as string) ?? ''}
                onChange={(event) =>
                    table.getColumn('title')?.setFilterValue(event.target.value)
                }
                className="w-full pl-10 pr-4 py-2 bg-secondary rounded-xl border-border focus:ring-2 focus:ring-primary transition-all duration-300"
                />
            </div>
      </div>
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-border">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className="border-border">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Próximo
        </Button>
      </div>
    </div>
  );
}
