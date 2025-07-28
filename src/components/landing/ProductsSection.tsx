import { Users, Activity, CheckSquare, DollarSign, type LucideProps } from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';

type Product = {
  icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
  title: string;
  description: string;
  features: string[];
};

const products: Product[] = [
  {
    icon: Users,
    title: ' QoroCRM',
    description: 'CRM com foco em gestão de funil de vendas e conversão',
    features: [
      'Manipulação de leads',
      'Histórico de interações',
      'Lembretes automáticos de follow-up na plataforma',
    ],
  },
  {
    icon: Activity,
    title: 'QoroPulse',
    description: 'Sistema nervoso central inteligente para análises da sua empresa',
    features: [
      'Análise de dados operacionais',
      'Detecção de padrões e gargalos',
      'Propostas de ações',
    ],
  },
  {
    icon: CheckSquare,
    title: 'QoroTask',
    description: 'Plataforma leve de gestão de tarefas e produtividade',
    features: [
      'Kanban simples com notificações',
      'Tarefas com datas e responsáveis',
      'Alertas na plataforma',
    ],
  },
  {
    icon: DollarSign,
    title: 'QoroFinance',
    description: 'Controle financeiro completo para seu negócio',
    features: [
      'Dashboard financeiro completo',
      'Registro de transações',
      'Contas a pagar e receber',
    ],
  },
];

const ProductCard = ({ product }: { product: Product }) => (
  <div className="group bg-white p-8 rounded-3xl shadow-neumorphism hover:shadow-neumorphism-hover transition-all duration-300 hover:-translate-y-2">
    <div className="bg-black text-white w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-neumorphism">
      <product.icon className="w-7 h-7" />
    </div>
    <h3 className="text-2xl font-bold text-black mb-3">{product.title}</h3>
    <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>
    <ul className="space-y-2 mb-6">
      {product.features.map((feature, index) => (
        <li key={index} className="flex items-center text-sm text-gray-700">
          <div className="w-1.5 h-1.5 bg-black rounded-full mr-3"></div>
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
            Nossas soluções
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Quatro produtos poderosos, uma única plataforma integrada para revolucionar 
            a gestão do seu negócio
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
