"use client";

import { Box, Lock, Search, Rocket, Zap, ShieldCheck } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { cn } from "@/lib/utils";

export function ForWhoSection() {
  return (
    <section id="solucao" className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="text-sm font-medium text-primary mb-4 tracking-wider uppercase">A Solução</div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            A arquitetura do crescimento autônomo
          </h2>
          <p className="text-lg text-white/70 max-w-3xl mx-auto">
            Nós instalamos um sistema de growth IA que opera em três frentes para garantir escala e retenção.
          </p>
        </div>
        <ul className="grid grid-cols-1 grid-rows-none gap-8 md:grid-cols-12 md:grid-rows-1">
          <GridItem
            area="md:[grid-area:1/1/2/5]"
            icon={<Rocket className="h-6 w-6" />}
            title="Aquisição inteligente"
            description="Implementamos agentes de IA que engajam e qualificam leads em tempo real (24/7). Sua equipe humana recebe apenas reuniões com clientes prontos para fechar."
          />
          <GridItem
            area="md:[grid-area:1/5/2/9]"
            icon={<Zap className="h-6 w-6" />}
            title="Otimização de fluxo"
            description="A IA assume a carga operacional (CRM, triagem, documentação), liberando sua equipe para focar em estratégia e relacionamento de alto nível."
          />
          <GridItem
            area="md:[grid-area:1/9/2/13]"
            icon={<ShieldCheck className="h-6 w-6" />}
            title="Fidelização proativa"
            description="Usamos a IA para prever o churn e orquestrar a comunicação cross-channel, transformando clientes ocasionais em defensores da marca."
          />
        </ul>
      </div>
    </section>
  );
}

interface GridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
}

const GridItem = ({ area, icon, title, description }: GridItemProps) => {
  return (
    <li className={cn("min-h-[16rem] list-none", area)}>
      <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-background p-6 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] md:p-6">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border-[0.75px] border-border bg-muted p-3">
              {icon}
            </div>
            <div className="space-y-3">
              <h3 className="pt-0.5 text-xl leading-[1.375rem] font-semibold font-sans tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-balance text-foreground">
                {title}
              </h3>
              <h2 className="[&_b]:md:font-semibold [&_strong]:md:font-semibold font-sans text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-muted-foreground">
                {description}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};