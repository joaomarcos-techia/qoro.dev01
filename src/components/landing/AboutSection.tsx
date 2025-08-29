
'use client';

import { FeaturesCarousel } from './FeaturesCarousel';

export function AboutSection() {
  return (
    <section id="sobre" className="py-20 bg-black overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
          <div>
            <div className="text-left">
              <div className="text-sm font-medium text-primary mb-4 tracking-wider uppercase">Construído para Empreendedores como Você</div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Menos tempo gerenciando, mais tempo crescendo.
              </h2>
              <p className="text-lg md:text-xl text-white/70 leading-relaxed">
                A Qoro não é apenas uma ferramenta, é o seu copiloto estratégico. Nós centralizamos a complexidade para que você possa focar em expandir seu negócio com clareza e confiança.
              </p>
            </div>
          </div>
          <div className="w-full">
            <FeaturesCarousel />
          </div>
        </div>
      </div>
    </section>
  );
}
