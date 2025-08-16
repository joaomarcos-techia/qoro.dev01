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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-sm font-medium text-blue-400 mb-4 tracking-wider uppercase">SOBRE</div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Por que escolher a Qoro?
            </h2>
            <p className="text-xl text-white/70 mb-8 leading-relaxed">
              Somos mais que uma plataforma de software. Somos parceiros estratégicos 
              na transformação digital do seu negócio, oferecendo tecnologia de ponta 
              com suporte humano excepcional.
            </p>
            
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start group">
                  <div className={`text-white w-12 h-12 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300 ${feature.colorClass}`}>
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-white/70">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-8 backdrop-blur-sm">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-800/60 border border-gray-700 p-4 rounded-2xl backdrop-blur-sm">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mb-3 shadow-lg"></div>
                        <div className="h-2 bg-gray-700 rounded mb-2"></div>
                        <div className="h-2 bg-gray-800 rounded w-3/4"></div>
                    </div>
                    <div className="bg-gray-800/60 border border-gray-700 p-4 rounded-2xl backdrop-blur-sm">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-teal-500 rounded-xl mb-3 shadow-lg"></div>
                        <div className="h-2 bg-gray-700 rounded mb-2"></div>
                        <div className="h-2 bg-gray-800 rounded w-3/4"></div>
                    </div>
                    <div className="bg-gray-800/60 border border-gray-700 p-4 rounded-2xl backdrop-blur-sm">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl mb-3 shadow-lg"></div>
                        <div className="h-2 bg-gray-700 rounded mb-2"></div>
                        <div className="h-2 bg-gray-800 rounded w-3/4"></div>
                    </div>
                    <div className="bg-gray-800/60 border border-gray-700 p-4 rounded-2xl backdrop-blur-sm">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl mb-3 shadow-lg"></div>
                        <div className="h-2 bg-gray-700 rounded mb-2"></div>
                        <div className="h-2 bg-gray-800 rounded w-3/4"></div>
                    </div>
                </div>
                <div className="text-center">
                    <div className="inline-flex items-center px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-300 rounded-full text-sm font-medium">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Todos os sistemas integrados
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
