
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
import { MoreHorizontal, ArrowUpDown, Search, Loader2, Wrench } from 'lucide-react';
import { listProducts } from '@/ai/flows/crm-management';
import type { ProductProfile } from '@/ai/schemas';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

const formatCurrency = (value: number | null | undefined, pricingModel: 'fixed' | 'per_hour' | undefined) => {
    if (value === null || value === undefined) return '-';
    const formattedValue = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
    return pricingModel === 'per_hour' ? `${formattedValue}/h` : formattedValue;
};

export const columns: ColumnDef<ProductProfile>[] = [
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
    accessorKey: 'category',
    header: 'Categoria',
    cell: ({ row }) => row.getValue('category') || '-',
  },
  {
    accessorKey: 'price',
    header: 'Preço',
    cell: ({ row }) => formatCurrency(row.getValue('price'), row.original.pricingModel),
  },
   {
    accessorKey: 'pricingModel',
    header: 'Modelo',
    cell: ({ row }) => {
        const model = row.getValue('pricingModel');
        if (model === 'per_hour') return 'Por Hora';
        return 'Fixo';
    },
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(service.id)}>
              Copiar ID do Serviço
            </DropdownMenuItem>
            <DropdownMenuItem>Editar Serviço</DropdownMenuItem>
            <DropdownMenuItem className="text-red-500 focus:bg-destructive/20 focus:text-red-400">Excluir Serviço</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function ServiceTable() {
  const [data, setData] = React.useState<ProductProfile[]>([]);
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
        // We fetch from the 'products' collection, then filter by category client-side.
        // This is a simplification. In a larger app, you might have a dedicated 'services' collection
        // or a 'type' field on the product itself to filter in the backend query.
        const allItems = await listProducts({ actor: currentUser.uid });
        const services = allItems.filter(item => item.category?.toLowerCase().includes('serviço') || item.cost === undefined || item.cost === null);
        setData(services);
      } catch (err) {
        console.error('Failed to fetch services:', err);
        setError('Não foi possível carregar os serviços.');
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
            <p className="text-muted-foreground mt-2">Comece adicionando seu primeiro serviço para vê-lo aqui.</p>
        </div>
    )
  }

  return (
    <div>
       <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Sua Lista de Serviços</h2>
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
