
'use client';

import { Button } from '@/components/ui/button';
import { GitCompareArrows, Upload } from 'lucide-react';

export default function ConciliacaoPage() {

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black">Conciliação Bancária</h1>
          <p className="text-gray-600">
            Compare suas transações com o extrato bancário para garantir que tudo esteja correto.
          </p>
        </div>
        <Button className="bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-neumorphism hover:shadow-neumorphism-hover flex items-center justify-center font-semibold">
            <Upload className="mr-2 w-5 h-5" />
            Importar Extrato (OFX)
        </Button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-neumorphism border border-gray-200">
        <div className="flex flex-col items-center justify-center text-center min-h-[400px]">
            <GitCompareArrows className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-black">Pronto para conciliar?</h3>
            <p className="text-gray-500 mt-2 max-w-md">
                Importe seu extrato bancário no formato OFX para começar a conciliar suas transações registradas com as movimentações do banco.
            </p>
        </div>
      </div>
    </div>
  );
}
