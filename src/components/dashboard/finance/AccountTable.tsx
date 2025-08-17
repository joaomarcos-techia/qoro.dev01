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
import { MoreHorizontal, ArrowUpDown, Search, Loader2, Landmark } from 'lucide-react';
import { listAccounts } from '@/ai/flows/finance-management';
import type { AccountProfile } from '@/ai/schemas';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
};

const accountTypeMap = {
    checking: 'Conta Corrente',
    savings: 'Poupança',
    credit_card: 'Cartão de Crédito',
    cash: 'Caixa'
};

export const columns: ColumnDef<AccountProfile>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Nome da Conta <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    ),
    cell: ({ row }) => <div className="font-medium text-foreground">{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'type',
    header: 'Tipo',
    cell: ({ row }) => {
        const type = row.getValue('type') as keyof typeof accountTypeMap;
        return accountTypeMap[type] || 'Desconhecido';
    }
  },
  {
    accessorKey: 'balance',
    header: 'Saldo',
    cell: ({ row }) => {
      const balance = parseFloat(row.getValue('balance'));
      const color = balance >= 0 ? 'text-green-400' : 'text-red-400';
      return <span className={color}>{formatCurrency(balance)}</span>
    }
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => {
        const isActive = row.getValue('isActive');
        return (
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isActive ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
            {isActive ? 'Ativa' : 'Inativa'}
          </span>
        );
      },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const account = row.original;
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
            <DropdownMenuItem>Ver Extrato</DropdownMenuItem>
            <DropdownMenuItem>Editar Conta</DropdownMenuItem>
            <DropdownMenuItem className="text-red-500 focus:text-red-400 focus:bg-destructive/20">Desativar Conta</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function AccountTable() {
  const [data, setData] = React.useState<AccountProfile[]>([]);
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
        const accounts = await listAccounts({ actor: currentUser.uid });
        setData(accounts);
      } catch (err) {
        console.error('Failed to fetch accounts:', err);
        setError('Não foi possível carregar as contas financeiras.');
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
        <p className="mt-4 text-muted-foreground">Carregando contas...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center min-h-[400px]">{error}</div>;
  }
  
  if (data.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center text-center min-h-[400px]">
            <Landmark className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold text-foreground">Nenhuma conta financeira cadastrada</h3>
            <p className="text-muted-foreground mt-2">Comece adicionando sua primeira conta para registrar transações.</p>
        </div>
    )
  }

  return (
    <div>
       <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Suas Contas</h2>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                placeholder="Buscar por nome..."
                value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
                onChange={(event) =>
                    table.getColumn('name')?.setFilterValue(event.target.value)
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
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
