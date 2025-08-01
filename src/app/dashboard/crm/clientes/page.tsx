
'use client';

import type { Metadata } from 'next';
import { PlusCircle, Search, User, Users } from 'lucide-react';
import { useState } from 'react';

// This is a temporary type. It will be replaced by the real Customer type from schemas.
type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'prospect';
};

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // TODO: Implement real data fetching from Firestore
  useState(() => {
    setTimeout(() => {
      // Simulate fetching data
      // setCustomers([]); // Use this to test the empty state
      setIsLoading(false);
    }, 1500);
  });
  
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black">Clientes</h1>
          <p className="text-gray-600">
            Gerencie sua base de contatos e clientes.
          </p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-neumorphism hover:shadow-neumorphism-hover flex items-center justify-center font-semibold">
          <PlusCircle className="mr-2 w-5 h-5" />
          Adicionar Cliente
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-neumorphism border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-black">Sua Lista de Clientes</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-xl shadow-neumorphism-inset focus:ring-2 focus:ring-primary transition-all duration-300"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="min-h-[400px]">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto text-gray-300 animate-pulse" />
                <p className="mt-4 font-medium">Carregando clientes...</p>
              </div>
            </div>
          ) : customers.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-center text-gray-500">
                <User className="w-12 h-12 mx-auto text-gray-400" />
                <h3 className="mt-4 text-lg font-bold text-black">Nenhum cliente encontrado</h3>
                <p className="mt-1">Comece adicionando seu primeiro cliente para vê-lo aqui.</p>
                <button className="mt-6 bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-neumorphism hover:shadow-neumorphism-hover flex items-center justify-center font-semibold mx-auto">
                  <PlusCircle className="mr-2 w-5 h-5" />
                  Adicionar Cliente
                </button>
              </div>
            </div>
          ) : (
             <div className="text-center text-gray-500 pt-16">
                <p>A tabela de clientes será exibida aqui.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
