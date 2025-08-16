import { Star, Zap, Crown, Check, type LucideProps } from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import Link from 'next/link';

type Plan = {
  name: string;
  description: string;
  price: string;
  priceUnit?: string;
  priceDetails: string;
  features: string[];
  buttonText: string;
  isPopular: boolean;
  signupPath: string;
};

const plans: Plan[] = [
  {
    name: 'Starter',
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
    isPopular: false,
    signupPath: '/signup',
  },
  {
    name: 'Profissional',
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
    isPopular: true,
    signupPath: '/signup',
  },
  {
    name: 'Enterprise',
    description: 'Solução robusta para empresas consolidadas.',
    price: 'Customizado',
    priceDetails: 'Faturamento anual com desconto',
    features: [
      'Usuários ilimitados',
      'Suporte dedicado via WhatsApp',
      'QoroPulse: análises preditivas',
      'Acesso antecipado a novas features',
      'Gerente de conta exclusivo',
    ],
    buttonText: 'Fale com um especialista',
    isPopular: false,
    signupPath: 'http://bit.ly/41Emn3C',
  },
];

const PricingCard = ({ plan }: { plan: Plan }) => {
    const cardBaseClasses = "bg-white/5 border rounded-3xl p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2";
    const popularClasses = "border-2 border-blue-500 shadow-2xl shadow-blue-500/20";
    const normalClasses = "border-white/10 hover:border-white/20";
    
    const buttonBaseClasses = "w-full py-3 rounded-xl transition-all duration-300 font-semibold";
    const popularButtonClasses = "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl";
    const normalButtonClasses = "bg-white/10 hover:bg-white/20 text-white border border-white/20";

    const CardContent = (
      <div className={`${cardBaseClasses} ${plan.isPopular ? popularClasses : normalClasses} relative`}>
        {plan.isPopular && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Mais Popular
                </div>
            </div>
        )}
        <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
            <div className="mb-4">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                {plan.priceUnit && <span className="text-white/60 ml-1">{plan.priceUnit}</span>}
            </div>
            <p className="text-white/70 h-12">{plan.description}</p>
        </div>
        
        <ul className="space-y-4 mb-8 min-h-[200px]">
            {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-white/80">
                    <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                    {feature}
                </li>
            ))}
        </ul>
        
        <button className={`${buttonBaseClasses} ${plan.isPopular ? popularButtonClasses : normalButtonClasses}`}>
            {plan.buttonText}
        </button>
      </div>
    );

    return plan.signupPath.startsWith('http') 
        ? <a href={plan.signupPath} target="_blank" rel="noopener noreferrer">{CardContent}</a> 
        : <Link href={plan.signupPath}>{CardContent}</Link>;
}

export function PricingSection() {
    return (
      <section id="precos" className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-sm font-medium text-blue-400 mb-4 tracking-wider uppercase">Preços</div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Um plano para cada fase do seu negócio
            </h2>
            <p className="text-lg text-white/70 max-w-3xl mx-auto">
              Comece de graça e evolua conforme sua empresa cresce. Simples e transparente.
            </p>
          </div>
          <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
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
