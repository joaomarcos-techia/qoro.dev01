
import { Check } from 'lucide-react';
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
    name: 'Gratuito',
    description: 'Para quem está começando a organizar a casa.',
    price: 'Grátis',
    priceDetails: 'Para sempre. Sem pegadinhas.',
    features: [
      'Até 2 usuários',
      'QoroCRM com funcionalidades essenciais',
      'QoroFinance com limites de uso',
      'QoroTask com limites de uso',
      'QoroPulse com até 5 perguntas/mês',
    ],
    buttonText: 'Começar Grátis',
    isPopular: false,
    signupPath: '/signup',
  },
  {
    name: 'Profissional',
    description: 'Para equipes que buscam mais poder e automação.',
    price: 'R$ 299',
    priceUnit: '/mês',
    priceDetails: 'Inclui até 5 usuários. Cancele quando quiser.',
    features: [
      'QoroCRM com funcionalidades ilimitadas',
      'QoroFinance com gestão completa',
      'QoroTask com quadros e tarefas ilimitados',
      'QoroPulse com IA para insights e ações',
      'Suporte prioritário via e-mail',
    ],
    buttonText: 'Escolher Profissional',
    isPopular: true,
    signupPath: '/signup',
  },
  {
    name: 'Enterprise',
    description: 'Solução robusta para empresas com necessidades complexas.',
    price: 'Customizado',
    priceDetails: 'A partir de R$ 799/mês. Fale conosco.',
    features: [
      'Todas as funcionalidades, sem limites',
      'Análise preditiva avançada com IA',
      'Integrações com outros sistemas (ERP, BI)',
      'Segurança avançada (SSO, auditoria)',
      'Gerente de Sucesso dedicado',
    ],
    buttonText: 'Fale com um especialista',
    isPopular: false,
    signupPath: 'http://bit.ly/41Emn3C',
  },
];

const PricingCard = ({ plan }: { plan: Plan }) => {
    const cardBaseClasses = "bg-card border rounded-3xl p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2";
    const popularClasses = "border-2 border-primary shadow-2xl shadow-primary/20";
    const normalClasses = "border-border hover:border-border/80";
    
    const buttonBaseClasses = "w-full py-3 rounded-xl transition-all duration-300 font-semibold";
    const popularButtonClasses = "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl";
    const normalButtonClasses = "bg-secondary hover:bg-secondary/80 text-white border border-border";

    const CardContent = (
      <div className={`${cardBaseClasses} ${plan.isPopular ? popularClasses : normalClasses} relative`}>
        {plan.isPopular && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Mais Popular
                </div>
            </div>
        )}
        <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
            <p className="text-white/70 h-12">{plan.description}</p>
            <div className="mt-4 mb-2">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                {plan.priceUnit && <span className="text-white/60 ml-1">{plan.priceUnit}</span>}
            </div>
            <p className="text-sm text-white/60">{plan.priceDetails}</p>
        </div>
        
        <ul className="space-y-4 mb-8 min-h-[220px]">
            {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start text-white/80">
                    <Check className="w-5 h-5 text-crm-primary mr-3 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
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
            <div className="text-sm font-medium text-primary mb-4 tracking-wider uppercase">Preços</div>
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
