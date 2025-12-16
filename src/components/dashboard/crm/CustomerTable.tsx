
'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { MoreHorizontal, ArrowUpDown, Users, Search, Loader2, Trash2, Edit, Copy, Archive } from 'lucide-react';
import { listCustomers, deleteCustomer, updateCustomerStatus } from '@/ai/flows/crm-management';
import type { CustomerProfile } from '@/ai/schemas';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { CustomerForm } from './CustomerForm';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const auth = getAuth(app);

const formatCPF = (value: string) => {
    if (!value) return "-";
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length !== 11) return value; // Return original if not a valid CPF length
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

const formatPhone = (value: string) => {
    if (!value) return "-";
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    if (cleaned.length === 10) {
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return value; // Return original if not a valid phone length
};

const normalizeString = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

interface CustomerTableProps {
  onCountChange: (count: number) => void;
}

export function CustomerTable({ onCountChange }: CustomerTableProps) {
  const [data, setData] = React.useState<CustomerProfile[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentUser, setCurrentUser] = React.useState<FirebaseUser | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<CustomerProfile | null>(null);
  const [refreshCounter, setRefreshCounter] = React.useState(0);
  const [showArchived, setShowArchived] = React.useState(false);


  const statusMap: Record<CustomerProfile['status'], { text: string; color: string }> = {
    new: { text: 'Novo', color: 'bg-blue-500/20 text-blue-300' },
    initial_contact: { text: 'Contato inicial', color: 'bg-cyan-500/20 text-cyan-300' },
    qualification: { text: 'Qualificação', color: 'bg-purple-500/20 text-purple-300' },
    proposal: { text: 'Proposta', color: 'bg-indigo-500/20 text-indigo-300' },
    negotiation: { text: 'Negociação', color: 'bg-yellow-500/20 text-yellow-300' },
    won: { text: 'Ganho', color: 'bg-green-500/20 text-green-300' },
    lost: { text: 'Perdido', color: 'bg-red-500/20 text-red-300' },
    archived: { text: 'Arquivado', color: 'bg-gray-500/20 text-gray-300' },
  };

  const handleEdit = (customer: CustomerProfile) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };
  
  const handleDelete = async (customerId: string) => {
    if (!currentUser) return;
    try {
        await deleteCustomer({ customerId, actor: currentUser.uid });
        triggerRefresh();
    } catch(err: any) {
        setError(err.message || "Não foi possível excluir o cliente.");
    }
  };

  const handleArchive = async (customer: CustomerProfile) => {
    if (!currentUser) return;
    try {
        await updateCustomerStatus({ customerId: customer.id, status: 'archived', actor: currentUser.uid });
        triggerRefresh();
    } catch(err: any) {
        setError(err.message || "Não foi possível arquivar o cliente.");
    }
  }

  const triggerRefresh = () => {
    setRefreshCounter(prev => prev + 1);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  }

  const handleCustomerAction = () => {
    handleModalClose();
    triggerRefresh();
  }
  
  const columns: ColumnDef<CustomerProfile>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Nome
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
      cell: ({ row }) => <div className="font-medium text-foreground">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
     {
      accessorKey: 'cpf',
      header: 'CPF',
      cell: ({ row }) => formatCPF(row.getValue('cpf')),
    },
    {
      accessorKey: 'phone',
      header: 'Telefone',
      cell: ({ row }) => formatPhone(row.getValue('phone')),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
          const status = row.getValue('status') as keyof typeof statusMap;
          const { text, color } = statusMap[status] || { text: 'Desconhecido', color: 'bg-gray-500/20 text-gray-300' };
          return (
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${color} capitalize`}>
              {text}
            </span>
          );
        },
    },
    {
      accessorKey: 'createdAt',
      header: 'Criado em',
      cell: ({ row }) => {
          const createdAt = row.getValue('createdAt');
          if (!createdAt || typeof createdAt !== 'string') return '-';
          return new Date(createdAt).toLocaleDateString('pt-BR');
      }
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const customer = row.original;
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
                        <DropdownMenuItem onClick={() => handleEdit(customer)} className="rounded-xl">
                            <Edit className="mr-2 h-4 w-4" />
                            Editar cliente
                        </DropdownMenuItem>
                        {customer.status !== 'archived' && (
                            <DropdownMenuItem onClick={() => handleArchive(customer)} className="rounded-xl">
                                <Archive className="mr-2 h-4 w-4" />
                                Arquivar cliente
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(customer.cpf || '')} disabled={!customer.cpf} className="rounded-xl">
                            <Copy className="mr-2 h-4 w-4" />
                            Copiar CPF
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-red-500 focus:bg-destructive/20 focus:text-red-400 rounded-xl">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir cliente
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                    </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação excluirá permanentemente o cliente <span className='font-bold'>{customer.name}</span>. Registros financeiros e orçamentos associados a ele não serão excluídos, mas perderão a associação. Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(customer.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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

  const filteredData = React.useMemo(() => {
    let filtered = data;

    if (!showArchived) {
        filtered = filtered.filter(customer => customer.status !== 'archived');
    }

    if (globalFilter) {
        const searchTerm = normalizeString(globalFilter);
        filtered = filtered.filter(customer => {
            const normalizedName = normalizeString(customer.name || '');
            const normalizedEmail = (customer.email || '').toLowerCase();
            const normalizedCpf = (customer.cpf || '').replace(/\D/g, '');
            const cleanSearchTerm = searchTerm.replace(/\D/g, '');

            return (
                normalizedName.startsWith(searchTerm) ||
                normalizedEmail.startsWith(searchTerm) ||
                (cleanSearchTerm.length > 0 && normalizedCpf.startsWith(cleanSearchTerm))
            );
        });
    }

    return filtered;
  }, [data, showArchived, globalFilter]);

  React.useEffect(() => {
    async function fetchData() {
      if (!currentUser) return;

      setIsLoading(true);
      setError(null);
      try {
        const customers = await listCustomers({ actor: currentUser.uid });
        setData(customers);
        onCountChange(customers.length);
      } catch (err) {
        setError('Não foi possível carregar os clientes. Tente novamente mais tarde.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [currentUser, refreshCounter, onCountChange]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="mt-4 text-muted-foreground">Carregando clientes...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center min-h-[400px]">{error}</div>;
  }
  
  if (data.length === 0 && !isLoading) {
    return (
        <div className="flex flex-col items-center justify-center text-center min-h-[400px]">
            <Users className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold text-foreground">Nenhum cliente cadastrado</h3>
            <p className="text-muted-foreground mt-2">Comece adicionando seu primeiro cliente para vê-lo aqui.</p>
        </div>
    )
  }

  return (
    <>
    <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-[750px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-foreground">Editar cliente</DialogTitle>
              <DialogDescription>
                Altere as informações do cliente abaixo.
              </DialogDescription>
            </DialogHeader>
            <CustomerForm onCustomerAction={handleCustomerAction} customer={selectedCustomer} customerCount={data.length} />
          </DialogContent>
    </Dialog>

    <div>
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <div className='flex items-center gap-4'>
                <h2 className="text-xl font-bold text-foreground whitespace-nowrap">Sua lista de clientes</h2>
                 <div className="flex items-center space-x-2">
                    <Checkbox id="show-archived" checked={showArchived} onCheckedChange={(checked) => setShowArchived(!!checked)} />
                    <Label htmlFor="show-archived" className="text-sm font-medium text-muted-foreground">Mostrar arquivados</Label>
                </div>
            </div>
            <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                placeholder="Buscar por nome, email ou CPF..."
                value={globalFilter}
                onChange={(event) =>
                    setGlobalFilter(event.target.value)
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
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="border-border"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
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
