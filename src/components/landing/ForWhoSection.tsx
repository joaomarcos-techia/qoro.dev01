import { User, Users, Briefcase, Check } from 'lucide-react';

const targetAudiences = [
  {
    icon: User,
    title: 'Autônomos e MEIs',
    description: 'Centralize seus clientes, projetos e finanças. Pareça profissional e organizado, mesmo trabalhando sozinho.',
    benefits: [
      'Controle total de clientes e vendas',
      'Organize tarefas e prazos',
      'Visão clara do seu fluxo de caixa',
    ],
    colorClass: 'text-crm-primary'
  },
  {
    icon: Users,
    title: 'Pequenas e médias empresas',
    description: 'Alinhe suas equipes, otimize processos e tome decisões baseadas em dados, não em achismos.',
    benefits: [
      'Funil de vendas colaborativo',
      'Delegação e acompanhamento de tarefas',
      'Controle de contas a pagar e receber',
    ],
    colorClass: 'text-pulse-primary'
  },
  {
    icon: Briefcase,
    title: 'Agências e consultorias',
    description: 'Gerencie múltiplos clientes e projetos com eficiência, garantindo entregas no prazo e rentabilidade.',
    benefits: [
      'Gestão de múltiplos projetos',
      'Criação de orçamentos profissionais',
      'Insights de IA para otimizar campanhas',
    ],
    colorClass: 'text-task-primary'
  }
];

export function ForWhoSection() {
  return (
    <section id="para-quem" className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="text-sm font-medium text-primary mb-4 tracking-wider uppercase">Para quem é a Qoro?</div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Desenhado para o seu tipo de negócio
          </h2>
          <p className="text-lg text-white/70 max-w-3xl mx-auto">
            Seja você um exército de um homem só ou uma equipe em crescimento, a Qoro se adapta às suas necessidades.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {targetAudiences.map((audience) => {
            const Icon = audience.icon;
            return (
              <div key={audience.title} className="bg-card border border-border rounded-3xl p-8 flex flex-col transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2">
                <div className="flex-shrink-0 mb-6">
                  <div className={`inline-block p-4 bg-secondary rounded-xl ${audience.colorClass}`}>
                    <Icon className="w-8 h-8" />
                  </div>
                </div>
                <div className="flex flex-col flex-grow">
                  <h3 className="text-2xl font-bold text-white mb-3">{audience.title}</h3>
                  <p className="text-white/70 mb-6 flex-grow">{audience.description}</p>
                  <ul className="space-y-3">
                    {audience.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-center text-white/80">
                        <Check className="w-5 h-5 text-crm-primary mr-3 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
