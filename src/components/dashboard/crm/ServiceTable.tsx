
'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoreHorizontal, ArrowUpDown, Search, Loader2, Wrench, Edit, Trash2 } from 'lucide-react';
import { listServices, deleteService } from '@/ai/flows/crm-management';
import type { ServiceProfile } from '@/ai/schemas';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { app } from '@/lib/firebase';

const auth = getAuth(app);

const formatCurrency = (value: number | null | undefined, pricingModel: 'fixed' | 'per_hour' | undefined) => {
    if (value === null || value === undefined) return '-';
    const formattedValue = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
    return pricingModel === 'per_hour' ? `${formattedValue}/h` : formattedValue;
};


interface ServiceTableProps {
    onEdit: (service: ServiceProfile) => void;
    onRefresh: () => void;
}

export function ServiceTable({ onEdit, onRefresh }: ServiceTableProps) {
  const [data, setData] = React.useState<ServiceProfile[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentUser, setCurrentUser] = React.useState<FirebaseUser | null>(null);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (serviceId: string) => {
    if (!currentUser) return;
    try {
        await deleteService({ serviceId, actor: currentUser.uid });
        onRefresh();
    } catch(err: any) {
        setError(err.message || "Não foi possível excluir o serviço.");
    }
  };

  const columns: ColumnDef<ServiceProfile>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              Nome <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
      ),
      cell: ({ row }) => <div className="font-medium text-foreground">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'price',
      header: 'Preço',
      cell: ({ row }) => formatCurrency(row.getValue('price'), row.original.pricingModel),
    },
    {
        accessorKey: 'pricingModel',
        header: 'Modelo de preço',
        cell: ({ row }) => row.original.pricingModel === 'per_hour' ? 'Por hora' : 'Fixo',
    },
    {
      accessorKey: 'category',
      header: 'Categoria',
      cell: ({ row }) => row.getValue('category') || '-',
    },
    {
      accessorKey: 'createdAt',
      header: 'Criado em',
      cell: ({ row }) => new Date(row.getValue('createdAt')).toLocaleDateString('pt-BR'),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const service = row.original;
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
                <DropdownMenuItem onClick={() => onEdit(service)} className="rounded-xl">
                    <Edit className="mr-2 h-4 w-4" />
                    Editar serviço
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="text-red-500 focus:bg-destructive/20 focus:text-red-400 rounded-xl">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir serviço
                    </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o serviço <span className='font-bold'>{service.name}</span>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(service.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
    async function fetchData() {
      if (!currentUser) return;
      setIsLoading(true);
      setError(null);
      try {
        const services = await listServices({ actor: currentUser.uid });
        setData(services);
      } catch (err) {
        setError('Não foi possível carregar os serviços.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [currentUser, onRefresh]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
        const searchTerm = filterValue.toLowerCase();
        const name = row.original.name?.toLowerCase() || '';
        const category = row.original.category?.toLowerCase() || '';
        return name.includes(searchTerm) || category.includes(searchTerm);
    },
    state: {
      sorting,
      globalFilter,
    },
  });
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="mt-4 text-muted-foreground">Carregando serviços...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center min-h-[400px]">{error}</div>;
  }
  
  if (data.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center text-center min-h-[400px]">
            <Wrench className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold text-foreground">Nenhum serviço cadastrado</h3>
            <p className="text-muted-foreground mt-2">Comece adicionando um serviço para vê-lo aqui.</p>
        </div>
    )
  }

  return (
    <div>
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <h2 className="text-xl font-bold text-foreground">Seu catálogo de serviços</h2>
            <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nome ou categoria..."
                    value={globalFilter}
                    onChange={(event) => setGlobalFilter(event.target.value)}
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

    