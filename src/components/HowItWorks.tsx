import { useRef, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  IconMessageChatbot,
  IconQrcode,
  IconSparkles,
} from "@tabler/icons-react";
import SectionBadge from "./ui/SectionBadge";

const steps = [
  {
    number: "01",
    icon: IconMessageChatbot,
    title: "Fale com a gente",
    description:
      "Cadastramos sua clínica, equipe médica e configuramos a agenda. Sem complicação.",
    bullets: ["Cadastro guiado", "Configuração de agenda", "Personalização"],
  },
  {
    number: "02",
    icon: IconQrcode,
    title: "Conecte o WhatsApp",
    description:
      "Escaneie o QR Code e seu número fica integrado. Pacientes são atendidos automaticamente.",
    bullets: ["Integração em minutos", "Número conectado", "Atendimento ativo"],
  },
  {
    number: "03",
    icon: IconSparkles,
    title: "IA ativada",
    description:
      "Agendamentos, confirmações e lembretes 24h, sem intervenção humana.",
    bullets: ["Agendamento automático", "Confirmações via IA", "Respostas 24/7"],
  },
];

/* Each step reveals in a specific scroll range */
function StepItem({
  step,
  index,
  scrollYProgress,
}: {
  step: (typeof steps)[number];
  index: number;
  scrollYProgress: MotionValue<number>;
}) {
  // Each step gets a wider scroll range for smoother animation
  const start = index * 0.3;
  const peak = start + 0.18;

  // Circle: scale up + glow
  const circleScale = useTransform(scrollYProgress, [start, start + 0.08], [0, 1]);
  const circleGlow = useTransform(
    scrollYProgress,
    [start, start + 0.08, start + 0.2],
    [0, 1, 0.6]
  );

  // Content: fade up with scale
  const contentOpacity = useTransform(scrollYProgress, [start + 0.02, peak + 0.05], [0, 1]);
  const contentY = useTransform(scrollYProgress, [start + 0.02, peak + 0.05], [24, 0]);
  const contentScale = useTransform(scrollYProgress, [start + 0.02, peak + 0.05], [0.96, 1]);

  return (
    <div className="relative pl-14 md:pl-20 pb-20 last:pb-0">
      {/* Circle on timeline */}
      <motion.div
        className="absolute left-0 md:left-3.5 top-0 z-10"
        style={{ scale: circleScale, opacity: circleScale }}
      >
        <motion.div
          className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-surface-2 border-2 border-primary/40 flex items-center justify-center"
          style={{
            boxShadow: useTransform(
              circleGlow,
              (v) =>
                `0 0 ${v * 20}px rgba(139,92,246,${v * 0.4}), 0 0 ${v * 40}px rgba(139,92,246,${v * 0.15})`
            ),
          }}
        >
          <span className="gradient-text-vivid font-manrope font-bold text-xs md:text-sm">
            {step.number}
          </span>
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        style={{
          opacity: contentOpacity,
          y: contentY,
          scale: contentScale,
        }}
      >
        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <step.icon size={20} className="text-primary-light" />
          </div>
          <h3 className="font-manrope font-semibold text-xl md:text-2xl text-white">
            {step.title}
          </h3>
        </div>

        {/* Card content */}
        <div className="card-elevated card-glow p-6 md:p-8">
          <p className="font-inter text-[15px] text-white/50 leading-relaxed">
            {step.description}
          </p>

          {/* Bullets */}
          <ul className="mt-5 space-y-2.5">
            {step.bullets.map((bullet, j) => (
              <li
                key={j}
                className="flex items-center gap-3 text-sm font-inter text-white/40"
              >
                <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-light" />
                </div>
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </div>
  );
}

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 70%", "end 40%"],
  });

  // On mobile, delay the line so it trails behind the steps
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const heightTransform = useTransform(
    scrollYProgress,
    isMobile
      ? [0.05, 0.3, 0.6, 0.9]
      : [0, 1],
    isMobile
      ? [0, contentHeight * 0.25, contentHeight * 0.55, contentHeight]
      : [0, contentHeight]
  );
  const opacityTransform = useTransform(
    scrollYProgress,
    isMobile ? [0.05, 0.15] : [0, 0.1],
    [0, 1]
  );

  return (
    <section
      id="como-funciona"
      className="py-24 md:py-32 lg:py-40 px-4 relative"
      ref={containerRef}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <SectionBadge>Como funciona</SectionBadge>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 font-manrope font-semibold text-white tracking-[-0.02em]"
            style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
          >
            Do cadastro ao primeiro atendimento
            <br className="hidden sm:block" />
            <span className="gradient-text"> em 72 horas.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 text-white/50 font-inter text-base sm:text-lg max-w-lg mx-auto"
          >
            Três passos. Sem burocracia. Sem consultoria.
          </motion.p>
        </div>

        {/* Timeline */}
        <div ref={contentRef} className="relative">
          {/* Vertical line track */}
          <div className="absolute left-[15px] md:left-[31px] top-0 bottom-0 w-[2px] bg-white/[0.04] rounded-full" />

          {/* Animated progress line */}
          <motion.div
            className="absolute left-[15px] md:left-[31px] top-0 w-[2px] origin-top rounded-full"
            style={{
              height: heightTransform,
              opacity: opacityTransform,
              background:
                "linear-gradient(to bottom, hsl(262 83% 58%), hsl(262 83% 72%) 70%, transparent)",
              boxShadow: "0 0 8px hsl(262 83% 58% / 0.3), 0 0 20px hsl(262 83% 58% / 0.1)",
            }}
          />

          {/* Steps */}
          <div className="space-y-0">
            {steps.map((step, i) => (
              <StepItem
                key={i}
                step={step}
                index={i}
                scrollYProgress={scrollYProgress}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
