'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { DashboardMockup } from './DashboardMockup';

export function HeroSection() {
  return (
    <section id="home" className="pt-40 pb-20 relative overflow-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/30 via-black to-black -z-10"></div>
      <div className="absolute -top-24 -left-48 w-96 h-96 bg-white/10 rounded-full filter blur-3xl opacity-40 animate-background-pan"></div>
      <div className="absolute -bottom-24 -right-48 w-96 h-96 bg-white/10 rounded-full filter blur-3xl opacity-40 animate-background-pan" style={{ animationDelay: '3s' }}></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 animate-fade-in-up">
          Transforme o caos em clareza.
          <span className="block gradient-text animate-shine">Sua empresa, finalmente unificada.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-white/70 mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          Chega de planilhas e sistemas desconectados. Tenha uma visão 360° do seu negócio e tome decisões mais inteligentes com nossa plataforma integrada.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          <Link href="/#precos">
            <div className="bg-primary text-primary-foreground px-8 py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-primary/40 hover:-translate-y-1 group flex items-center justify-center text-lg font-semibold">
              Começar gratuitamente
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
        
        <div className="mt-20 max-w-5xl mx-auto animate-float">
            <div className="relative rounded-2xl p-2 bg-gradient-to-b from-white/10 to-transparent shadow-2xl shadow-primary/20 animate-fade-in-up" style={{ animationDelay: '900ms' }}>
                <DashboardMockup />
            </div>
        </div>
      </div>
    </section>
  );
}
