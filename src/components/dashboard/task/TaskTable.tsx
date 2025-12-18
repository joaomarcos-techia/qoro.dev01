
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
import { MoreHorizontal, ArrowUpDown, Search, Loader2, List, Flag, Calendar, User, Edit, Trash2, CheckSquare, Eye } from 'lucide-react';
import type { TaskProfile, UserProfile } from '@/ai/schemas';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { deleteTask } from '@/ai/flows/task-management';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { Progress } from '@/components/ui/progress';

const auth = getAuth(app);

const priorityMap: Record<TaskProfile['priority'], { text: string; color: string }> = {
    low: { text: 'Baixa', color: 'bg-green-500/20 text-green-300' },
    medium: { text: 'Média', color: 'bg-yellow-500/20 text-yellow-300' },
    high: { text: 'Alta', color: 'bg-orange-500/20 text-orange-300' },
    urgent: { text: 'Urgente', color: 'bg-red-500/20 text-red-300' },
};

const statusMap: Record<TaskProfile['status'], { text: string; color: string }> = {
    todo: { text: 'A fazer', color: 'bg-gray-500/20 text-gray-300' },
    in_progress: { text: 'Em progresso', color: 'bg-blue-500/20 text-blue-300' },
    review: { text: 'Revisão', color: 'bg-purple-500/20 text-purple-300' },
    done: { text: 'Concluída', color: 'bg-green-500/20 text-green-300' },
};

interface TaskTableProps {
  tasks: TaskProfile[];
  users: UserProfile[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onEdit: (task: TaskProfile) => void;
  onView: (task: TaskProfile) => void;
}

export function TaskTable({ tasks, users, isLoading, error, onRefresh, onEdit, onView }: TaskTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [currentUser, setCurrentUser] = React.useState<FirebaseUser | null>(null);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (taskId: string) => {
    if (!currentUser) return;
    try {
        await deleteTask({ taskId, actor: currentUser.uid });
        onRefresh();
    } catch(err) {
        // Erro é tratado no contexto, mas podemos logar aqui se necessário
    }
  };


  const columns: ColumnDef<TaskProfile>[] = [
    {
      accessorKey: 'title',
      header: ({ column }) => (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              Título <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
      ),
      cell: ({ row }) => {
        const task = row.original;
        const completedSubtasks = task.subtasks?.filter(st => st.isCompleted).length || 0;
        const totalSubtasks = task.subtasks?.length || 0;
        const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

        return (
            <div>
                <div className="font-medium text-foreground cursor-pointer hover:underline" onClick={() => onEdit(task)}>{row.getValue('title')}</div>
                {totalSubtasks > 0 && (
                    <div className='mt-2 w-32'>
                        <Progress value={progress} className='h-1.5'/>
                        <span className='text-xs text-muted-foreground'>{completedSubtasks} de {totalSubtasks} concluídas</span>
                    </div>
                )}
            </div>
        )
      },
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.getValue('status') as keyof typeof statusMap;
            const { text, color } = statusMap[status] || statusMap.todo;
            return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${color}`}>{text}</span>;
        },
    },
    {
        accessorKey: 'priority',
        header: 'Prioridade',
        cell: ({ row }) => {
            const priority = row.getValue('priority') as keyof typeof priorityMap;
            const { text, color } = priorityMap[priority] || priorityMap.medium;
            return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${color} flex items-center w-fit`}><Flag className='w-3 h-3 mr-1.5'/>{text}</span>;
        },
    },
    {
        accessorKey: 'responsibleUserName',
        header: 'Responsável',
        cell: ({ row }) => {
            const name = row.getValue('responsibleUserName') as string;
            return name ? <span className='flex items-center'><User className='w-4 h-4 mr-2 text-muted-foreground'/>{name}</span> : '-';
        }
    },
    {
      accessorKey: 'dueDate',
      header: 'Vencimento',
      cell: ({ row }) => {
        const dateStr = row.getValue('dueDate') as string | null;
        if (!dateStr || !isValid(parseISO(dateStr))) return '-';
        const date = parseISO(dateStr);
        return <span className='flex items-center'><Calendar className='w-4 h-4 mr-2 text-muted-foreground'/>{format(date, "dd/MM/yyyy", {locale: ptBR})}</span>;
      }
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const task = row.original;
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
                    <DropdownMenuItem onClick={() => onView(task)} className="rounded-xl">
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(task)} className="rounded-xl">
                        <Edit className="mr-2 h-4 w-4" />
                        Editar tarefa
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-red-500 focus:bg-destructive/20 focus:text-red-400 rounded-xl">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir tarefa
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                    </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir esta tarefa?</AlertDialogTitle>
                      <AlertDialogDescription>
                         Esta ação não pode ser desfeita. A tarefa <span className='font-semibold'>"{task.title}"</span> será excluída permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(task.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Sim, excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        );
      },
    },
  ];


  const table = useReactTable({
    data: tasks,
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
        <p className="mt-4 text-muted-foreground">Carregando tarefas...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center min-h-[400px]">{error}</div>;
  }
  
  if (tasks.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center text-center min-h-[400px]">
            <List className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold text-foreground">Nenhuma tarefa encontrada</h3>
            <p className="text-muted-foreground mt-2">Comece adicionando sua primeira tarefa para vê-la aqui.</p>
        </div>
    )
  }

  return (
    <div>
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <h2 className="text-xl font-bold text-foreground">Todas as tarefas</h2>
            <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                placeholder="Buscar por título..."
                value={(table.getColumn('title')?.getFilterValue() as string) ?? ''}
                onChange={(event) =>
                    table.getColumn('title')?.setFilterValue(event.target.value)
                }
                className="w-full sm:w-[300px] pl-10 pr-4 py-2 bg-secondary rounded-xl border-border focus:ring-2 focus:ring-primary transition-all duration-300"
                />
            </div>
      </div>
      <div className="rounded-2xl border border-border overflow-x-auto">
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
