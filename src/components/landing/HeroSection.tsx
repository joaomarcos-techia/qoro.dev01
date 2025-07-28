import { ArrowRight } from 'lucide-react';

export function HeroSection() {
  return (
    <section id="home" className="pt-20 lg:pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-black mb-6 leading-tight">
            Diga adeus às planilhas.
            <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Centralize tudo com a Qoro.</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Pare de perder tempo caçando informações. Unifique seu CRM, projetos, finanças e análises em uma única plataforma e tome decisões mais rápidas e inteligentes.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl hover:bg-primary/90 transition-all duration-300 shadow-neumorphism hover:shadow-neumorphism-hover flex items-center justify-center text-lg font-semibold">
              Organize sua empresa grátis
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
