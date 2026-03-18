import { motion } from "framer-motion";
import { IconBrandWhatsapp, IconArrowRight } from "@tabler/icons-react";
import ShimmerButton from "./ui/ShimmerButton";
import { useLeadForm } from "../contexts/LeadFormContext";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] },
});

const trustItems = [
  "Sem cartão de crédito",
  "Setup em 72h",
  "15+ clínicas ativas",
];

export default function HeroContent() {
  const { openLeadForm } = useLeadForm();
  return (
    <div className="text-center max-w-3xl mx-auto">
      {/* Headline */}
      <motion.h1
        {...fadeUp(0.05)}
        className="font-manrope font-semibold text-hero-heading leading-[1.08] tracking-[-0.03em]"
        style={{ fontSize: "clamp(32px, 5vw, 60px)" }}
      >
        A IA que atende, agenda
        <br />
        e <span className="gradient-text">gerencia sua clínica.</span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        {...fadeUp(0.1)}
        className="mt-5 font-inter text-white/60 text-base sm:text-lg leading-[1.7] max-w-xl mx-auto"
      >
        Agente inteligente no WhatsApp que cuida dos seus pacientes 24h.
        <br className="hidden sm:block" />
        Prontuário digital, gestão financeira e zero custo inicial.
      </motion.p>

      {/* CTAs */}
      <motion.div
        {...fadeUp(0.15)}
        className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
      >
        <ShimmerButton
          as="button"
          onClick={openLeadForm}
          size="lg"
        >
          Começar gratuitamente
        </ShimmerButton>

        <ShimmerButton variant="secondary" size="lg" as="a" href="#como-funciona">
          Ver como funciona
          <IconArrowRight size={16} />
        </ShimmerButton>
      </motion.div>

      {/* Trust line */}
      <motion.div
        {...fadeUp(0.2)}
        className="mt-6 flex items-center justify-center gap-2 sm:gap-4 flex-wrap"
      >
        {trustItems.map((item, i) => (
          <div key={i} className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm text-white/35 font-inter">
              {item}
            </span>
            {i < trustItems.length - 1 && (
              <span className="text-white/15">·</span>
            )}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
