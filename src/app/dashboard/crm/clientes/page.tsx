
'use client';

import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerTable } from '@/components/dashboard/crm/CustomerTable';

export default function ClientesPage() {

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black">Clientes</h1>
          <p className="text-gray-600">
            Gerencie sua base de contatos e clientes.
          </p>
        </div>
        <Button className="bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-neumorphism hover:shadow-neumorphism-hover flex items-center justify-center font-semibold">
          <PlusCircle className="mr-2 w-5 h-5" />
          Adicionar Cliente
        </Button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-neumorphism border border-gray-200">
        <CustomerTable />
      </div>
    </div>
  );
}
