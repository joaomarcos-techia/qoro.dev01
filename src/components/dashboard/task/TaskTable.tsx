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
import { MoreHorizontal, ArrowUpDown, Search, Loader2, CheckSquare } from 'lucide-react';
import { listTasks } from '@/ai/flows/task-management';
import type { TaskProfile } from '@/ai/schemas';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusMap = {
    todo: { text: 'A Fazer', color: 'bg-gray-100 text-gray-800' },
    in_progress: { text: 'Em Progresso', color: 'bg-blue-100 text-blue-800' },
    review: { text: 'Revisão', color: 'bg-yellow-100 text-yellow-800' },
    done: { text: 'Concluída', color: 'bg-green-100 text-green-800' },
};

const priorityMap = {
    low: { text: 'Baixa', color: 'text-gray-500' },
    medium: { text: 'Média', color: 'text-yellow-600' },
    high: { text: 'Alta', color: 'text-orange-600' },
    urgent: { text: 'Urgente', color: 'text-red-600' },
};

export const columns: ColumnDef<TaskProfile>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Título
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    cell: ({ row }) => <div className="font-medium text-black">{row.getValue('title')}</div>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
        const status = row.getValue('status') as keyof typeof statusMap;
        const { text, color } = statusMap[status] || statusMap.todo;
        return (
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${color}`}>
            {text}
          </span>
        );
      },
  },
  {
    accessorKey: 'priority',
    header: 'Prioridade',
    cell: ({ row }) => {
        const priority = row.getValue('priority') as keyof typeof priorityMap;
        const { text, color } = priorityMap[priority] || priorityMap.medium;
        return <span className={`font-medium ${color}`}>{text}</span>;
      },
  },
  {
    accessorKey: 'dueDate',
    header: 'Vencimento',
    cell: ({ row }) => {
        const dueDate = row.getValue('dueDate') as string | null;
        if (!dueDate) return '-';
        try {
            const date = parseISO(dueDate);
            return format(date, "dd 'de' MMM 'de' yyyy", { locale: ptBR });
        } catch (error) {
            console.error('Invalid date format for dueDate:', dueDate);
            return 'Data inválida';
        }
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const task = row.original;
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
            <DropdownMenuItem>Editar Tarefa</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              Excluir Tarefa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function TaskTable() {
  const [data, setData] = React.useState<TaskProfile[]>([]);
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
        const tasks = await listTasks({ actor: currentUser.uid });
        setData(tasks);
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
        setError('Não foi possível carregar as tarefas. Tente novamente mais tarde.');
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
        <p className="mt-4 text-gray-600">Carregando tarefas...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center min-h-[400px]">{error}</div>;
  }
  
  if (data.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center text-center min-h-[400px]">
            <CheckSquare className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-black">Nenhuma tarefa criada</h3>
            <p className="text-gray-500 mt-2">Comece adicionando sua primeira tarefa para vê-la aqui.</p>
        </div>
    )
  }

  return (
    <div>
       <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-black">Suas Tarefas</h2>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                placeholder="Buscar por título..."
                value={(table.getColumn('title')?.getFilterValue() as string) ?? ''}
                onChange={(event) =>
                    table.getColumn('title')?.setFilterValue(event.target.value)
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
  );
}
