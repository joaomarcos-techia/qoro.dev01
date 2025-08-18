import { Users, Activity, CheckSquare, DollarSign, type LucideProps } from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import { cn } from '@/lib/utils';


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
    gradientClass: 'from-crm-primary/80 to-green-400',
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
    gradientClass: 'from-pulse-primary/80 to-purple-400',
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
    gradientClass: 'from-task-primary/80 to-orange-400',
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
    gradientClass: 'from-finance-primary/80 to-sky-400',
  },
];

const iconMap: Record<Product['iconName'], ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>> = {
    Users,
    Activity,
    CheckSquare,
    DollarSign,
};

const ProductCard = ({ product }: { product: Product }) => {
    const Icon = iconMap[product.iconName];
    return (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 h-full flex flex-col">
            <div className={`bg-gradient-to-br ${product.gradientClass} text-white w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg flex-shrink-0`}>
                <Icon className="w-7 h-7" />
            </div>
            <div className="flex-grow">
              <h3 className="text-2xl font-bold text-white mb-3">{product.title}</h3>
              <p className="text-white/70 mb-6 leading-relaxed">{product.description}</p>
            </div>
            <ul className="space-y-3 border-t border-white/10 pt-6">
                {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm text-white/60">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3 mt-1.5 flex-shrink-0"></div>
                        {feature}
                    </li>
                ))}
            </ul>
        </div>
    )
};


export function ProductsSection() {
  return (
    <section id="produtos" className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="text-sm font-medium text-primary mb-4 tracking-wider uppercase">Soluções</div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Uma plataforma, controle total.
          </h2>
          <p className="text-lg text-white/70 max-w-3xl mx-auto">
            Centralize suas operações e ganhe clareza para focar no que realmente importa: o crescimento do seu negócio.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
                <ProductCard key={product.title} product={product} />
            ))}
        </div>

      </div>
    </section>
  );
}
