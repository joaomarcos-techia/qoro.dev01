
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, GitCompareArrows, Loader2, ServerCrash, CheckCircle, GitMerge } from 'lucide-react';
import { TransactionComparisonTable, OfxTransaction } from '@/components/dashboard/finance/TransactionComparisonTable';
import { TransactionProfile, ReconciliationProfile } from '@/ai/schemas';
import { listTransactions } from '@/ai/flows/finance-management';
import { getReconciliation } from '@/ai/flows/reconciliation-flow';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Simple OFX parser
const parseOfx = (ofxContent: string): OfxTransaction[] => {
    const transactions = [];
    const transactionBlocks = ofxContent.split('<STMTTRN>');
    
    for (let i = 1; i < transactionBlocks.length; i++) {
        const block = transactionBlocks[i];
        
        const typeMatch = block.match(/<TRNTYPE>([^<]+)/);
        const dateMatch = block.match(/<DTPOSTED>([0-9]+)/);
        const amountMatch = block.match(/<TRNAMT>([-.0-9]+)/);
        const memoMatch = block.match(/<MEMO>([^<]+)/);

        if (dateMatch && amountMatch && memoMatch) {
            const dateStr = dateMatch[1];
            const formattedDate = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
            
            transactions.push({
                date: new Date(formattedDate).toISOString().split('T')[0],
                amount: parseFloat(amountMatch[1]),
                description: memoMatch[1].trim(),
                type: (amountMatch[1].startsWith('-') ? 'expense' : 'income') as 'income' | 'expense'
            });
        }
    }
    return transactions;
};


export default function ConciliacaoDetailPage() {
  const [systemTransactions, setSystemTransactions] = useState<TransactionProfile[]>([]);
  const [ofxTransactions, setOfxTransactions] = useState<OfxTransaction[]>([]);
  const [reconciliation, setReconciliation] = useState<ReconciliationProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const params = useParams();
  const router = useRouter();
  const reconciliationId = params.id as string;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const fetchData = useCallback(async () => {
    if (!currentUser || !reconciliationId) return;

    setIsLoading(true);
    setError(null);
    try {
        const [recData, transData] = await Promise.all([
            getReconciliation({ id: reconciliationId, actor: currentUser.uid }),
            listTransactions({ actor: currentUser.uid })
        ]);

        if (!recData) {
            throw new Error('Conciliação não encontrada ou acesso negado.');
        }

        setReconciliation(recData);
        setSystemTransactions(transData);
        setOfxTransactions(parseOfx(recData.ofxContent));
    } catch (err: any) {
        console.error('Failed to fetch data:', err);
        setError(err.message || 'Não foi possível carregar os dados da conciliação.');
    } finally {
        setIsLoading(false);
    }
  }, [currentUser, reconciliationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderContent = () => {
    if (isLoading) {
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="mt-4 text-muted-foreground">Analisando e comparando transações...</p>
          </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-destructive/10 p-8 rounded-xl border border-destructive">
                <ServerCrash className="w-16 h-16 text-destructive mb-4"/>
                <h3 className="text-xl font-bold text-destructive-foreground">Ocorreu um Erro</h3>
                <p className="text-muted-foreground mt-2">{error}</p>
            </div>
        )
    }

    return (
        <TransactionComparisonTable 
            ofxTransactions={ofxTransactions} 
            systemTransactions={systemTransactions} 
            isLoading={false}
        />
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <Button variant="outline" onClick={() => router.push('/dashboard/finance/conciliacao')} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para o Histórico
          </Button>
          <h1 className="text-4xl font-bold text-foreground">Detalhes da Conciliação</h1>
          <p className="text-muted-foreground">
            {reconciliation ? `Comparando extrato '${reconciliation.fileName}' de ${format(new Date(reconciliation.createdAt), 'dd/MM/yyyy', { locale: ptBR })}` : 'Carregando...'}
          </p>
        </div>
      </div>
      
      {renderContent()}
    </div>
  );
}
