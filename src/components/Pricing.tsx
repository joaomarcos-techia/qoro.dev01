import { motion } from "framer-motion";
import {
  IconCheck,
  IconArrowRight,
  IconShieldCheck,
  IconRocket,
  IconCash,
  IconDoorExit,
} from "@tabler/icons-react";
import SectionBadge from "./ui/SectionBadge";

const steps = [
  {
    step: "01",
    icon: IconRocket,
    title: "Implementação personalizada",
    highlight: "Investimento",
    subtitle: "único para começar",
    description:
      "Sistema completo configurado para sua clínica: agenda, prontuário, financeiro e IA. Tudo pronto para operar. Valor parcelável.",
    benefits: [
      "Sistema completo e exclusivo",
      "Configuração personalizada",
      "Onboarding em até 72h",
      "Valor parcelável",
    ],
    color: "text-accent-green",
    borderColor: "border-accent-green/20",
    glowColor: "rgba(16,185,129,0.12)",
  },
  {
    step: "02",
    icon: IconCash,
    title: "Mensalidade + Performance",
    highlight: "Fixo",
    subtitle: "mais bônus sobre crescimento",
    description:
      "Mensalidade fixa para manter o sistema funcionando 24/7, mais um percentual apenas sobre o faturamento que crescer acima do seu ponto de partida.",
    benefits: [
      "Sistema ativo 24 horas",
      "Suporte e manutenção incluso",
      "Atualizações contínuas da IA",
      "Transparência total nos números",
    ],
    color: "text-primary-light",
    borderColor: "border-primary/30",
    glowColor: "rgba(139,92,246,0.15)",
    featured: true,
  },
  {
    step: "03",
    icon: IconDoorExit,
    title: "Confiança, não contrato",
    highlight: "Livre",
    subtitle: "sem fidelidade, sem multa",
    description:
      "Nosso modelo se sustenta pelo resultado que entrega, não por cláusulas de permanência. Se não fizer sentido, você sai sem pagar nada a mais.",
    benefits: [
      "Zero burocracia para cancelar",
      "Sem multa ou taxa de saída",
      "Sem contrato de permanência",
      "Liberdade total de decisão",
    ],
    color: "text-accent-blue",
    borderColor: "border-accent-blue/20",
    glowColor: "rgba(59,130,246,0.12)",
  },
];

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="py-24 md:py-32 lg:py-40 px-4 bg-surface-1 relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <SectionBadge>Modelo de Negócio</SectionBadge>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{
              duration: 0.6,
              delay: 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mt-5 font-manrope font-semibold text-white tracking-[-0.02em]"
            style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
          >
            Resultado real.{" "}
            <span className="gradient-text">Investimento inteligente.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{
              duration: 0.6,
              delay: 0.2,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mt-4 text-white/50 font-inter text-base sm:text-lg max-w-lg mx-auto"
          >
            Modelo transparente com setup único, mensalidade fixa e performance
            sobre o crescimento.
          </motion.p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.6,
                delay: i * 0.12,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`relative rounded-2xl transition-all duration-300 ${
                step.featured
                  ? `bg-surface-2 border-2 ${step.borderColor} md:-mt-4 md:mb-[-16px]`
                  : `card-elevated border border-white/[0.06] hover:border-white/[0.1]`
              }`}
              style={
                step.featured
                  ? {
                      boxShadow: `0 0 60px -15px ${step.glowColor}, 0 0 30px -10px ${step.glowColor}`,
                    }
                  : undefined
              }
            >
<div className="p-6 md:p-8">
                {/* Icon */}
                <div className="flex items-center justify-end mb-6">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      step.featured ? "bg-primary/15" : "bg-white/[0.04]"
                    }`}
                  >
                    <step.icon size={20} className={step.color} />
                  </div>
                </div>

                {/* Highlight + subtitle */}
                <p
                  className={`font-manrope font-extrabold tracking-tight text-white ${
                    step.featured
                      ? "text-3xl md:text-4xl"
                      : "text-2xl md:text-3xl"
                  }`}
                >
                  {step.highlight}
                </p>
                <p className={`text-sm font-inter ${step.color} mt-1`}>
                  {step.subtitle}
                </p>

                {/* Title */}
                <h3 className="mt-4 font-manrope font-semibold text-[17px] text-white/85">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="mt-2 font-inter text-[14px] text-white/40 leading-relaxed">
                  {step.description}
                </p>

                {/* Divider */}
                <div className="my-6 h-px bg-white/[0.06]" />

                {/* Benefits */}
                <ul className="space-y-3">
                  {step.benefits.map((benefit, j) => (
                    <li
                      key={j}
                      className="flex items-center gap-3 text-[13px] font-inter text-white/55"
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                          step.featured ? "bg-primary/15" : "bg-white/[0.04]"
                        }`}
                      >
                        <IconCheck
                          size={12}
                          className={step.color}
                          stroke={2.5}
                        />
                      </div>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Connector arrows (desktop only) */}
        <div className="hidden md:flex justify-center items-center gap-2 mt-8 mb-2">
          {["Implementação", "Operação", "Liberdade"].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[11px] font-inter font-medium text-white/25 uppercase tracking-wider">
                {label}
              </span>
              {i < 2 && (
                <IconArrowRight size={14} className="text-white/15 mx-1" />
              )}
            </div>
          ))}
        </div>

        {/* Guarantee banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{
            duration: 0.6,
            delay: 0.4,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="mt-8 relative rounded-2xl border border-accent-green/10 bg-accent-green/[0.03] p-6 md:p-8"
        >
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="w-12 h-12 rounded-xl bg-accent-green/10 flex items-center justify-center shrink-0">
              <IconShieldCheck size={24} className="text-accent-green" />
            </div>
            <div className="text-center sm:text-left">
              <p className="font-manrope font-semibold text-white text-[16px]">
                Você acompanha cada resultado
              </p>
              <p className="text-white/45 text-[14px] font-inter mt-1 leading-relaxed">
                Todo mês você recebe um relatório claro com os atendimentos realizados,
                agendamentos e o impacto real no seu faturamento. Sem números escondidos —
                você vê exatamente o que está funcionando.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
