
import { Rocket, Zap, ShieldCheck } from 'lucide-react';

const pillars = [
  {
    icon: Rocket,
    title: 'Aquisição inteligente',
    solution: 'Qualificação instantânea e sem fricção.',
    description: 'Implementamos agentes de IA que engajam, qualificam e agendam reuniões em tempo real (24/7). Sua equipe humana recebe apenas leads prontos para fechar.',
    color: 'text-crm-primary'
  },
  {
    icon: Zap,
    title: 'Otimização de fluxo',
    solution: 'Processos autônomos: a máquina de eficiência.',
    description: 'A IA assume a carga operacional (CRM, triagem, documentação), liberando sua equipe para focar em estratégia e relacionamento de alto nível.',
    color: 'text-task-primary'
  },
  {
    icon: ShieldCheck,
    title: 'Fidelização proativa',
    solution: 'Retenção preditiva: o LTV blindado.',
    description: 'Usamos a IA para prever o churn e orquestrar a comunicação cross-channel personalizada, transformando clientes ocasionais em defensores da marca.',
    color: 'text-pulse-primary'
  }
];

export function ForWhoSection() {
  return (
    <section id="solucao" className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="text-sm font-medium text-primary mb-4 tracking-wider uppercase">A Solução</div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            A arquitetura do crescimento autônomo
          </h2>
          <p className="text-lg text-white/70 max-w-3xl mx-auto">
            Nós instalamos um sistema de growth IA que opera em três frentes para garantir escala e retenção.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="bg-card border border-border rounded-3xl p-8 flex flex-col transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2">
              <div className="flex-shrink-0 mb-6">
                <div className={`inline-block p-4 bg-secondary rounded-xl ${pillar.colorClass}`}>
                  <pillar.icon className="w-8 h-8" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{pillar.title}</h3>
              <p className="text-base font-semibold text-white/80 mb-4">"{pillar.solution}"</p>
              <p className="text-white/70 text-sm flex-grow">{pillar.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
