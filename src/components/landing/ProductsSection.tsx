import { Users, Activity, CheckSquare, DollarSign, type LucideProps } from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import { ProductCarousel } from './ProductCarousel';

export type Product = {
  iconName: 'Users' | 'Activity' | 'CheckSquare' | 'DollarSign';
  title: string;
  description: string;
  features: string[];
  gradientClass: string;
};

const products: Product[] = [
  {
    iconName: 'Users',
    title: 'QoroCRM',
    description: 'Relacionamento com clientes sem perder nenhuma informação.',
    features: [
      'Funil de vendas visual e intuitivo',
      'Histórico completo de interações',
      'Follow-ups automáticos para não perder negócios',
    ],
    gradientClass: 'from-green-500 to-blue-500',
  },
  {
    iconName: 'Activity',
    title: 'QoroPulse',
    description: 'O cérebro da sua operação, revelando insights valiosos.',
    features: [
      'Análise de dados em tempo real',
      'Identificação de gargalos e oportunidades',
      'Sugestões inteligentes para otimização',
    ],
    gradientClass: 'from-purple-500 to-magenta-500',
  },
  {
    iconName: 'CheckSquare',
    title: 'QoroTask',
    description: 'Organize o trabalho da sua equipe e entregue projetos no prazo.',
    features: [
      'Quadros Kanban para gestão visual',
      'Tarefas com prazos e responsáveis',
      'Notificações para manter todos alinhados',
    ],
    gradientClass: 'from-orange-500 to-yellow-500',
  },
  {
    iconName: 'DollarSign',
    title: 'QoroFinance',
    description: 'A saúde financeira do seu negócio em um só lugar.',
    features: [
      'Dashboard com visão geral das finanças',
      'Controle de contas a pagar e receber',
      'Registro rápido de transações',
    ],
    gradientClass: 'from-blue-400 to-teal-400',
  },
];

export function ProductsSection() {
  return (
    <section id="produtos" className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="text-sm font-medium text-blue-400 mb-4 tracking-wider uppercase">Soluções</div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Uma plataforma, controle total.
          </h2>
          <p className="text-lg text-white/70 max-w-3xl mx-auto">
            Centralize suas operações e ganhe clareza para focar no que realmente importa: o crescimento do seu negócio.
          </p>
        </div>
        <ProductCarousel products={products} />
      </div>
    </section>
  );
}
