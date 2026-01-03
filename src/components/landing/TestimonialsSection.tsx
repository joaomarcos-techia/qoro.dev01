
import { Hospital, Scale, Building2, TrendingUp } from 'lucide-react';

const caseStudies = [
  {
    icon: Hospital,
    title: 'Clínicas e Saúde',
    pain: 'Agendamentos perdidos e sobrecarga administrativa de médicos.',
    solution: 'Gestão de agendamentos por IA e resumo automático de prontuários.',
    result: 'Redução de 75% no tempo de documentação, devolvendo o foco ao paciente.',
    color: 'text-crm-primary',
  },
  {
    icon: Scale,
    title: 'Escritórios de Advocacia',
    pain: 'Pesquisa jurisprudencial lenta e triagem manual de documentos.',
    solution: 'Agentes de IA para análise preditiva de casos e resumo de volumes documentais.',
    result: 'Redução de 90% no tempo de pesquisa e precisão total na precificação de honorários.',
    color: 'text-pulse-primary',
  },
  {
    icon: Building2,
    title: 'Construtoras',
    pain: 'Atrasos na cadeia de suprimentos e imprecisão na previsão de custos.',
    solution: 'Monitoramento de mercado em tempo real e gestão autônoma de compliance e logística.',
    result: 'Redução de 15% nos custos de material através de previsões de compra otimizadas.',
    color: 'text-task-primary',
  },
];

export function TestimonialsSection() {
  return (
    <section id="casos" className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="text-sm font-medium text-primary mb-4 tracking-wider uppercase">Estudos de Caso</div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Crescimento Cirúrgico: IA Aplicada ao Seu Setor
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {caseStudies.map((study) => (
             <div key={study.title} className="bg-card border border-border rounded-3xl p-8 flex flex-col transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2">
                <div className="flex-shrink-0 mb-6">
                    <div className={`inline-block p-4 bg-secondary rounded-xl ${study.color}`}>
                        <study.icon className="w-8 h-8" />
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{study.title}</h3>
                <div className="space-y-4 flex-grow flex flex-col">
                    <p className="text-white/70"><strong className="text-white/90">Dor:</strong> {study.pain}</p>
                    <p className="text-white/70"><strong className="text-white/90">Solução:</strong> {study.solution}</p>
                    <div className="mt-auto pt-4">
                        <div className={`flex items-center text-sm font-semibold ${study.color}`}>
                            <TrendingUp className="w-4 h-4 mr-2"/>
                            <span><strong className="text-white/90">Resultado:</strong> {study.result}</span>
                        </div>
                    </div>
                </div>
             </div>
          ))}
        </div>
      </div>
    </section>
  );
}
