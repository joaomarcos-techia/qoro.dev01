
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertCircle } from 'lucide-react';
import { QuoteProfile, AccountProfile } from '@/ai/schemas';
import { listAccounts } from '@/ai/flows/finance-management';
import { markQuoteAsWon } from '@/ai/flows/crm-management';

interface MarkAsWonDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  quote: QuoteProfile;
  actorUid: string;
  onSuccess: () => void;
}

export function MarkAsWonDialog({ isOpen, onOpenChange, quote, actorUid, onSuccess }: MarkAsWonDialogProps) {
  const [accounts, setAccounts] = useState<AccountProfile[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      listAccounts({ actor: actorUid })
        .then(accs => {
          setAccounts(accs);
          if (accs.length > 0) {
            setSelectedAccountId(accs[0].id);
          }
        })
        .catch(() => setError("Não foi possível carregar as contas financeiras."))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, actorUid]);

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await markQuoteAsWon({
        quoteId: quote.id,
        actor: actorUid,
        accountId: selectedAccountId,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Falha ao converter o orçamento em conta a receber.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Orçamento Ganho</DialogTitle>
          <DialogDescription>
            Uma nova conta a receber será criada para o cliente <strong>{quote.customerName}</strong> no valor de <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.total)}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account-select">Conta para recebimento</Label>
            <Select
              value={selectedAccountId}
              onValueChange={setSelectedAccountId}
              disabled={isLoading || accounts.length === 0}
            >
              <SelectTrigger id="account-select">
                <SelectValue placeholder={accounts.length === 0 ? "Nenhuma conta cadastrada" : "Selecione uma conta"} />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(acc => (
                  <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Você pode alterar a conta depois, se necessário.
            </p>
          </div>
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg flex items-center text-sm">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={isLoading || !selectedAccountId}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirmar e Criar Pendência
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
