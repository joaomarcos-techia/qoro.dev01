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
    iconBgClass: 'bg-gradient-to-r from-blue-400 to-blue-600',
    description: 'Perfeito para começar sua jornada digital',
    price: 'Grátis',
    priceDetails: 'Sem cartão de crédito',
    features: [
      '1 usuário',
      'QoroTask: limite de 10 tarefas',
      'QoroFinance: limite de 20 movimentações financeiras',
      'QoroCRM: funcionalidades básicas',
    ],
    buttonText: 'Começar Grátis',
    popular: false,
    buttonClass: 'bg-gray-900 text-white hover:bg-gray-800',
    footerText: 'Sem compromisso • Sem cartão de crédito',
  },
  {
    name: 'Plano Profissional',
    icon: Zap,
    iconBgClass: 'bg-gradient-to-r from-purple-400 to-purple-600',
    description: 'Para empresas em crescimento acelerado',
    price: 'R$ 45,00',
    priceUnit: '/mês',
    priceDetails: 'Cartão necessário • Cancele quando quiser',
    features: [
      'Até 2 usuários',
      'Suporte via e-mail',
      'QoroTask: limite de 50 tarefas, com subtarefas',
      'QoroFinance: todas as funcionalidades',
      'QoroCRM: chatbot e integração WhatsApp',
    ],
    buttonText: 'Começar',
    popular: true,
    popularText: 'Mais Popular',
    buttonClass: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white',
    isScaled: true,
    footerText: 'Cartão necessário • Cancele quando quiser',
  },
  {
    name: 'Plano Enterprise',
    icon: Crown,
    iconBgClass: 'bg-gradient-to-r from-amber-400 to-amber-600',
    description: 'Solução completa para grandes empresas',
    price: 'R$ 80,00',
    priceUnit: '/mês',
    priceDetails: 'Cartão necessário • Cancele quando quiser',
    features: [
      'Até 4 usuários',
      'Suporte via e-mail e WhatsApp',
      'QoroTask: tarefas ilimitadas',
      'QoroFinance: relatórios profissionais',
      'QoroCRM: integração WhatsApp e e-mail',
      'QoroPulse disponível',
    ],
    buttonText: 'Começar',
    popular: false,
    buttonClass: 'bg-gray-900 text-white hover:bg-gray-800',
    footerText: 'Cartão necessário • Cancele quando quiser',
  },
];

const PricingCard = ({ plan, isLegacy }: { plan: Plan, isLegacy?: boolean }) => (
    <div className={`relative bg-white rounded-3xl p-8 shadow-neumorphism hover:shadow-neumorphism-hover transition-all duration-300 ${plan.isScaled ? 'ring-2 ring-purple-500 transform lg:scale-105' : ''}`}>
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-medium shadow-lg">
            {plan.popularText}
          </span>
        </div>
      )}
      <div className="text-center mb-8">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl text-white mb-4 shadow-neumorphism ${plan.iconBgClass}`}>
          <plan.icon className="w-7 h-7" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
        <p className="text-gray-600 mb-6">{plan.description}</p>
        
        <div className="mb-6">
          <div className="flex items-baseline justify-center">
            <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
            {plan.priceUnit && <span className="text-gray-600 ml-2">{plan.priceUnit}</span>}
          </div>
          <p className="text-sm text-gray-500 mt-2">{plan.priceDetails}</p>
        </div>
      </div>
  
      <div className="space-y-4 mb-8">
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
              Escolha seu plano
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Comece agora. Cancele quando quiser.
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
