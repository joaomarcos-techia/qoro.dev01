import { Users, Activity, CheckSquare, DollarSign, type LucideProps } from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';

type Product = {
  icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
  title: string;
  description: string;
  features: string[];
  colorClass: string;
  bulletColorClass: string;
};

const products: Product[] = [
  {
    icon: Users,
    title: ' QoroCRM',
    description: 'Relacionamento com clientes sem perder nenhuma informação.',
    features: [
      'Funil de vendas visual e intuitivo',
      'Histórico completo de interações',
      'Follow-ups automáticos para não perder negócios',
    ],
    colorClass: 'bg-gradient-to-r from-blue-500 to-blue-400',
    bulletColorClass: 'bg-blue-500',
  },
  {
    icon: Activity,
    title: 'QoroPulse',
    description: 'O cérebro da sua operação, revelando insights valiosos.',
    features: [
      'Análise de dados em tempo real',
      'Identificação de gargalos e oportunidades',
      'Sugestões inteligentes para otimização',
    ],
    colorClass: 'bg-gradient-to-r from-green-500 to-green-400',
    bulletColorClass: 'bg-green-500',
  },
  {
    icon: CheckSquare,
    title: 'QoroTask',
    description: 'Organize o trabalho da sua equipe e entregue projetos no prazo.',
    features: [
      'Quadros Kanban para gestão visual',
      'Tarefas com prazos, responsáveis e subtarefas',
      'Notificações para manter todos alinhados',
    ],
    colorClass: 'bg-gradient-to-r from-yellow-500 to-yellow-400',
    bulletColorClass: 'bg-yellow-500',
  },
  {
    icon: DollarSign,
    title: 'QoroFinance',
    description: 'A saúde financeira do seu negócio em um só lugar.',
    features: [
      'Dashboard com visão geral das finanças',
      'Controle de contas a pagar e receber',
      'Registro rápido de transações',
    ],
    colorClass: 'bg-gradient-to-r from-red-500 to-red-400',
    bulletColorClass: 'bg-red-500',
  },
];

const ProductCard = ({ product }: { product: Product }) => (
  <div className="group bg-white p-8 rounded-3xl shadow-neumorphism hover:shadow-neumorphism-hover transition-all duration-300 hover:-translate-y-2">
    <div className={`text-white w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-neumorphism ${product.colorClass}`}>
      <product.icon className="w-7 h-7" />
    </div>
    <h3 className="text-2xl font-bold text-black mb-3">{product.title}</h3>
    <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>
    <ul className="space-y-2 mb-6">
      {product.features.map((feature, index) => (
        <li key={index} className="flex items-center text-sm text-gray-700">
          <div className={`w-1.5 h-1.5 rounded-full mr-3 ${product.bulletColorClass}`}></div>
          {feature}
        </li>
      ))}
    </ul>
  </div>
);

export function ProductsSection() {
  return (
    <section id="produtos" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-black mb-4">
            Uma plataforma, controle total.
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Centralize suas operações e ganhe clareza para focar no que realmente importa: o crescimento do seu negócio.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map(product => (
            <ProductCard key={product.title} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
