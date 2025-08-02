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
import { MoreHorizontal, ArrowUpDown, Search, Loader2, ArrowLeftRight } from 'lucide-react';
import { listTransactions } from '@/ai/flows/finance-management';
import type { TransactionProfile } from '@/ai/schemas';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { format, parseISO } from 'date-fns';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
};

const statusMap: Record<TransactionProfile['status'], { text: string; color: string }> = {
    pending: { text: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
    paid: { text: 'Pago', color: 'bg-green-100 text-green-800' },
    cancelled: { text: 'Cancelada', color: 'bg-gray-100 text-gray-800' },
};

export const columns: ColumnDef<TransactionProfile>[] = [
  {
    accessorKey: 'description',
    header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Descrição <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    ),
    cell: ({ row }) => <div className="font-medium text-black">{row.getValue('description')}</div>,
  },
  {
    accessorKey: 'amount',
    header: 'Valor',
    cell: ({ row }) => {
        const amount = parseFloat(row.getValue('amount'));
        const type = row.original.type;
        const formatted = formatCurrency(amount);
        const color = type === 'income' ? 'text-green-600' : 'text-red-600';
        return <span className={`font-semibold ${color}`}>{type === 'income' ? `+ ${formatted}` : `- ${formatted}`}</span>;
    },
  },
   {
    accessorKey: 'customerName',
    header: 'Cliente',
    cell: ({ row }) => row.getValue('customerName') || '-',
  },
  {
    accessorKey: 'category',
    header: 'Categoria',
  },
  {
    accessorKey: 'accountName',
    header: 'Conta',
  },
  {
    accessorKey: 'date',
    header: 'Data',
    cell: ({ row }) => {
        const date = row.getValue('date') as string;
        return format(parseISO(date), "dd/MM/yyyy");
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
        const status = row.getValue('status') as keyof typeof statusMap;
        const { text, color } = statusMap[status] || statusMap.pending;
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${color}`}>{text}</span>;
      },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const transaction = row.original;
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
            <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
            <DropdownMenuItem>Editar Transação</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Cancelar Transação</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function TransactionTable() {
  const [data, setData] = React.useState<TransactionProfile[]>([]);
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
        const transactions = await listTransactions({ actor: currentUser.uid });
        setData(transactions);
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
        setError('Não foi possível carregar as transações.');
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
        <p className="mt-4 text-gray-600">Carregando transações...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center min-h-[400px]">{error}</div>;
  }
  
  if (data.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center text-center min-h-[400px]">
            <ArrowLeftRight className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-black">Nenhuma transação registrada</h3>
            <p className="text-gray-500 mt-2">Comece adicionando sua primeira receita ou despesa.</p>
        </div>
    )
  }

  return (
    <div>
       <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-black">Suas Transações</h2>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                placeholder="Buscar por descrição..."
                value={(table.getColumn('description')?.getFilterValue() as string) ?? ''}
                onChange={(event) =>
                    table.getColumn('description')?.setFilterValue(event.target.value)
                }
                className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-xl shadow-neumorphism-inset focus:ring-2 focus:ring-primary transition-all duration-300"
                />
            </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
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
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
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
