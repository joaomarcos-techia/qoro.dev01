
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { GitCompareArrows, Upload, FileText, Loader2, ServerCrash, MoreHorizontal, Edit, Trash2, Eye, Landmark, BadgeCheck, BadgeAlert } from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { listReconciliations, createReconciliation, deleteReconciliation, updateReconciliation } from '@/ai/flows/reconciliation-flow';
import { listAccounts } from '@/ai/flows/finance-management';
import { ReconciliationProfile, AccountProfile } from '@/ai/schemas';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter, usePathname } from 'next/navigation';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

export default function ConciliacaoPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reconciliations, setReconciliations] = useState<ReconciliationProfile[]>([]);
  const [accounts, setAccounts] = useState<AccountProfile[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedReconciliation, setSelectedReconciliation] = useState<ReconciliationProfile | null>(null);
  const [newFileName, setNewFileName] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const fetchInitialData = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setError(null);
    try {
      const [recs, accs] = await Promise.all([
          listReconciliations({ actor: currentUser.uid }),
          listAccounts({ actor: currentUser.uid })
      ]);
      setReconciliations(recs);
      setAccounts(accs);
      if (accs.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accs[0].id);
      }
    } catch (err: any) {
      console.error('Failed to fetch initial data:', err);
      setError(err.message || 'Não foi possível carregar os dados iniciais.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, selectedAccountId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData, pathname]); // Re-fetch when returning to the page

  const handleFileImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && currentUser && selectedAccountId) {
      setIsUploading(true);
      setError(null);

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const result = await createReconciliation({
            actor: currentUser.uid,
            fileName: file.name,
            ofxContent: content,
            accountId: selectedAccountId,
          });
          router.push(`/dashboard/finance/conciliacao/${result.id}`);
        } catch (err: any) {
          console.error("Error creating reconciliation:", err);
          setError(err.message || "Falha ao salvar o extrato. Tente novamente.");
          setIsUploading(false);
        }
      };
      reader.onerror = () => {
        setError("Ocorreu um erro ao tentar ler o arquivo.");
        setIsUploading(false);
      };
      reader.readAsText(file);
    }
  };

  const handleEditClick = (e: React.MouseEvent, rec: ReconciliationProfile) => {
    e.stopPropagation();
    setSelectedReconciliation(rec);
    setNewFileName(rec.fileName);
    setIsEditModalOpen(true);
  };
  
  const handleSaveName = async () => {
    if (!selectedReconciliation || !currentUser) return;
    try {
        await updateReconciliation({id: selectedReconciliation.id, fileName: newFileName, actor: currentUser.uid});
        setIsEditModalOpen(false);
        fetchInitialData();
    } catch (err) {
        console.error("Failed to update name", err);
    }
  }

  const handleDelete = async (id: string) => {
    if(!currentUser) return;
    try {
        await deleteReconciliation({id, actor: currentUser.uid});
        fetchInitialData();
    } catch (err) {
        console.error("Failed to delete", err);
    }
  };


  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-12 h-12 text-finance-primary animate-spin" />
          <p className="mt-4 text-muted-foreground">Carregando histórico...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-destructive/10 p-8 rounded-xl border border-destructive">
          <ServerCrash className="w-16 h-16 text-destructive mb-4" />
          <h3 className="text-xl font-bold text-destructive-foreground">Ocorreu um Erro</h3>
          <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      );
    }

    if (reconciliations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center min-h-[400px]">
                <GitCompareArrows className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-bold text-foreground">Nenhuma conciliação anterior</h3>
                <p className="text-muted-foreground mt-2 max-w-md">
                    Selecione uma conta e importe seu primeiro extrato bancário no formato OFX para começar a comparar.
                </p>
            </div>
        );
      }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                <TableRow className="hover:bg-transparent rounded-lg">
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Conta bancária</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de envio</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {reconciliations.map((rec) => (
                    <TableRow key={rec.id}>
                    <TableCell className="font-medium flex items-center">
                        <FileText className="w-4 h-4 mr-3 text-muted-foreground" />
                        {rec.fileName}
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center">
                            <Landmark className="w-4 h-4 mr-3 text-muted-foreground"/>
                            {rec.accountName || 'Não especificada'}
                        </div>
                    </TableCell>
                    <TableCell>
                    {rec.status === 'reconciled' ? (
                        <span className="flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-300 w-fit">
                            <BadgeCheck className="w-4 h-4 mr-2"/> Conciliado
                        </span>
                    ) : (
                        <span className="flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-300 w-fit">
                            <BadgeAlert className="w-4 h-4 mr-2"/> Pendente
                        </span>
                    )}
                  </TableCell>
                    <TableCell>{format(new Date(rec.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</TableCell>
                    <TableCell className="text-right">
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
                                <DropdownMenuItem onClick={() => router.push(`/dashboard/finance/conciliacao/${rec.id}`)} className="rounded-xl cursor-pointer">
                                    <Eye className="mr-2 h-4 w-4" />
                                    <span>Visualizar</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => handleEditClick(e, rec)} className="rounded-xl cursor-pointer">
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Renomear</span>
                                </DropdownMenuItem>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-red-500 focus:bg-destructive/20 focus:text-red-400 rounded-xl cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Excluir</span>
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent className="rounded-xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir conciliação?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta ação não pode ser desfeita. Isso excluirá permanentemente o registro de conciliação para o arquivo <span className='font-bold'>{rec.fileName}</span>.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(rec.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl">Excluir</AlertDialogAction>
                                </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="rounded-xl">
            <DialogHeader>
                <DialogTitle>Renomear Arquivo</DialogTitle>
                <DialogDescription>
                    Altere o nome de identificação para esta conciliação.
                </DialogDescription>
            </DialogHeader>
            <Input value={newFileName} onChange={(e) => setNewFileName(e.target.value)} className="rounded-xl" />
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="rounded-xl">Cancelar</Button>
                <Button onClick={handleSaveName} className="rounded-xl bg-finance-primary text-black hover:bg-finance-primary/90">Salvar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex-shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Conciliação bancária</h1>
            <p className="text-muted-foreground mt-1">
                Compare suas transações com o extrato bancário para garantir que tudo esteja correto.
            </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4 w-full md:w-auto">
                <div className='space-y-2 flex-grow'>
                    <Label htmlFor="account-select">Conta para conciliação</Label>
                    <Select value={selectedAccountId} onValueChange={setSelectedAccountId} disabled={accounts.length === 0}>
                        <SelectTrigger id="account-select" className="w-full sm:w-[250px] rounded-xl">
                            <SelectValue placeholder="Selecione uma conta" />
                        </SelectTrigger>
                        <SelectContent>
                            {accounts.length > 0 ? accounts.map(acc => (
                                <SelectItem key={acc.id} value={acc.id} className="rounded-lg">{acc.name}</SelectItem>
                            )) : <div className="p-4 text-sm text-muted-foreground">Nenhuma conta cadastrada.</div>}
                        </SelectContent>
                    </Select>
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".ofx, .OFX"
                    disabled={isUploading}
                />
                <Button
                    onClick={handleFileImportClick}
                    disabled={isUploading || !selectedAccountId}
                    className="bg-finance-primary text-black px-4 h-10 rounded-xl hover:bg-finance-primary/90 transition-all duration-300 border border-transparent hover:border-finance-primary/50 flex items-center justify-center font-semibold"
                >
                {isUploading ? (
                    <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                ) : (
                    <Upload className="mr-2 w-5 h-5" />
                )}
                {isUploading ? 'Enviando...' : 'Importar extrato (OFX)'}
                </Button>
            </div>
        </div>
      </div>

      <div className="bg-card p-4 sm:p-6 rounded-2xl border-border flex-grow overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-grow">
            {renderContent()}
        </div>
      </div>
    </div>
  );
}
