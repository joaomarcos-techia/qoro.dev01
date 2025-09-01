
'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { GitCompareArrows, Upload, FileCheck, Loader2, ServerCrash } from 'lucide-react';
import { TransactionComparisonTable, OfxTransaction } from '@/components/dashboard/finance/TransactionComparisonTable';
import { TransactionProfile } from '@/ai/schemas';
import { listTransactions } from '@/ai/flows/finance-management';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

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


export default function ConciliacaoPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [systemTransactions, setSystemTransactions] = useState<TransactionProfile[]>([]);
  const [ofxTransactions, setOfxTransactions] = useState<OfxTransaction[]>([]);
  const [isLoading, setIsLoading] = useState({ page: true, file: false });
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const fetchSystemTransactions = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(prev => ({ ...prev, page: true }));
    setError(null);
    try {
        const transactions = await listTransactions({ actor: currentUser.uid });
        setSystemTransactions(transactions);
    } catch (err) {
        console.error('Failed to fetch system transactions:', err);
        setError('Não foi possível carregar as transações do sistema.');
    } finally {
        setIsLoading(prev => ({ ...prev, page: false }));
    }
  }, [currentUser]);

  useEffect(() => {
    fetchSystemTransactions();
  }, [fetchSystemTransactions]);


  const handleFileImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setIsLoading(prev => ({ ...prev, file: true }));
      setOfxTransactions([]);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
            const content = e.target?.result as string;
            const parsedTransactions = parseOfx(content);
            setOfxTransactions(parsedTransactions);
        } catch (err) {
            console.error("Error parsing OFX file:", err);
            setError("Não foi possível ler o arquivo. Verifique se o formato é OFX padrão.");
        } finally {
            setIsLoading(prev => ({ ...prev, file: false }));
        }
      };
      reader.onerror = () => {
        setError("Ocorreu um erro ao tentar ler o arquivo.");
        setIsLoading(prev => ({ ...prev, file: false }));
      }
      reader.readAsText(file);
    }
  };

  const renderContent = () => {
    if (isLoading.page) {
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="mt-4 text-muted-foreground">Carregando transações do sistema...</p>
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

    if (!selectedFile) {
        return (
            <div className="bg-card p-6 rounded-2xl border-border">
                <div className="flex flex-col items-center justify-center text-center min-h-[400px]">
                    <GitCompareArrows className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <h3 className="text-xl font-bold text-foreground">Pronto para conciliar?</h3>
                    <p className="text-muted-foreground mt-2 max-w-md">
                        Importe seu extrato bancário no formato OFX para começar a conciliar suas transações registradas com as movimentações do banco.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <TransactionComparisonTable 
            ofxTransactions={ofxTransactions} 
            systemTransactions={systemTransactions} 
            isLoading={isLoading.file}
        />
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Conciliação Bancária</h1>
          <p className="text-muted-foreground">
            Compare suas transações com o extrato bancário para garantir que tudo esteja correto.
          </p>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".ofx, .OFX"
        />
        <Button 
          onClick={handleFileImportClick}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-all duration-300 border border-transparent hover:border-primary/50 flex items-center justify-center font-semibold">
            <Upload className="mr-2 w-5 h-5" />
            Importar Extrato (OFX)
        </Button>
      </div>
      
      {selectedFile && (
        <div className="mb-6 p-4 bg-green-800/20 text-green-300 border border-green-500/30 rounded-lg flex items-center">
            <FileCheck className="w-5 h-5 mr-3" />
            <span>Arquivo <strong>{selectedFile.name}</strong> carregado. Comparando com as transações do sistema.</span>
        </div>
      )}

      {renderContent()}
    </div>
  );
}
