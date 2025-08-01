
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QoroTask | Projetos',
};

export default function ProjetosPage() {
    return (
      <div>
        <h1 className="text-3xl font-bold text-black mb-4">Projetos</h1>
        <p className="text-gray-600">
          Crie e gerencie projetos, definindo milestones e acompanhando o progresso.
        </p>
      </div>
    );
  }
