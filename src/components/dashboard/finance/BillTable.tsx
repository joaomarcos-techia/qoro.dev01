
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
  } from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoreHorizontal, ArrowUpDown, Search, Loader2, Receipt, TrendingUp, TrendingDown, Edit, Trash2 } from 'lucide-react';
import { listBills, deleteBill } from '@/ai/flows/bill-management';
import type { BillProfile } from '@/ai/schemas';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { format, parseISO } from 'date-fns';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
};

const statusMap: Record<BillProfile['status'], { text: string; color: string }> = {
    pending: { text: 'Pendente', color: 'bg-yellow-500/20 text-yellow-300' },
    paid: { text: 'Paga', color: 'bg-green-500/20 text-green-300' },
    overdue: { text: 'Atrasada', color: 'bg-orange-500/20 text-orange-300' },
    cancelled: { text: 'Cancelada', color: 'bg-gray-500/20 text-gray-300' },
};


export function BillTable({ onEdit }: { onEdit: (bill: BillProfile) => void; }) {
  const [data, setData] = React.useState<BillProfile[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'dueDate', desc: false }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentUser, setCurrentUser] = React.useState<FirebaseUser | null>(null);
  
  const [refreshKey, setRefreshKey] = React.useState(0);
  const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  const handleDelete = async (billId: string) => {
    if (!currentUser) return;
    try {
        await deleteBill({ billId, actor: currentUser.uid });
        triggerRefresh();
    } catch(err) {
        console.error("Failed to delete bill:", err);
        setError("Não foi possível excluir a conta.");
    }
  };
  
  const columns: ColumnDef<BillProfile>[] = [
    {
      accessorKey: 'description',
      header: ({ column }) => (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              Descrição <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
      ),
      cell: ({ row }) => {
        const type = row.original.type;
        const Icon = type === 'receivable' ? TrendingUp : TrendingDown;
        const color = type === 'receivable' ? 'text-green-400' : 'text-red-400';
        return <div className="font-medium text-foreground flex items-center"><Icon className={`w-4 h-4 mr-3 flex-shrink-0 ${color}`} />{row.getValue('description')}</div>
      }
    },
    {
      accessorKey: 'amount',
      header: 'Valor',
      cell: ({ row }) => formatCurrency(parseFloat(row.getValue('amount'))),
    },
    {
      accessorKey: 'dueDate',
      header: 'Vencimento',
      cell: ({ row }) => format(row.getValue('dueDate') as Date, "dd/MM/yyyy"),
    },
    {
      accessorKey: 'contactName',
      header: 'Contato',
      cell: ({ row }) => row.getValue('contactName') || '-',
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
        const bill = row.original;
        return (
            <AlertDialog>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                     <DropdownMenuItem onClick={() => onEdit(bill)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar Conta
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-red-500 focus:text-red-400 focus:bg-destructive/20">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir Conta
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                    </DropdownMenuContent>
                </DropdownMenu>
                 <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente o lançamento.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(bill.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
        const result = await listBills({ actor: currentUser.uid });
        // Sort by due date client-side
        const sortedData = result.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        setData(sortedData);
      } catch (err) {
        console.error('Failed to fetch bills:', err);
        setError('Não foi possível carregar as contas a pagar/receber.');
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
            <Receipt className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold text-foreground">Nenhuma conta futura registrada</h3>
            <p className="text-muted-foreground mt-2 max-w-md">
                Clique em "Lançar Conta" para registrar seus próximos pagamentos e recebimentos e manter seu fluxo de caixa sob controle.
            </p>
        </div>
    )
  }

  return (
    <div>
       <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Lançamentos Futuros</h2>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                placeholder="Buscar por descrição..."
                value={(table.getColumn('description')?.getFilterValue() as string) ?? ''}
                onChange={(event) =>
                    table.getColumn('description')?.setFilterValue(event.target.value)
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
