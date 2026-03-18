import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { IconBrandWhatsapp, IconCheck } from "@tabler/icons-react";
import { useLeadForm } from "../contexts/LeadFormContext";

const benefits = ["Setup gratuito", "Sem cartão", "Cancele quando quiser"];

export default function FinalCTA() {
  const { openLeadForm } = useLeadForm();
  const angle = useMotionValue(0);
  const background = useTransform(
    angle,
    (a) =>
      `conic-gradient(from ${a}deg, transparent 0%, hsl(262 83% 58% / 0.8) 8%, hsl(262 83% 68% / 0.4) 12%, transparent 20%, transparent 100%)`
  );

  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion.current) return;

    const ctrl = animate(angle, 360, {
      duration: 4,
      repeat: Infinity,
      ease: "linear",
    });
    return () => ctrl.stop();
  }, [angle]);

  return (
    <section className="py-24 md:py-32 lg:py-40 px-4">
      <div className="relative max-w-3xl mx-auto">
        {/* Diffuse glow behind */}
        <div
          className="absolute -inset-4 rounded-[2rem] blur-2xl opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, hsl(262 83% 58% / 0.5) 0%, transparent 70%)",
          }}
        />

        {/* Animated border card */}
        <motion.div className="relative rounded-3xl p-px" style={{ background }}>
          {/* Card */}
          <div className="relative rounded-3xl bg-[hsl(260_87%_3%)] px-8 py-16 sm:px-16 sm:py-20 text-center">
            {/* Label */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-sm font-inter text-white/40 mb-4"
            >
              Pronto para transformar sua clínica?
            </motion.p>

            {/* Headline */}
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="font-manrope font-semibold tracking-[-0.02em] text-white leading-[1.1]"
              style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
            >
              Comece hoje.
              <br />
              <span className="gradient-text">Resultados esta semana.</span>
            </motion.h2>

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: 0.25,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="flex items-center justify-center gap-4 sm:gap-6 mt-6 flex-wrap"
            >
              {benefits.map((b, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 text-xs sm:text-sm text-white/45 font-inter"
                >
                  <IconCheck size={14} className="text-accent-green" />
                  {b}
                </span>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: 0.35,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mt-8"
            >
              <button
                onClick={openLeadForm}
                className="inline-flex items-center gap-2 bg-[#FAFAFA] text-[#171719] rounded-full px-8 py-3.5 font-semibold text-sm cursor-pointer hover:bg-white hover:scale-[1.03] hover:shadow-[0_8px_30px_rgba(139,92,246,0.25)] transition-all duration-300 shimmer-button border-none"
              >
                Solicitar acesso
              </button>
            </motion.div>

            {/* Urgency + Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-5 space-y-1"
            >
              <p className="text-xs text-white/30 font-inter">
                Mais de 15 clínicas já confiam na Qoro
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
