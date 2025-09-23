
'use client';
import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { TransactionProfile, ReconciliationProfile, TransactionSchema } from '@/ai/schemas';
import { ArrowRight, CheckCircle, Loader2, GitMerge, PlusCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { TransactionForm } from './TransactionForm';
import { z } from 'zod';
import { bulkCreateTransactions } from '@/ai/flows/finance-management';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';


export interface OfxTransaction {
  date: string;
  amount: number;
  description: string;
  type: 'income' | 'expense';
}

interface TransactionComparisonTableProps {
  reconciliation: ReconciliationProfile | null;
  ofxTransactions: OfxTransaction[];
  systemTransactions: TransactionProfile[];
  isLoading: boolean;
  onRefresh: () => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (dateStr: string) => format(parseISO(dateStr), 'dd/MM/yyyy');

export function TransactionComparisonTable({ reconciliation, ofxTransactions, systemTransactions, isLoading, onRefresh }: TransactionComparisonTableProps) {

  const [isBulkCreating, setIsBulkCreating] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);


  const { matched, unmatchedOfx, unmatchedSystem } = useMemo(() => {
    const localOfx = ofxTransactions || [];
    const localSys = systemTransactions || [];
    const matched = new Set<string>();
    const systemCopy = [...localSys];
    const ofxCopy = [...localOfx];

    const findMatch = (ofx: OfxTransaction, sys: TransactionProfile[]) => {
      // Use .find() for clarity, handle potential undefined result
      return sys.find(s => {
        const sameDate = formatDate(s.date as string) === formatDate(ofx.date);
        const sameAmount = Math.abs(s.amount - Math.abs(ofx.amount)) < 0.01;
        return sameDate && sameAmount;
      });
    };

    const matchedPairs: {ofx: OfxTransaction, system: TransactionProfile}[] = [];
    const finalUnmatchedOfx: OfxTransaction[] = [];
    
    for (const ofxT of ofxCopy) {
      const match = findMatch(ofxT, systemCopy);
      if (match) {
        matchedPairs.push({ofx: ofxT, system: match});
        // Remove the matched item from systemCopy
        const index = systemCopy.findIndex(s => s.id === match.id);
        if (index > -1) {
            systemCopy.splice(index, 1);
        }
      } else {
        finalUnmatchedOfx.push(ofxT);
      }
    }
    
    return {
      matched: matchedPairs,
      unmatchedOfx: finalUnmatchedOfx,
      unmatchedSystem: systemCopy,
    }

  }, [ofxTransactions, systemTransactions]);
  
  const handleBulkCreate = async () => {
    if (!reconciliation || !currentUser || unmatchedOfx.length === 0) return;

    setIsBulkCreating(true);
    try {
        const transactionsToCreate = unmatchedOfx.map(ofx => ({
            description: ofx.description,
            amount: Math.abs(ofx.amount),
            date: parseISO(ofx.date),
            type: ofx.amount > 0 ? 'income' : 'expense',
            status: 'paid' as const,
        }));
        
        await bulkCreateTransactions({
            transactions: transactionsToCreate,
            accountId: reconciliation.accountId,
            actor: currentUser.uid,
        });

        onRefresh();
    } catch(err) {
        console.error("Error during bulk creation:", err);
        // Here you might want to set an error state to show in the UI
    } finally {
        setIsBulkCreating(false);
    }
  }

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="mt-4 text-muted-foreground">Analisando extrato...</p>
        </div>
    )
  }

  return (
    <>
      <div className="space-y-8">
        {/* Matched Transactions */}
        <div>
          <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center">
              <CheckCircle className="w-6 h-6 mr-3"/> Transações Conciliadas ({matched.length})
          </h3>
          <div className="bg-card p-4 rounded-2xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Extrato</TableHead>
                  <TableHead className="text-center">Valor</TableHead>
                  <TableHead>Sistema</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matched.map(({ ofx, system }, index) => (
                  <TableRow key={`matched-${index}`}>
                    <TableCell>
                      <p className="font-medium">{ofx.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(ofx.date)}</p>
                    </TableCell>
                    <TableCell className="text-center font-semibold text-green-400">{formatCurrency(ofx.amount)}</TableCell>
                    <TableCell>
                       <p className="font-medium">{system.description}</p>
                       <p className="text-xs text-muted-foreground">{system.category}</p>
                    </TableCell>
                  </TableRow>
                ))}
                {matched.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Nenhuma transação perfeitamente correspondida.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </div>
        
        {/* Unmatched Transactions */}
         <div>
          <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center">
              <GitMerge className="w-6 h-6 mr-3"/> Transações Não Conciliadas
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Unmatched OFX */}
              <div className="bg-card p-4 rounded-2xl border border-border">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className='font-semibold text-center text-muted-foreground'>Do Extrato ({unmatchedOfx.length})</h4>
                    <Button 
                        size="sm" 
                        className="bg-finance-primary text-black rounded-lg hover:bg-finance-primary/90" 
                        onClick={handleBulkCreate}
                        disabled={isBulkCreating || unmatchedOfx.length === 0}
                    >
                        {isBulkCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <PlusCircle className="w-4 h-4 mr-2" />}
                        {isBulkCreating ? 'Criando...' : 'Criar Transações Pendentes'}
                    </Button>
                  </div>
                   <Table>
                      <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                       <TableBody>
                          {unmatchedOfx.map((t, i) => (
                              <TableRow key={`ofx-${i}`}>
                                <TableCell>{t.description}<br/><span className='text-xs text-muted-foreground'>{formatDate(t.date)}</span></TableCell>
                                <TableCell className="text-right font-medium">{formatCurrency(t.amount)}</TableCell>
                              </TableRow>
                          ))}
                           {unmatchedOfx.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground h-24">Todas as transações do extrato foram conciliadas.</TableCell></TableRow>}
                       </TableBody>
                   </Table>
              </div>
              {/* Unmatched System */}
              <div className="bg-card p-4 rounded-2xl border border-border">
                  <h4 className='font-semibold mb-2 text-center text-muted-foreground'>Do Sistema ({unmatchedSystem.length})</h4>
                   <Table>
                      <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                       <TableBody>
                          {unmatchedSystem.map((t) => (
                               <TableRow key={t.id}><TableCell>{t.description}<br/><span className='text-xs text-muted-foreground'>{formatDate(t.date as string)}</span></TableCell><TableCell className="text-right font-medium">{formatCurrency(t.amount)}</TableCell></TableRow>
                          ))}
                          {unmatchedSystem.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground h-24">Todas as transações do sistema foram conciliadas.</TableCell></TableRow>}
                       </TableBody>
                   </Table>
              </div>
          </div>
        </div>
      </div>
    </>
  );
}
