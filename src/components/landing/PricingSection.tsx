
'use client';

import { Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

type Plan = {
  id: 'free' | 'growth' | 'performance'; 
  stripePriceId?: string;
  name: string;
  description: string;
  price: string;
  priceUnit?: string;
  priceDetails: string;
  features: string[];
  buttonText: string;
  isPopular: boolean;
};

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Essencial',
    description: 'Organize seu negócio. Ideal para autônomos e equipes que estão começando.',
    price: 'Grátis',
    priceDetails: 'Até 2 usuários.',
    features: [
      'QoroCRM: Gestão de clientes e funil de vendas',
      'QoroTask: Gestão de tarefas',
      'QoroFinance: Visão geral e registro de transações',
      'Limite de 15 clientes',
      'Limite de 5 tarefas',
      'Limite de 10 registros financeiros',
    ],
    buttonText: 'Começar grátis',
    isPopular: false,
  },
  {
    id: 'growth',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_GROWTH_PLAN_PRICE_ID, 
    name: 'Growth',
    description: 'Profissionalize sua operação. Perfeito para equipes que buscam eficiência e colaboração.',
    price: 'R$ 399',
    priceUnit: '/mês',
    priceDetails: 'Inclui até 5 usuários.',
    features: [
      'Tudo do plano Essencial, sem limites de registros',
      'QoroCRM: Registro de produtos e serviços',
      'QoroFinance: Gestão de contas a pagar e receber',
      'QoroTask: Visão de calendário para prazos',
      'Gestão de permissões de usuário por módulo',
    ],
    buttonText: 'Escolher Growth',
    isPopular: true,
  },
  {
    id: 'performance',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PERFORMANCE_PLAN_PRICE_ID,
    name: 'Performance',
    description: 'A plataforma completa para otimização e inteligência competitiva.',
    price: 'R$ 699',
    priceUnit: '/mês',
    priceDetails: 'Inclui até 10 usuários.',
    features: [
      'Tudo do plano Growth, e mais:',
      'QoroPulse: IA com sugestões proativas de negócio',
      'QoroFinance: Gestão de fornecedores e conciliação bancária',
      'QoroCRM: Criação de orçamentos profissionais',
      'Acesso antecipado a novas funcionalidades',
    ],
    buttonText: 'Escolher Performance',
    isPopular: false,
  },
];

const PricingCard = ({ plan }: { plan: Plan }) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handlePlanSelection = async () => {
        setIsLoading(true);
        router.push(`/signup?plan=${plan.id}`);
    }

    return (
      <div className={cn(
          "bg-card border rounded-3xl p-6 md:p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 h-full flex flex-col relative",
          plan.isPopular ? "border-2 border-primary shadow-2xl shadow-primary/20 hover:shadow-primary/40" : "border-border hover:border-primary"
      )}>
        {plan.isPopular && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Mais popular
                </div>
            </div>
        )}
        <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
            <p className="text-white/70 min-h-[48px] text-sm md:text-base">{plan.description}</p>
            <div className="mt-4 mb-2">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                {plan.priceUnit && <span className="text-white/60 ml-1">{plan.priceUnit}</span>}
            </div>
            <p className="text-sm text-white/60">{plan.priceDetails}</p>
        </div>
        
        <ul className="space-y-4 mb-8 flex-grow">
            {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start text-white/80 text-sm md:text-base">
                    <Check className="w-5 h-5 text-crm-primary mr-3 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                </li>
            ))}
        </ul>
        
        <button 
            onClick={handlePlanSelection}
            disabled={isLoading}
            className={cn(
                "w-full py-3 rounded-xl transition-all duration-300 font-semibold mt-auto flex items-center justify-center hover:scale-105",
                plan.isPopular ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl" : "bg-secondary hover:bg-secondary/80 text-white border border-border"
            )}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Aguarde...' : plan.buttonText}
        </button>
      </div>
    );
}

export function PricingSection() {
    return (
      <section id="precos" className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-sm font-medium text-primary mb-4 tracking-wider uppercase">Planos</div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Um plano para cada fase do seu negócio
            </h2>
            <p className="text-lg text-white/70 max-w-3xl mx-auto">
              Comece de graça e evolua conforme sua empresa cresce. Simples e transparente.
            </p>
          </div>
          <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {plans.map(plan => (
              <div key={plan.name}>
                 <PricingCard plan={plan} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
