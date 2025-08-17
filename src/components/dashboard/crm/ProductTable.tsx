
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoreHorizontal, ArrowUpDown, Search, Loader2, ShoppingCart, Edit, Trash2, Copy } from 'lucide-react';
import { listProducts, deleteProduct } from '@/ai/flows/crm-management';
import type { ProductProfile } from '@/ai/schemas';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

interface ProductTableProps {
    onEdit: (product: ProductProfile) => void;
    onRefresh: () => void;
}

export function ProductTable({ onEdit, onRefresh }: ProductTableProps) {
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

  const handleDelete = async (productId: string) => {
    if (!currentUser) return;
    try {
        await deleteProduct({ productId, actor: currentUser.uid });
        onRefresh();
    } catch(err: any) {
        console.error("Failed to delete product:", err);
        setError(err.message || "Não foi possível excluir o produto.");
    }
  };

  const columns: ColumnDef<ProductProfile>[] = [
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
      cell: ({ row }) => formatCurrency(row.getValue('price')),
    },
    {
      accessorKey: 'cost',
      header: 'Custo',
      cell: ({ row }) => formatCurrency(row.getValue('cost')),
    },
     {
      accessorKey: 'sku',
      header: 'SKU',
      cell: ({ row }) => row.getValue('sku') || '-',
    },
    {
      accessorKey: 'createdAt',
      header: 'Criado em',
      cell: ({ row }) => new Date(row.getValue('createdAt')).toLocaleDateString('pt-BR'),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const product = row.original;
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
                <DropdownMenuItem onClick={() => onEdit(product)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Produto
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(product.sku || '')}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar Código
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="text-red-500 focus:bg-destructive/20 focus:text-red-400">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir Produto
                    </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o produto <span className='font-bold'>{product.name}</span>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(product.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
        const products = await listProducts({ actor: currentUser.uid });
        setData(products);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('Não foi possível carregar os produtos.');
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
        <p className="mt-4 text-muted-foreground">Carregando produtos...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center min-h-[400px]">{error}</div>;
  }
  
  if (data.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center text-center min-h-[400px]">
            <ShoppingCart className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold text-foreground">Nenhum produto cadastrado</h3>
            <p className="text-muted-foreground mt-2">Comece adicionando seu primeiro produto para vê-lo aqui.</p>
        </div>
    )
  }

  return (
    <div>
       <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Sua Lista de Produtos</h2>
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
