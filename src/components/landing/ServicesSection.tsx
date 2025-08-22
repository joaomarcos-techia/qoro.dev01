
'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

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
          <div>
            <div className="text-sm font-medium text-purple-400 mb-4 tracking-wider uppercase">Soluções Sob Medida</div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Sua empresa tem uma necessidade única. Nós temos a solução.
            </h2>
            <p className="text-xl text-white/70 mb-8 leading-relaxed">
              Além da plataforma Qoro, nossa equipe de especialistas está pronta para desenvolver soluções personalizadas que se integram perfeitamente ao seu fluxo de trabalho e resolvem desafios específicos do seu negócio.
            </p>
             <a href="http://bit.ly/41Emn3C" target="_blank" rel="noopener noreferrer">
                <div className="inline-flex items-center text-lg font-semibold bg-primary text-primary-foreground px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-primary/40 hover:-translate-y-1 group">
                    Fale com um especialista
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
            </a>
          </div>
          
          <div className="flex flex-col gap-8 items-center">
            {images.map((image, index) => (
              <div key={index} className={`group relative transition-all duration-500 ease-in-out transform hover:scale-105`}>
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-primary rounded-xl blur opacity-25 group-hover:opacity-60 transition duration-1000 animate-tilt"></div>
                <div className="relative">
                    <img
                      src={image.src}
                      alt={image.alt}
                      width={800}
                      height={600}
                      className="object-contain rounded-xl border-2 border-border"
                    />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
