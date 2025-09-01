
'use client';
import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { TransactionProfile } from '@/ai/schemas';
import { ArrowRight, CheckCircle, Loader2, GitMerge } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export interface OfxTransaction {
  date: string;
  amount: number;
  description: string;
  type: 'income' | 'expense';
}

interface TransactionComparisonTableProps {
  ofxTransactions: OfxTransaction[];
  systemTransactions: TransactionProfile[];
  isLoading: boolean;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (dateStr: string) => format(parseISO(dateStr), 'dd/MM/yyyy');

export function TransactionComparisonTable({ ofxTransactions, systemTransactions, isLoading }: TransactionComparisonTableProps) {

  const { matched, unmatchedOfx, unmatchedSystem } = useMemo(() => {
    const matched = new Set<string>();
    const systemCopy = [...systemTransactions];
    const ofxCopy = [...ofxTransactions];

    const findMatch = (ofx: OfxTransaction, sys: TransactionProfile[]) => {
      return sys.findIndex(s => {
        const sameDate = formatDate(s.date) === formatDate(ofx.date);
        const sameAmount = Math.abs(s.amount - Math.abs(ofx.amount)) < 0.01; // Compare absolute for easier logic
        return sameDate && sameAmount;
      });
    };

    const matchedPairs: {ofx: OfxTransaction, system: TransactionProfile}[] = [];

    for (const ofxT of ofxCopy) {
      const matchIndex = findMatch(ofxT, systemCopy);
      if (matchIndex !== -1) {
        matchedPairs.push({ofx: ofxT, system: systemCopy[matchIndex]});
        systemCopy.splice(matchIndex, 1);
        matched.add(ofxT.date + ofxT.amount + ofxT.description); 
      }
    }
    
    return {
      matched: matchedPairs,
      unmatchedOfx: ofxCopy.filter(t => !matched.has(t.date + t.amount + t.description)),
      unmatchedSystem: systemCopy,
    }

  }, [ofxTransactions, systemTransactions]);
  
  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="mt-4 text-muted-foreground">Analisando extrato...</p>
        </div>
    )
  }

  return (
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
                 <h4 className='font-semibold mb-2 text-center text-muted-foreground'>Do Extrato ({unmatchedOfx.length})</h4>
                 <Table>
                    <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                     <TableBody>
                        {unmatchedOfx.map((t, i) => (
                            <TableRow key={`ofx-${i}`}><TableCell>{t.description}<br/><span className='text-xs text-muted-foreground'>{formatDate(t.date)}</span></TableCell><TableCell className="text-right font-medium">{formatCurrency(t.amount)}</TableCell></TableRow>
                        ))}
                         {unmatchedOfx.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground h-24">Todas as transações do extrato foram conciliadas.</TableCell></TableRow>}
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
                             <TableRow key={t.id}><TableCell>{t.description}<br/><span className='text-xs text-muted-foreground'>{formatDate(t.date)}</span></TableCell><TableCell className="text-right font-medium">{formatCurrency(t.amount)}</TableCell></TableRow>
                        ))}
                        {unmatchedSystem.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground h-24">Todas as transações do sistema foram conciliadas.</TableCell></TableRow>}
                     </TableBody>
                 </Table>
            </div>
        </div>
      </div>


    </div>
  );
}
