import { Zap, Shield, Gift, Star, Headphones } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Integração Total',
    description: 'Todos os módulos trabalham em perfeita sincronia, eliminando silos de informação.',
    colorClass: 'bg-blue-600',
  },
  {
    icon: Shield,
    title: 'Segurança Avançada',
    description: 'Confie na infraestrutura robusta do Google Firebase para proteger seus dados mais valiosos.',
    colorClass: 'bg-green-600',
  },
  {
    icon: Headphones,
    title: 'Suporte Premium',
    description: 'Equipe especializada disponível para garantir o sucesso da sua operação.',
    colorClass: 'bg-purple-600',
  },
];

export function AboutSection() {
  return (
    <section id="sobre" className="py-20 bg-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="text-sm font-medium text-blue-400 mb-4 tracking-wider uppercase">SOBRE</div>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
          Por que escolher a Qoro?
        </h2>
        <p className="text-xl text-white/70 mb-12 leading-relaxed max-w-3xl mx-auto">
          Somos mais que uma plataforma de software. Somos parceiros estratégicos 
          na transformação digital do seu negócio, oferecendo tecnologia de ponta 
          com suporte humano excepcional.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center text-center p-6 bg-secondary/30 rounded-2xl border border-border transition-all duration-300 hover:border-primary/50 hover:bg-secondary/60">
              <div className={`text-white w-16 h-16 rounded-2xl flex items-center justify-center mb-5 flex-shrink-0 shadow-lg transition-transform duration-300 ${feature.colorClass}`}>
                <feature.icon className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-white/70 text-sm">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
