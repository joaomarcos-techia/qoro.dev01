
import { Zap, Bot, Code } from 'lucide-react';

const services = [
  {
    icon: Zap,
    title: 'Automação e eficiência',
    description: 'Cansado de tarefas repetitivas? Criamos robôs e fluxos de trabalho que automatizam desde rotinas financeiras até a integração entre os sistemas que você já usa, liberando sua equipe para focar em estratégia.',
    color: 'text-task-primary',
  },
  {
    icon: Bot,
    title: 'Inteligência artificial personalizada',
    description: 'Transforme dados em decisões. Desenvolvemos agentes de IA, chatbots de atendimento inteligentes e sistemas que geram análises e insights automáticos, dando à sua empresa uma vantagem competitiva real no mercado.',
    color: 'text-pulse-primary',
  },
  {
    icon: Code,
    title: 'Desenvolvimento de SaaS sob medida',
    description: 'Sua operação tem uma necessidade que nenhuma ferramenta padrão atende? Transformamos seus processos complexos em um software (SaaS) simples, eficiente e totalmente seu, projetado para escalar com o seu sucesso.',
    color: 'text-crm-primary',
  }
]

export function ServicesSection() {
  return (
    <section id="servicos" className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
            <div className="text-sm font-medium text-primary mb-4 tracking-wider uppercase">Soluções sob medida</div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Sua empresa tem uma necessidade única?
            </h2>
            <p className="text-lg text-white/70 max-w-3xl mx-auto">
              Se a nossa abordagem de growth IA não atender 100% dos seus desafios, nós construímos a ferramenta exata que sua operação precisa para decolar.
            </p>
        </div>
        <div className="max-w-3xl mx-auto">
          <div className="space-y-12">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <div key={service.title} className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
                  <div className={`flex-shrink-0 inline-block p-4 bg-secondary rounded-xl ${service.color}`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{service.title}</h3>
                    <p className="text-white/70 text-base leading-relaxed">{service.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
