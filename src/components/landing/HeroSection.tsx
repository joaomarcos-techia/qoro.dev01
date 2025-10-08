import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function HeroSection() {
  return (
    <section id="home" className="pt-28 md:pt-40 pb-20 relative overflow-hidden bg-black">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
        <div className="animate-fade-in-up">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
            Transforme o caos em clareza.
            <span className="block gradient-text animate-shine">Sua empresa, finalmente unificada.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/70 mb-10 max-w-3xl mx-auto leading-relaxed">
            Chega de planilhas e sistemas desconectados. Tenha uma visão 360° do seu negócio e tome decisões mais inteligentes com nossa plataforma integrada.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href="/#precos">
              <div className="bg-primary text-primary-foreground px-8 py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-primary/40 hover:-translate-y-1 group flex items-center justify-center text-base md:text-lg font-semibold">
                Começar gratuitamente
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
