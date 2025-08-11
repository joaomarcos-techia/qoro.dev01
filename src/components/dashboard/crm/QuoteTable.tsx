
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
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoreHorizontal, ArrowUpDown, Search, Loader2, FileText, Download, Eye, Edit } from 'lucide-react';
import { listQuotes } from '@/ai/flows/crm-management';
import type { QuoteProfile } from '@/ai/schemas';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { format, parseISO } from 'date-fns';
import { QuotePDF } from './QuotePDF';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { QuoteForm } from './QuoteForm';

const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const statusMap: Record<QuoteProfile['status'], { text: string; color: string }> = {
    draft: { text: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
    sent: { text: 'Enviado', color: 'bg-blue-100 text-blue-800' },
    accepted: { text: 'Aceito', color: 'bg-green-100 text-green-800' },
    rejected: { text: 'Rejeitado', color: 'bg-red-100 text-red-800' },
    expired: { text: 'Expirado', color: 'bg-orange-100 text-orange-800' },
};

export function QuoteTable() {
  const [data, setData] = React.useState<QuoteProfile[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentUser, setCurrentUser] = React.useState<FirebaseUser | null>(null);
  
  const pdfRef = React.useRef<HTMLDivElement>(null);
  const [quoteForPdf, setQuoteForPdf] = React.useState<{quote: QuoteProfile, action: 'download' | 'view'} | null>(null);
  
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedQuote, setSelectedQuote] = React.useState<QuoteProfile | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);
  
  const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  const handleEdit = (quote: QuoteProfile) => {
    setSelectedQuote(quote);
    setIsModalOpen(true);
  };
  
  const handleModalAction = () => {
    setIsModalOpen(false);
    setSelectedQuote(null);
    triggerRefresh();
  }

  const handlePdfAction = async (quote: QuoteProfile, action: 'download' | 'view') => {
    setQuoteForPdf({ quote, action });
  };
  
  React.useEffect(() => {
    if (!quoteForPdf || !pdfRef.current) return;
  
    const generateAndHandlePdf = async () => {
      const input = pdfRef.current;
      if (input) {
        try {
          const canvas = await html2canvas(input, { scale: 2 });
          const imgData = canvas.toDataURL('image/png');
          
          if (quoteForPdf.action === 'download') {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgProps = pdf.getImageProperties(imgData);
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`proposta-${quoteForPdf.quote.number}.pdf`);
          } else if (quoteForPdf.action === 'view') {
             const newWindow = window.open();
             newWindow?.document.write(`<img src="${imgData}" style="width:100%;" />`);
          }

        } catch (error) {
            console.error("Error generating PDF:", error)
        }
      }
      setQuoteForPdf(null); 
    };
  
    // Use a short timeout to ensure the component has rendered with the new state
    const timer = setTimeout(generateAndHandlePdf, 100); 
    return () => clearTimeout(timer);
  }, [quoteForPdf]);

  const columns: ColumnDef<QuoteProfile>[] = [
    {
      accessorKey: 'number',
      header: ({ column }) => (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
              Número <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
      ),
      cell: ({ row }) => <div className="font-medium text-black">{row.getValue('number')}</div>,
    },
    {
      accessorKey: 'customerName',
      header: 'Cliente',
      cell: ({ row }) => row.getValue('customerName') || '-',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
          const status = row.getValue('status') as keyof typeof statusMap;
          const { text, color } = statusMap[status] || statusMap.draft;
          return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${color}`}>{text}</span>;
      },
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => formatCurrency(row.getValue('total')),
    },
    {
      accessorKey: 'validUntil',
      header: 'Válido Até',
      cell: ({ row }) => {
          const date = row.getValue('validUntil') as string | Date | null;
          if (!date) return '-';
          // Ensure we can handle both string and Date objects before formatting
          const dateObj = typeof date === 'string' ? parseISO(date) : date;
          return format(dateObj, "dd/MM/yyyy");
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const quote = row.original;
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
              <DropdownMenuItem onClick={() => handlePdfAction(quote, 'view')}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePdfAction(quote, 'download')}>
                <Download className="mr-2 h-4 w-4" />
                Exportar PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(quote)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">Excluir</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
        const quotes = await listQuotes({ actor: currentUser.uid });
        setData(quotes);
      } catch (err: any) {
        console.error('Failed to fetch quotes:', err);
        setError(err.message || 'Não foi possível carregar os orçamentos.');
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
        <p className="mt-4 text-gray-600">Carregando orçamentos...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center min-h-[400px]">{error}</div>;
  }
  
  if (data.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center text-center min-h-[400px]">
            <FileText className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-black">Nenhum orçamento criado</h3>
            <p className="text-gray-500 mt-2">Comece criando seu primeiro orçamento para vê-lo aqui.</p>
        </div>
    )
  }

  return (
    <>
       {/* Hidden component for PDF generation */}
       <div style={{ position: 'fixed', left: '-9999px', top: 0, width: '794px', height: 'auto' }}>
         {quoteForPdf && <QuotePDF quote={quoteForPdf.quote} ref={pdfRef}/>}
       </div>
       
       <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-black">{selectedQuote ? 'Editar Orçamento' : 'Criar Novo Orçamento'}</DialogTitle>
              <DialogDescription>
                {selectedQuote ? 'Altere as informações abaixo.' : 'Selecione o cliente, adicione os itens e defina os termos.'}
              </DialogDescription>
            </DialogHeader>
            <QuoteForm quote={selectedQuote} onQuoteAction={handleModalAction} />
          </DialogContent>
        </Dialog>


      <div>
        <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-black">Seus Orçamentos</h2>
              <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                  placeholder="Buscar por cliente ou número..."
                  value={(table.getColumn('customerName')?.getFilterValue() as string) ?? ''}
                  onChange={(event) =>
                      table.getColumn('customerName')?.setFilterValue(event.target.value)
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
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
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
    </>
  );
}
