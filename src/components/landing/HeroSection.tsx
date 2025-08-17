
'use client';

import { ArrowRight, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import { DashboardMockup } from './DashboardMockup';

export function HeroSection() {
  return (
    <section id="home" className="pt-40 pb-20 relative overflow-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/30 via-black to-black -z-10"></div>
      <div className="absolute -top-24 -left-48 w-96 h-96 bg-crm-primary/20 rounded-full filter blur-3xl opacity-40"></div>
      <div className="absolute -bottom-24 -right-48 w-96 h-96 bg-pulse-primary/20 rounded-full filter blur-3xl opacity-40"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
          Transforme o caos em clareza.
          <span className="block gradient-text">Sua empresa, finalmente unificada.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-white/70 mb-10 max-w-3xl mx-auto leading-relaxed">
          Chega de planilhas e sistemas desconectados. Tenha uma visão 360° do seu negócio e tome decisões mais inteligentes com nossa plataforma integrada.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link href="/signup">
            <div className="bg-primary text-primary-foreground px-8 py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-primary/40 hover:-translate-y-1 group flex items-center justify-center text-lg font-semibold">
              Começar grátis por 14 dias
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
          <a href="#produtos" className="group flex items-center text-white/80 hover:text-white transition-colors">
            <PlayCircle className="w-6 h-6 mr-2 text-primary group-hover:scale-110 transition-transform"/>
            <span className="font-medium">Ver como funciona</span>
          </a>
        </div>
        
        <div className="mt-20 max-w-5xl mx-auto">
            <div className="relative rounded-2xl p-2 bg-gradient-to-b from-white/10 to-transparent border border-white/10 shadow-2xl shadow-primary/20">
                <DashboardMockup />
            </div>
        </div>
      </div>
    </section>
  );
}
