
import { ThumbsDown } from 'lucide-react';

const painPoints = [
  {
    title: 'Qualificação de leads',
    problem: 'O lead esfria antes de ser atendido.',
    description: 'Sua equipe de vendas gasta 80% do tempo com leads desqualificados ou demora horas para responder. A fricção entre o interesse do cliente e a resposta humana é o maior gargalo do seu negócio.',
    colorClass: 'text-red-400'
  },
  {
    title: 'Fluxo de atendimento',
    problem: 'O caos operacional sobrecarrega a equipe.',
    description: 'Documentação manual, triagem de e-mails e atualizações de CRM consomem horas. Sua equipe fica presa em tarefas de baixo valor, o que limita a capacidade de escala da sua empresa.',
    colorClass: 'text-yellow-400'
  },
  {
    title: 'Fidelização e retenção',
    problem: 'O churn silencioso e o LTV estagnado.',
    description: 'Você só descobre a insatisfação do cliente quando ele cancela. A falta de predição e a comunicação reativa fazem com que clientes valiosos busquem a concorrência.',
    colorClass: 'text-orange-400'
  }
];

export function AboutSection() {
  return (
    <section id="dor" className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="text-sm font-medium text-primary mb-4 tracking-wider uppercase">Problemas reais</div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            O custo invisível da ineficiência manual
          </h2>
          <p className="text-lg text-white/70 max-w-3xl mx-auto">
            Identificamos os 3 gargalos que estão drenando sua margem e sua escalabilidade.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {painPoints.map((point) => (
            <div key={point.title} className="bg-card border border-border rounded-3xl p-8 flex flex-col transition-all duration-300 hover:border-destructive/50 hover:shadow-2xl hover:shadow-destructive/10 hover:-translate-y-2">
              <div className="flex-shrink-0 mb-6">
                <div className={`inline-block p-4 bg-secondary rounded-xl ${point.colorClass}`}>
                  <ThumbsDown className="w-8 h-8" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{point.title}</h3>
              <p className="text-base font-semibold text-white/80 mb-4">"{point.problem}"</p>
              <p className="text-white/70 text-sm flex-grow">{point.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
