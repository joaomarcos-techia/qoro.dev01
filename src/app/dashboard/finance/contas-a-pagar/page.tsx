
'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle, Receipt } from 'lucide-react';

export default function ContasAPagarPage() {

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black">Contas a Pagar e Receber</h1>
          <p className="text-gray-600">
            Gerencie seus recebimentos e pagamentos futuros para nunca perder um prazo.
          </p>
        </div>
        <Button className="bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-neumorphism hover:shadow-neumorphism-hover flex items-center justify-center font-semibold">
            <PlusCircle className="mr-2 w-5 h-5" />
            Lançar Conta
        </Button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-neumorphism border border-gray-200">
        <div className="flex flex-col items-center justify-center text-center min-h-[400px]">
            <Receipt className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-black">Nenhuma conta futura registrada</h3>
            <p className="text-gray-500 mt-2 max-w-md">
                Clique em "Lançar Conta" para registrar seus próximos pagamentos e recebimentos e manter seu fluxo de caixa sob controle.
            </p>
        </div>
      </div>
    </div>
  );
}
