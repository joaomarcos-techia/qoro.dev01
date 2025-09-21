import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

const images = [
    {
      src: 'https://firebasestorage.googleapis.com/v0/b/qoro-iy1gs.firebasestorage.app/o/site.png?alt=media&token=b004694d-d2ac-49bd-aa20-fb5061fc0a4c',
      alt: 'Exemplo de website desenvolvido',
      className: ''
    },
    {
      src: 'https://firebasestorage.googleapis.com/v0/b/qoro-iy1gs.firebasestorage.app/o/site1.png?alt=media&token=f9fb65bd-d523-4d24-81af-7b1ef44b248e',
      alt: 'Exemplo de plataforma SaaS desenvolvida',
      className: ''
    }
  ];

export function ServicesSection() {
  return (
    <section id="servicos" className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col gap-8 items-center lg:order-last order-last">
            {images.map((image, index) => (
              <div key={index} className="group relative transition-all duration-500 ease-in-out transform hover:scale-105">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-primary rounded-xl blur opacity-25 group-hover:opacity-60 transition duration-1000 animate-tilt"></div>
                <div className="relative">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      width={800}
                      height={600}
                      loading="lazy"
                      className="object-contain rounded-xl border-2 border-border"
                    />
                </div>
              </div>
            ))}
          </div>
          <div className="order-first lg:order-last">
            <div className="text-sm font-medium text-purple-400 mb-4 tracking-wider uppercase">Soluções Sob Medida</div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Sua empresa tem uma necessidade única? Nós temos a solução.
            </h2>
            <div className="space-y-6 text-lg md:text-xl text-white/70 mb-8 leading-relaxed">
               <p>
                <strong className="text-white">Agentes de IA e Automação de Processos:</strong> Cansado de tarefas repetitivas? Nós criamos robôs e agentes de IA que automatizam desde o contato com clientes e qualificação de leads até rotinas financeiras e administrativas, liberando sua equipe para focar em estratégia.
              </p>
              <p>
                <strong className="text-white">Aplicações Personalizadas:</strong> Transformamos seus processos complexos em sistemas simples e eficientes. Desenvolvemos o software exato que sua operação precisa para escalar, totalmente integrado ao seu ecossistema.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
