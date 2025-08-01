
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QoroTask | Calendário',
};

export default function CalendarioPage() {
    return (
      <div>
        <h1 className="text-3xl font-bold text-black mb-4">Calendário</h1>
        <p className="text-gray-600">
          Visualize as datas de entrega de tarefas e projetos em um único lugar.
        </p>
      </div>
    );
  }
