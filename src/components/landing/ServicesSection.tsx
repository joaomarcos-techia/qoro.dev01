import { Zap, Bot, Code } from 'lucide-react';

const services = [
  {
    icon: Zap,
    title: 'Automação e Eficiência',
    description: 'Cansado de tarefas repetitivas e planilhas manuais? Nós criamos robôs e fluxos de trabalho que automatizam desde rotinas financeiras e administrativas até a integração entre os sistemas que você já usa, liberando sua equipe para focar em estratégia.',
    color: 'text-task-primary',
  },
  {
    icon: Bot,
    title: 'Inteligência Artificial',
    description: 'Transforme dados em decisões. Desenvolvemos agentes de IA personalizados, chatbots de atendimento inteligentes e sistemas que geram análises e insights automáticos, dando à sua empresa uma vantagem competitiva real no mercado.',
    color: 'text-pulse-primary',
  },
  {
    icon: Code,
    title: 'Desenvolvimento Sob Medida',
    description: 'Sua operação tem uma necessidade que nenhuma ferramenta padrão atende? Nós transformamos seus processos complexos em um software (SaaS) simples, eficiente e totalmente seu, projetado para escalar junto com o seu sucesso.',
    color: 'text-crm-primary',
  }
]

export function ServicesSection() {
  return (
    <section id="servicos" className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
            <div className="text-sm font-medium text-primary mb-4 tracking-wider uppercase">Soluções Sob Medida</div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Sua empresa tem uma necessidade única?
            </h2>
            <p className="text-lg text-white/70 max-w-3xl mx-auto">
              Nós temos a solução. Analisamos seus desafios e construímos a ferramenta exata que sua operação precisa.
            </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div key={service.title} className="bg-card border border-border rounded-3xl p-8 flex flex-col text-center items-center transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2">
                <div className={`inline-block p-4 bg-secondary rounded-xl mb-6 ${service.color}`}>
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{service.title}</h3>
                <p className="text-white/70 text-sm flex-grow">{service.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  );
}
