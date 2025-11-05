
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
  } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoreHorizontal, ArrowUpDown, Search, Loader2, ArrowLeftRight, TrendingUp, TrendingDown, Edit, Trash2 } from 'lucide-react';
import { listTransactions, deleteTransaction } from '@/ai/flows/finance-management';
import type { TransactionProfile } from '@/ai/schemas';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { format, parseISO } from 'date-fns';
import { TransactionForm } from './TransactionForm';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
};

const statusMap: Record<NonNullable<TransactionProfile['status']>, { text: string; color: string }> = {
    pending: { text: 'Pendente', color: 'bg-yellow-500/20 text-yellow-300' },
    paid: { text: 'Pago', color: 'bg-green-500/20 text-green-300' },
    cancelled: { text: 'Cancelada', color: 'bg-gray-500/20 text-gray-300' },
};

interface TransactionTableProps {
    refreshKey: number;
    onAction: () => void;
}

export function TransactionTable({ refreshKey, onAction }: TransactionTableProps) {
  const [data, setData] = React.useState<TransactionProfile[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentUser, setCurrentUser] = React.useState<FirebaseUser | null>(null);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedTransaction, setSelectedTransaction] = React.useState<TransactionProfile | null>(null);
  
  const handleEdit = (transaction: TransactionProfile) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDelete = async (transactionId: string) => {
    if (!currentUser) return;
    try {
        await deleteTransaction({ transactionId, actor: currentUser.uid });
        onAction(); // Use the callback from props
    } catch(err: any) {
        console.error("Failed to delete transaction:", err);
        setError(err.message || 'Falha ao excluir a transação.');
    }
  };
  
  const handleModalAction = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
    onAction(); // Use the callback from props
  }

  const columns: ColumnDef<TransactionProfile>[] = [
    {
      accessorKey: 'description',
      header: ({ column }) => (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              Descrição <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
      ),
      cell: ({ row }) => <div className="font-medium text-foreground">{row.getValue('description')}</div>,
    },
    {
      accessorKey: 'amount',
      header: 'Valor',
      cell: ({ row }) => {
          const amount = parseFloat(row.getValue('amount'));
          const type = row.original.type;
          const formatted = formatCurrency(amount);
          const color = type === 'income' ? 'text-green-400' : 'text-red-400';
          const Icon = type === 'income' ? TrendingUp : TrendingDown;
          return (
              <span className={`font-semibold flex items-center ${color}`}>
                  <Icon className="w-4 h-4 mr-2" />
                  {formatted}
              </span>
          );
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
            <AlertDialog>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 rounded-xl">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                     <DropdownMenuItem onClick={() => handleEdit(transaction)} className="rounded-xl">
                        <Edit className="mr-2 h-4 w-4" />
                        Editar transação
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-red-500 focus:text-red-400 focus:bg-destructive/20 rounded-xl">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir transação
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                    </DropdownMenuContent>
                </DropdownMenu>
                 <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente a transação e ajustará o saldo da conta associada.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(transaction.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Sim, excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
          </AlertDialog>
        );
      },
    },
  ];

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
      } catch (err: any) {
        console.error('Failed to fetch transactions:', err);
        setError(err.message || 'Não foi possível carregar as transações.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [currentUser, refreshKey]);

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
        <p className="mt-4 text-muted-foreground">Carregando transações...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center min-h-[400px]">{error}</div>;
  }
  
  if (data.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center text-center min-h-[400px]">
            <ArrowLeftRight className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold text-foreground">Nenhuma transação registrada</h3>
            <p className="text-muted-foreground mt-2">Comece adicionando sua primeira receita ou despesa.</p>
        </div>
    )
  }

  return (
    <>
     <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-foreground">Editar transação</DialogTitle>
                <DialogDescription>
                    Altere as informações da movimentação financeira.
                </DialogDescription>
            </DialogHeader>
            <TransactionForm onAction={handleModalAction} transaction={selectedTransaction} />
        </DialogContent>
      </Dialog>
    <div>
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <h2 className="text-xl font-bold text-foreground">Suas transações</h2>
            <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                placeholder="Buscar por descrição..."
                value={(table.getColumn('description')?.getFilterValue() as string) ?? ''}
                onChange={(event) =>
                    table.getColumn('description')?.setFilterValue(event.target.value)
                }
                className="w-full sm:w-[300px] pl-10 pr-4 py-2 bg-secondary rounded-xl border-border focus:ring-2 focus:ring-primary transition-all duration-300"
                />
            </div>
      </div>
      <div className="rounded-2xl border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-border hover:bg-transparent">
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
    </>
  );
}
