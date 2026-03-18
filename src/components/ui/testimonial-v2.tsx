import React from "react";
import { motion } from "framer-motion";
import { IconStar, IconStarHalfFilled } from "@tabler/icons-react";
import SectionBadge from "./SectionBadge";

interface Testimonial {
  text: string;
  name: string;
  role: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    text: "O agente de IA resolve 80% das dúvidas dos pacientes antes mesmo de eu entrar no consultório. Chego com a agenda organizada e zero mensagem pendente.",
    name: "Dra. Camila Neves",
    role: "Dermatologista",
    rating: 5,
  },
  {
    text: "A recepção perdia mais de uma hora por dia com ligações de agendamento. Hoje o WhatsApp faz tudo automaticamente. Minha equipe agora foca no atendimento presencial.",
    name: "Rafael Souza",
    role: "Gestor de clínica",
    rating: 5,
  },
  {
    text: "O sistema é tão intuitivo que aprendi em um dia. Os pacientes adoram confirmar a consulta pelo WhatsApp — o no-show caiu pela metade.",
    name: "Fernanda Oliveira",
    role: "Recepcionista",
    rating: 5,
  },
  {
    text: "Os prontuários digitais são completos e rápidos. Prescrevo e assino digitalmente em segundos. Nunca mais perdi um documento ou resultado de exame.",
    name: "Dr. Marcos Andrade",
    role: "Cardiologista",
    rating: 4,
  },
  {
    text: "O módulo financeiro nos deu clareza total. Sabemos exatamente o que entra, o que está pendente e qual a inadimplência do mês — tudo em tempo real.",
    name: "Juliana Costa",
    role: "Administradora",
    rating: 5,
  },
  {
    text: "A implementação foi rápida e o suporte foi excepcional. Em duas semanas já tínhamos retorno positivo sobre o investimento.",
    name: "Carlos Ferreira",
    role: "Diretor Médico",
    rating: 5,
  },
];

const firstColumn = testimonials.slice(0, 2);
const secondColumn = testimonials.slice(2, 4);
const thirdColumn = testimonials.slice(4, 6);

function InitialAvatar({ name }: { name: string }) {
  const initials = name
    .replace(/^(Dra?\.\s*)/i, "")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
  return (
    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-xs font-bold text-primary-light shrink-0">
      {initials}
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 mb-3">
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < Math.floor(rating)) {
          return (
            <IconStar
              key={i}
              size={13}
              className="text-amber-400 fill-amber-400"
            />
          );
        }
        if (i < rating) {
          return (
            <IconStarHalfFilled
              key={i}
              size={13}
              className="text-amber-400"
            />
          );
        }
        return (
          <IconStar key={i} size={13} className="text-white/10" />
        );
      })}
    </div>
  );
}

const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.ul
        animate={{ translateY: "-50%" }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        style={{ willChange: "transform" }}
        className="flex flex-col gap-5 pb-5 bg-transparent list-none m-0 p-0"
      >
        {[
          ...new Array(5).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, name, role, rating }, i) => (
                <li
                  key={`${index}-${i}`}
                  aria-hidden={index > 0 ? "true" : "false"}
                  tabIndex={index > 0 ? -1 : 0}
                  className="relative p-5 sm:p-6 rounded-2xl max-w-[85vw] sm:max-w-xs w-full cursor-default select-none group focus:outline-none transition-all duration-300 ease-out bg-[#141417] border border-white/[0.06] hover:border-primary/20 hover:bg-[#18181c]"
                  style={{ transform: "translateZ(0)" }}
                >
                  <blockquote className="m-0 p-0">
                    <StarRating rating={rating} />
                    <p className="text-[14px] text-white/55 leading-[1.75] font-normal m-0 font-inter">
                      "{text}"
                    </p>
                    <footer className="flex items-center gap-3 mt-5 pt-4 border-t border-white/[0.05]">
                      <InitialAvatar name={name} />
                      <div className="flex flex-col">
                        <cite className="font-semibold not-italic tracking-tight leading-5 text-white/90 text-[14px] font-manrope">
                          {name}
                        </cite>
                        <span className="text-[12px] leading-5 text-white/35 mt-0.5 font-inter">
                          {role}
                        </span>
                      </div>
                    </footer>
                  </blockquote>
                </li>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.ul>
    </div>
  );
};

export default function TestimonialsSection() {
  return (
    <section
      id="depoimentos"
      aria-labelledby="testimonials-heading"
      className="bg-transparent py-24 md:py-32 lg:py-40 relative overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{
          duration: 0.7,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        className="container px-4 z-10 mx-auto"
      >
        <div className="flex flex-col items-center justify-center max-w-[540px] mx-auto mb-16 md:mb-20">
          <SectionBadge>Depoimentos</SectionBadge>

          <h2
            id="testimonials-heading"
            className="font-manrope font-semibold tracking-[-0.02em] mt-5 text-center text-white leading-[1.1]"
            style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
          >
            O que nossos usuários dizem
          </h2>
          <p className="text-center mt-4 font-inter text-white/50 text-base leading-relaxed max-w-sm">
            Descubra como clínicas de todo o Brasil otimizam suas operações com
            nossa plataforma.
          </p>

          {/* Metrics bar */}
          <div className="flex items-center gap-4 sm:gap-6 mt-6">
            {[
              { label: "Nota média", value: "4.9/5" },
              { label: "Clínicas", value: "15+" },
              { label: "NPS", value: "92" },
            ].map((m, i) => (
              <div key={i} className="flex items-center gap-4 sm:gap-6">
                <div className="text-center">
                  <p className="text-sm font-semibold text-white font-manrope">
                    {m.value}
                  </p>
                  <p className="text-[11px] text-white/30 mt-0.5">{m.label}</p>
                </div>
                {i < 2 && <div className="h-6 w-px bg-white/10" />}
              </div>
            ))}
          </div>
        </div>

        <div
          className="flex justify-center gap-5 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] max-h-[740px] overflow-hidden"
          role="region"
          aria-label="Depoimentos em scroll"
        >
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn
            testimonials={secondColumn}
            className="hidden md:block"
            duration={19}
          />
          <TestimonialsColumn
            testimonials={thirdColumn}
            className="hidden lg:block"
            duration={17}
          />
        </div>
      </motion.div>
    </section>
  );
}
