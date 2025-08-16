'use client';

import { ArrowRight, Code, DatabaseZap, Bot } from 'lucide-react';
import Link from 'next/link';

const services = [
  {
    icon: Bot,
    title: 'Automações com IA',
    description: 'Criamos agentes de IA e automações personalizadas para otimizar seus processos internos e reduzir custos operacionais.',
    colorClass: 'from-purple-500 to-pink-500',
  },
  {
    icon: DatabaseZap,
    title: 'Integrações e Sistemas',
    description: 'Conectamos a Qoro aos seus sistemas existentes (ERPs, etc.) ou desenvolvemos novos módulos sob medida para sua necessidade.',
     colorClass: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Code,
    title: 'Dashboards e Relatórios',
    description: 'Desenvolvemos painéis de Business Intelligence (BI) com métricas e KPIs específicos para a sua gestão.',
     colorClass: 'from-green-500 to-teal-500',
  },
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
             <Link href="#contato">
                <div className="inline-flex items-center text-lg font-semibold bg-primary text-primary-foreground px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-primary/40 hover:-translate-y-1 group">
                    Fale com um especialista
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
            </Link>
          </div>
          
          <div className="space-y-8">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div key={index} className="flex items-start group p-6 bg-secondary/30 rounded-2xl border border-border transition-all duration-300 hover:border-primary/50 hover:bg-secondary/60">
                  <div className={`text-white w-12 h-12 rounded-xl flex items-center justify-center mr-6 flex-shrink-0 bg-gradient-to-br ${service.colorClass} shadow-lg`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{service.title}</h3>
                    <p className="text-white/70">{service.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
