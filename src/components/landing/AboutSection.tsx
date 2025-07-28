import { Zap, Shield, Gift, Star } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Informação Unificada',
    description: 'Todos os seus dados em um só lugar. Chega de alternar entre sistemas e planilhas.',
    colorClass: 'bg-blue-500',
  },
  {
    icon: Shield,
    title: 'Segurança de Nível Mundial',
    description: 'Confie na infraestrutura robusta do Google Firebase para proteger seus dados mais valiosos.',
    colorClass: 'bg-green-500',
  },
  {
    icon: Gift,
    title: 'Comece Grátis, Cresça Sem Limites',
    description: 'Nosso plano gratuito é generoso e perfeito para você começar a organizar sua empresa hoje mesmo.',
    colorClass: 'bg-yellow-500',
  },
];

export function AboutSection() {
  return (
    <section id="sobre" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold text-black mb-6">
              Por que a Qoro é diferente?
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Nós não somos apenas um software, somos o fim da sua dor de cabeça. A Qoro foi criada para trazer clareza e controle, permitindo que você se concentre em estratégias, não em procurar informações.
            </p>
            
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start">
                  <div className={`text-white w-12 h-12 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-neumorphism ${feature.colorClass}`}>
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-white rounded-3xl p-8 shadow-neumorphism">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-2xl shadow-neumorphism-inset">
                  <div className="w-8 h-8 bg-blue-500 rounded-xl mb-3 shadow-neumorphism"></div>
                  <div className="h-2 bg-gray-200 rounded mb-2"></div>
                  <div className="h-2 bg-gray-100 rounded"></div>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl shadow-neumorphism-inset">
                  <div className="w-8 h-8 bg-green-500 rounded-xl mb-3 shadow-neumorphism"></div>
                  <div className="h-2 bg-gray-200 rounded mb-2"></div>
                  <div className="h-2 bg-gray-100 rounded"></div>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl shadow-neumorphism-inset">
                  <div className="w-8 h-8 bg-yellow-500 rounded-xl mb-3 shadow-neumorphism"></div>
                  <div className="h-2 bg-gray-200 rounded mb-2"></div>
                  <div className="h-2 bg-gray-100 rounded"></div>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl shadow-neumorphism-inset">
                  <div className="w-8 h-8 bg-red-500 rounded-xl mb-3 shadow-neumorphism"></div>
                  <div className="h-2 bg-gray-200 rounded mb-2"></div>
                  <div className="h-2 bg-gray-100 rounded"></div>
                </div>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center bg-gray-50 px-4 py-2 rounded-full shadow-neumorphism-inset">
                  <Star className="text-yellow-500 mr-2 w-4 h-4" />
                  <span className="text-sm font-medium text-gray-700">Fim da bagunça, início da clareza</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
