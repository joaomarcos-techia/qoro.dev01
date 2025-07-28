import { Star, Zap, Crown, Check, type LucideProps } from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';

type Plan = {
  name: string;
  icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
  iconBgClass: string;
  description: string;
  price: string;
  priceUnit?: string;
  priceDetails: string;
  features: string[];
  buttonText: string;
  buttonClass: string;
  popular: boolean;
  popularText?: string;
  isScaled?: boolean;
  footerText?: string;
};

const plans: Plan[] = [
  {
    name: 'Plano Starter',
    icon: Star,
    iconBgClass: 'bg-gradient-to-r from-gray-400 to-gray-600',
    description: 'Para quem está começando a organizar a casa.',
    price: 'Grátis',
    priceDetails: 'Para sempre. Sem pegadinhas.',
    features: [
      '1 usuário',
      'QoroTask: até 10 tarefas ativas',
      'QoroFinance: até 20 lançamentos',
      'QoroCRM: funcionalidades essenciais',
    ],
    buttonText: 'Começar Grátis',
    popular: false,
    buttonClass: 'bg-gray-900 text-white hover:bg-gray-800',
    footerText: 'Sem compromisso • Sem cartão de crédito',
  },
  {
    name: 'Plano Profissional',
    icon: Zap,
    iconBgClass: 'bg-gradient-to-r from-primary to-accent',
    description: 'Para equipes que buscam mais poder e automação.',
    price: 'R$ 45',
    priceUnit: '/usuário/mês',
    priceDetails: 'Cancele quando quiser',
    features: [
      'Até 5 usuários',
      'Suporte prioritário via e-mail',
      'QoroTask: tarefas e subtarefas ilimitadas',
      'QoroFinance: todas as funcionalidades',
      'QoroCRM: automações e integrações',
    ],
    buttonText: 'Escolher Profissional',
    popular: true,
    popularText: 'Mais Popular',
    buttonClass: 'bg-gradient-to-r from-primary to-accent text-white',
    isScaled: true,
    footerText: 'Cancele a qualquer momento',
  },
  {
    name: 'Plano Enterprise',
    icon: Crown,
    iconBgClass: 'bg-gradient-to-r from-amber-400 to-amber-600',
    description: 'Solução robusta para empresas consolidadas.',
    price: 'R$ 80',
    priceUnit: '/usuário/mês',
    priceDetails: 'Faturamento anual com desconto',
    features: [
      'Usuários ilimitados',
      'Suporte dedicado via WhatsApp',
      'QoroPulse: análises preditivas',
      'Acesso antecipado a novas features',
      'Gerente de conta exclusivo',
    ],
    buttonText: 'Fale com um especialista',
    popular: false,
    buttonClass: 'bg-gray-900 text-white hover:bg-gray-800',
    footerText: 'Soluções personalizadas para sua empresa',
  },
];

const PricingCard = ({ plan, isLegacy }: { plan: Plan, isLegacy?: boolean }) => (
    <div className={`relative bg-white rounded-3xl p-8 shadow-neumorphism hover:shadow-neumorphism-hover transition-all duration-300 ${plan.isScaled ? 'ring-2 ring-primary transform lg:scale-105' : ''}`}>
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-primary to-accent text-white px-6 py-2 rounded-full text-sm font-medium shadow-lg">
            {plan.popularText}
          </span>
        </div>
      )}
      <div className="text-center mb-8">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl text-white mb-4 shadow-neumorphism ${plan.iconBgClass}`}>
          <plan.icon className="w-7 h-7" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
        <p className="text-gray-600 mb-6 h-12">{plan.description}</p>
        
        <div className="mb-6">
          <div className="flex items-baseline justify-center">
            <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
            {plan.priceUnit && <span className="text-gray-600 ml-2">{plan.priceUnit}</span>}
          </div>
          <p className="text-sm text-gray-500 mt-2">{plan.priceDetails}</p>
        </div>
      </div>
  
      <div className="space-y-4 mb-8 min-h-[200px]">
        {plan.features.map((feature, index) => (
          <div key={index} className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <Check className="w-3.5 h-3.5 text-green-600" />
            </div>
            <span className="text-gray-700 text-sm">{feature}</span>
          </div>
        ))}
      </div>
  
      <button className={`w-full py-4 rounded-2xl font-medium transition-all duration-300 shadow-neumorphism hover:shadow-neumorphism-hover flex items-center justify-center ${plan.buttonClass}`}>
        {plan.buttonText}
      </button>
      {plan.footerText && (
          <p className="text-center text-xs text-gray-500 mt-4">
              {plan.footerText}
          </p>
      )}
    </div>
  );

export function PricingSection() {
    return (
      <section id="precos" className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Um plano para cada fase do seu negócio
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Comece de graça e evolua conforme sua empresa cresce. Simples e transparente.
            </p>
          </div>
          <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
            {plans.map(plan => (
              <div key={plan.name} className={`${plan.isScaled ? 'lg:scale-105' : ''}`}>
                 <PricingCard plan={plan} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
