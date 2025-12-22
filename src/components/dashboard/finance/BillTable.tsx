

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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoreHorizontal, ArrowUpDown, Search, Loader2, Receipt, TrendingUp, TrendingDown, Edit, Trash2, CheckCircle } from 'lucide-react';
import { listBills, deleteBill, updateBill } from '@/ai/flows/finance-management';
import type { BillProfile } from '@/ai/schemas';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { format, parseISO } from 'date-fns';

const auth = getAuth(app);

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const statusMap: Record<BillProfile['status'], { text: string; color: string }> = {
    pending: { text: 'Pendente', color: 'bg-yellow-500/20 text-yellow-300' },
    paid: { text: 'Paga', color: 'bg-green-500/20 text-green-300' },
    overdue: { text: 'Vencida', color: 'bg-red-500/20 text-red-300' },
};

interface BillTableProps {
    onEdit: (bill: BillProfile) => void;
    onRefresh: () => void;
    refreshKey: number;
}

export function BillTable({ onEdit, onRefresh, refreshKey }: BillTableProps) {
  const [data, setData] = React.useState<BillProfile[]>([]);
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

  const handleDelete = async (billId: string) => {
    if (!currentUser) return;
    try {
        await deleteBill({ billId, actor: currentUser.uid });
        onRefresh();
    } catch(err) {
        console.error("Failed to delete bill:", err);
    }
  };

  const handleMarkAsPaid = async (bill: BillProfile) => {
    if (!currentUser) return;
    try {
        // Here we just update the status, the backend will create the transaction
        await updateBill({ ...bill, dueDate: bill.dueDate, status: 'paid', actor: currentUser.uid });
        onRefresh(); // Refresh the list, the paid bill will disappear
    } catch (err: any) {
        console.error("Failed to mark as paid:", err);
        setError(err.message || "Não foi possível marcar como pago.");
    }
  }

  const columns: ColumnDef<BillProfile>[] = [
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
          const color = type === 'receivable' ? 'text-green-400' : 'text-red-400';
          const Icon = type === 'receivable' ? TrendingUp : TrendingDown;
          return <span className={`font-semibold flex items-center ${color}`}><Icon className="w-4 h-4 mr-2" />{formatted}</span>;
      },
    },
     {
      accessorKey: 'entityName',
      header: 'Cliente/Fornecedor',
      cell: ({ row }) => row.getValue('entityName') || '-',
    },
    {
      accessorKey: 'dueDate',
      header: 'Vencimento',
      cell: ({ row }) => format(parseISO(row.getValue('dueDate')), "dd/MM/yyyy"),
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
                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0 rounded-xl"><span className="sr-only">Abrir menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        {(bill.status === 'pending' || bill.status === 'overdue') && (
                             <DropdownMenuItem onClick={() => handleMarkAsPaid(bill)} className="rounded-xl cursor-pointer text-green-400 focus:text-green-300">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Marcar como paga
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onEdit(bill)} className="rounded-xl cursor-pointer"><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialogTrigger asChild><DropdownMenuItem className="text-red-500 focus:text-red-400 focus:bg-destructive/20 rounded-xl cursor-pointer"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem></AlertDialogTrigger>
                    </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>Esta ação não pode ser desfeita. Isso excluirá permanentemente a pendência: <span className='font-bold'>{bill.description}</span>.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(bill.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sim, excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
          </AlertDialog>
        );
      },
    },
  ];

  React.useEffect(() => {
    async function fetchData() {
      if (!currentUser) return;
      setIsLoading(true);
      setError(null);
      try {
        const allBills = await listBills({ actor: currentUser.uid });
        // Only show pending or overdue bills
        const pendingBills = allBills.filter(bill => bill.status === 'pending' || bill.status === 'overdue');
        setData(pendingBills);
      } catch (err: any) {
        console.error('Failed to fetch bills:', err);
        setError(err.message || 'Não foi possível carregar as contas.');
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
    state: { sorting, columnFilters },
  });

  if (isLoading) {
    return <div className="flex flex-col items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 text-primary animate-spin" /><p className="mt-4 text-muted-foreground">Carregando pendências...</p></div>;
  }
  if (error) {
    return <div className="text-red-500 text-center min-h-[400px]">{error}</div>;
  }
  if (data.length === 0) {
    return <div className="flex flex-col items-center justify-center text-center min-h-[400px]"><Receipt className="w-16 h-16 text-muted-foreground/30 mb-4" /><h3 className="text-xl font-bold text-foreground">Nenhuma pendência encontrada</h3><p className="text-muted-foreground mt-2">Você está em dia! Contas pagas aparecem na tela de transações.</p></div>;
  }

  return (
    <div>
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <h2 className="text-xl font-bold text-foreground">Suas pendências</h2>
            <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input placeholder="Buscar por descrição..." value={(table.getColumn('description')?.getFilterValue() as string) ?? ''} onChange={(event) => table.getColumn('description')?.setFilterValue(event.target.value)} className="w-full sm:w-[300px] pl-10 pr-4 py-2 bg-secondary rounded-xl border-border focus:ring-2 focus:ring-primary transition-all duration-300" />
            </div>
      </div>
      <div className="rounded-2xl border border-border overflow-x-auto">
        <Table>
          <TableHeader><TableRow key={table.getHeaderGroups()[0].id} className="border-border hover:bg-transparent">{table.getHeaderGroups()[0].headers.map((header) => <TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}</TableRow></TableHeader>
          <TableBody>{table.getRowModel().rows?.length ? table.getRowModel().rows.map((row) => (<TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className="border-border">{row.getVisibleCells().map((cell) => (<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}</TableRow>)) : (<TableRow><TableCell colSpan={columns.length} className="h-24 text-center">Nenhum resultado encontrado.</TableCell></TableRow>)}</TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Anterior</Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Próximo</Button>
      </div>
    </div>
  );
}


  
