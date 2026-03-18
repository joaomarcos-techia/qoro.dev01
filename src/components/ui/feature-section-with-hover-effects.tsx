import { cn } from "@/lib/utils";
import {
  IconBrandWhatsapp,
  IconCalendarCheck,
  IconNotes,
  IconCoin,
  IconShieldCheck,
  IconStethoscope,
} from "@tabler/icons-react";
import { useState } from "react";

export function FeaturesSectionWithHoverEffects() {
  const features = [
    {
      title: "Agente IA no WhatsApp",
      description:
        "Agendamentos, confirmações e dúvidas respondidas em tempo real, 24 horas por dia — sem intervenção humana.",
      icon: <IconBrandWhatsapp />,
    },
    {
      title: "Agendamento inteligente",
      description:
        "Pacientes marcam, remarcam e cancelam consultas online. Sem ligação, sem fila de espera, sem recepcionista sobrecarregada.",
      icon: <IconCalendarCheck />,
    },
    {
      title: "Prontuário digital",
      description:
        "Histórico clínico completo, prescrições, exames e evoluções. Exportação em PDF com assinatura digital.",
      icon: <IconNotes />,
    },
    {
      title: "Financeiro integrado",
      description:
        "Contas a receber, fluxo de caixa, TISS e relatórios gerenciais em tempo real. Visibilidade total da saúde financeira.",
      icon: <IconCoin />,
    },
    {
      title: "LGPD & Segurança",
      description:
        "Dados criptografados com AES-256. Auditoria completa de acessos. 100% conforme à LGPD e às normas do CFM.",
      icon: <IconShieldCheck />,
    },
    {
      title: "Multi-especialidades",
      description:
        "Cardiologia, dermatologia, pediatria, ginecologia. O sistema se adapta a qualquer especialidade e porte de clínica.",
      icon: <IconStethoscope />,
    },
  ];
  return (
    <section id="features" className="py-24 px-4">
      <div className="flex flex-col items-center justify-center max-w-[540px] mx-auto mb-16">
        <div className="flex justify-center">
          <div className="border border-neutral-700 py-1 px-4 rounded-full text-xs font-semibold tracking-wide uppercase text-neutral-400 bg-neutral-800/50">
            Funcionalidades
          </div>
        </div>
        <h2 className="text-4xl md:text-5xl font-manrope font-medium tracking-tight mt-6 text-center text-white leading-[1.1]">
          Tudo que sua clínica precisa. Em um só lugar.
        </h2>
        <p className="text-center mt-5 font-manrope font-medium text-white/80 text-base leading-relaxed max-w-md">
          Do agendamento à gestão financeira — cada funcionalidade foi desenhada
          para clínicas que querem crescer sem aumentar a equipe.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 relative z-10 max-w-5xl mx-auto">
        {features.map((feature, index) => (
          <Feature key={feature.title} {...feature} index={index} />
        ))}
      </div>
    </section>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature border-neutral-800",
        "border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),inset_1px_0_0_rgba(255,255,255,0.03)]",
        (index === 0 || index === 4) && "lg:border-l border-neutral-800",
        index < 4 && "lg:border-b border-neutral-800"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={isHovered ? { boxShadow: '0 0 30px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255,255,255,0.07)' } : {}}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-neutral-800 to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-neutral-800 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10">
        <div className="rounded-xl bg-white/5 p-2.5 w-fit border border-white/5 backdrop-blur-sm">
          <div className="text-neutral-400 [&>svg]:size-5">
            {icon}
          </div>
        </div>
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-neutral-700 group-hover/feature:bg-[hsl(262_83%_58%)] transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-white">
          {title}
        </span>
      </div>
      <p className="text-sm text-neutral-300 max-w-xs relative z-10 px-10">
        {description}
      </p>
    </div>
  );
};
