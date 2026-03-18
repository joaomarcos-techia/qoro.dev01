import { motion } from "framer-motion";
import {
  IconBrandWhatsapp,
  IconCalendarCheck,
  IconNotes,
  IconCoin,
  IconShieldCheck,
  IconStethoscope,
  IconArrowUpRight,
  IconCheck,
  IconFileText,
  IconClock,
} from "@tabler/icons-react";
import SectionBadge from "./ui/SectionBadge";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as number[] },
});

/* ─── Embedded visual: WhatsApp chat bubbles ─── */
function WhatsAppVisual() {
  return (
    <div className="mt-5 w-full rounded-xl bg-[#1a1a1a] border border-[#242424] p-4 overflow-hidden flex-1 flex flex-col justify-center">
      <div className="space-y-3">
        <div className="flex gap-2.5 items-start">
          <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
            <IconBrandWhatsapp size={14} className="text-green-400" />
          </div>
          <div className="bg-[#222] rounded-xl rounded-tl-none px-3 py-2 max-w-[75%]">
            <p className="text-[11px] text-white/60 leading-relaxed">
              Olá! Gostaria de agendar uma consulta para amanhã.
            </p>
          </div>
        </div>
        <div className="flex gap-2.5 items-start justify-end">
          <div className="bg-primary/20 rounded-xl rounded-tr-none px-3 py-2 max-w-[75%]">
            <p className="text-[11px] text-primary-light leading-relaxed">
              Perfeito! Temos horários às 09h, 14h e 16h. Qual prefere?
            </p>
          </div>
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-primary-light">IA</span>
          </div>
        </div>
        <div className="flex gap-2.5 items-start">
          <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
            <IconBrandWhatsapp size={14} className="text-green-400" />
          </div>
          <div className="bg-[#222] rounded-xl rounded-tl-none px-3 py-2">
            <p className="text-[11px] text-white/60">14h, por favor!</p>
          </div>
        </div>
        <div className="flex gap-2.5 items-start justify-end">
          <div className="bg-primary/20 rounded-xl rounded-tr-none px-3 py-2 max-w-[75%]">
            <p className="text-[11px] text-primary-light leading-relaxed">
              Consulta agendada para amanhã às 14h. Enviarei um lembrete!
            </p>
          </div>
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-primary-light">IA</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Embedded visual: Analytics/metrics chart ─── */
function AnalyticsVisual() {
  return (
    <div className="w-full rounded-xl bg-[#1a1a1a] border border-[#242424] p-5 overflow-hidden flex-1 flex flex-col">
      {/* Metric header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-full bg-accent-green/15 flex items-center justify-center">
          <IconArrowUpRight size={12} className="text-accent-green" />
        </div>
        <span className="text-sm font-medium text-accent-green font-inter">
          +23.5%
        </span>
        <span className="text-xs text-white/30 font-inter">este mês</span>
      </div>
      {/* Mini chart bars */}
      <div className="flex items-end gap-1.5 h-24">
        {[40, 55, 35, 65, 50, 75, 60, 85, 70, 90, 78, 95].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm transition-all"
            style={{
              height: `${h}%`,
              background:
                i >= 9
                  ? "linear-gradient(to top, hsl(262 83% 58%), hsl(262 83% 72%))"
                  : "rgba(255,255,255,0.06)",
            }}
          />
        ))}
      </div>
      {/* Labels */}
      <div className="flex justify-between mt-2">
        <span className="text-[9px] text-white/20 font-inter">Jan</span>
        <span className="text-[9px] text-white/20 font-inter">Jun</span>
        <span className="text-[9px] text-white/20 font-inter">Dez</span>
      </div>
    </div>
  );
}

/* ─── Embedded visual: Specialties grid ─── */
function SpecialtiesVisual() {
  const specs = [
    { label: "Cardiologia", dot: "bg-red-400" },
    { label: "Dermatologia", dot: "bg-amber-400" },
    { label: "Pediatria", dot: "bg-blue-400" },
    { label: "Ortopedia", dot: "bg-green-400" },
    { label: "Neurologia", dot: "bg-purple-400" },
    { label: "Ginecologia", dot: "bg-pink-400" },
    { label: "Oftalmologia", dot: "bg-cyan-400" },
    { label: "Psiquiatria", dot: "bg-orange-400" },
    { label: "Endocrinologia", dot: "bg-teal-400" },
    { label: "Urologia", dot: "bg-indigo-400" },
  ];
  return (
    <div className="w-full rounded-xl bg-[#1a1a1a] border border-[#242424] p-4 overflow-hidden flex-1 flex flex-col justify-center">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {specs.map((s, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full ${s.dot} shrink-0`} />
            <span className="text-[11px] text-white/60 font-inter">
              {s.label}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-white/[0.06] text-center">
        <span className="text-[10px] text-white/25 font-inter">
          + 8 especialidades
        </span>
      </div>
    </div>
  );
}

/* ─── Embedded visual: Schedule/Calendar ─── */
function ScheduleVisual() {
  const slots = [
    { time: "09:00", patient: "Maria S.", status: "confirmed" },
    { time: "10:30", patient: "João P.", status: "confirmed" },
    { time: "14:00", patient: "Ana L.", status: "pending" },
    { time: "15:30", patient: "Carlos R.", status: "confirmed" },
  ];
  return (
    <div className="w-full rounded-xl bg-[#1a1a1a] border border-[#242424] p-4 overflow-hidden flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-white/70 font-inter">
          Hoje — Agenda
        </span>
        <span className="text-[10px] text-white/30 font-inter">4 consultas</span>
      </div>
      <div className="space-y-2">
        {slots.map((slot, i) => (
          <div
            key={i}
            className="flex items-center gap-3 py-1.5 border-b border-white/[0.04] last:border-0"
          >
            <span className="text-[11px] text-white/30 font-mono w-10 shrink-0">
              {slot.time}
            </span>
            <span className="text-[11px] text-white/60 flex-1 font-inter">
              {slot.patient}
            </span>
            <div
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                slot.status === "confirmed"
                  ? "bg-accent-green"
                  : "bg-amber-400"
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Embedded visual: Financial invoices ─── */
function InvoiceVisual() {
  const invoices = [
    { name: "Consulta — Maria S.", amount: "R$ 350", status: "Pago", statusColor: "text-accent-green bg-accent-green/10" },
    { name: "Retorno — João P.", amount: "R$ 200", status: "Pago", statusColor: "text-accent-green bg-accent-green/10" },
    { name: "Exame — Ana L.", amount: "R$ 450", status: "Pendente", statusColor: "text-amber-400 bg-amber-400/10" },
    { name: "Consulta — Pedro M.", amount: "R$ 280", status: "Pago", statusColor: "text-accent-green bg-accent-green/10" },
  ];
  return (
    <div className="w-full rounded-xl bg-[#1a1a1a] border border-[#242424] px-4 py-3.5 overflow-hidden flex-1 flex flex-col">
      <p className="text-xs font-medium text-white/70 font-inter mb-3">
        Últimas movimentações
      </p>
      <div className="space-y-2.5 flex-1">
        {invoices.map((inv, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-white/50 font-inter truncate">
                {inv.name}
              </p>
            </div>
            <span className="text-[11px] font-medium text-white/70 font-inter shrink-0">
              {inv.amount}
            </span>
            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${inv.statusColor}`}>
              {inv.status}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between">
        <span className="text-[10px] text-white/30 font-inter">Total do dia</span>
        <span className="text-xs font-medium text-white/70 font-inter">R$ 1.280</span>
      </div>
    </div>
  );
}

/* ─── Main component ─── */
export default function FeaturesGrid() {
  return (
    <section
      id="funcionalidades"
      className="py-24 md:py-32 lg:py-40 px-4 bg-surface-1"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <SectionBadge>Funcionalidades</SectionBadge>
          <motion.h2
            {...fadeUp(0.1)}
            className="mt-5 font-manrope font-semibold text-white tracking-[-0.02em]"
            style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
          >
            Tudo que sua clínica precisa.
            <br className="hidden sm:block" />
            <span className="gradient-text"> Em um só lugar.</span>
          </motion.h2>
          <motion.p
            {...fadeUp(0.2)}
            className="mt-4 text-white/50 font-inter text-base sm:text-lg max-w-lg mx-auto"
          >
            Do agendamento à gestão financeira, com inteligência artificial.
          </motion.p>
        </div>

        {/* ── TOP ROW: small | large | small ── */}
        <div className="flex flex-col gap-5 md:gap-[30px]">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.8fr_1fr] gap-5 md:gap-[30px]">
            {/* Left small — Agenda inteligente */}
            <motion.div
              {...fadeUp(0)}
              className="card-elevated !rounded-[30px] overflow-hidden p-7 flex flex-col items-center text-center"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <IconCalendarCheck size={18} className="text-primary-light" />
              </div>
              <h3 className="font-manrope font-bold text-base text-white">
                Agenda inteligente
              </h3>
              <p className="mt-2 font-inter text-sm text-[#9b9ca1] leading-relaxed">
                Agendamento, remarcação e cancelamento online. Sem recepcionista
                sobrecarregada.
              </p>
              <div className="mt-5 w-full flex-1 flex flex-col">
                <ScheduleVisual />
              </div>
            </motion.div>

            {/* Center large — Main feature headline + analytics */}
            <motion.div
              {...fadeUp(0.1)}
              className="card-elevated !rounded-[30px] overflow-hidden px-8 pt-8 pb-6 flex flex-col items-center text-center"
            >
              <h3
                className="font-manrope font-bold text-white leading-tight tracking-tight"
                style={{ fontSize: "clamp(22px, 3vw, 28px)" }}
              >
                Potencialize sua clínica.
                <br />
                Hoje e amanhã.
              </h3>
              <p className="mt-3 font-inter text-[#828282] text-base leading-relaxed max-w-md">
                Traga harmonia para a gestão da sua clínica com IA e
                monitoramento em tempo real. Liberdade para sua equipe. Paz para
                você.
              </p>
              <div className="mt-5 w-full flex-1 flex flex-col">
                <AnalyticsVisual />
              </div>
            </motion.div>

            {/* Right small — Multi-especialidades */}
            <motion.div
              {...fadeUp(0.2)}
              className="card-elevated !rounded-[30px] overflow-hidden p-7 flex flex-col items-center text-center"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center mb-3">
                <IconStethoscope size={18} className="text-purple-300" />
              </div>
              <h3 className="font-manrope font-bold text-base text-white">
                Todas as especialidades
              </h3>
              <p className="mt-2 font-inter text-sm text-[#9b9ca1] leading-relaxed">
                Cardiologia, dermatologia, pediatria e mais. Adapta-se a qualquer
                porte.
              </p>
              <div className="mt-5 w-full flex-1 flex flex-col">
                <SpecialtiesVisual />
              </div>
            </motion.div>
          </div>

          {/* ── BOTTOM ROW: large | large ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-[30px]">
            {/* Left — Prontuário + Financeiro */}
            <motion.div
              {...fadeUp(0.1)}
              className="card-elevated !rounded-[30px] overflow-hidden p-8 flex flex-col"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center">
                  <IconNotes size={16} className="text-accent-blue" />
                </div>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <IconCoin size={16} className="text-amber-400" />
                </div>
              </div>
              <h3 className="mt-3 font-manrope font-bold text-xl md:text-2xl text-white leading-tight">
                Prontuário e financeiro integrados.
              </h3>
              <p className="mt-2 font-inter text-base text-[#828282] leading-relaxed max-w-lg">
                Histórico clínico completo com assinatura digital. Fluxo de
                caixa, TISS e relatórios — tudo em um lugar.
              </p>
              <div className="mt-5 flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl bg-[#1a1a1a] border border-[#242424] p-4 flex-1 flex flex-col">
                  <p className="text-[10px] uppercase tracking-wider text-white/30 font-inter mb-2">
                    Receita mensal
                  </p>
                  <p className="text-lg font-semibold text-white font-manrope">
                    R$ 47.850
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <IconArrowUpRight size={11} className="text-accent-green" />
                    <span className="text-[11px] text-accent-green font-inter font-medium">
                      +12%
                    </span>
                    <span className="text-[10px] text-white/25 font-inter">
                      vs. mês anterior
                    </span>
                  </div>
                  <div className="mt-3.5 pt-3 border-t border-white/[0.06] grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-white/30 font-inter">Consultas</p>
                      <p className="text-sm font-medium text-white/80 font-inter mt-0.5">128</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 font-inter">Ticket médio</p>
                      <p className="text-sm font-medium text-white/80 font-inter mt-0.5">R$ 374</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 font-inter">No-show</p>
                      <p className="text-sm font-medium text-white/80 font-inter mt-0.5">3.2%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 font-inter">Recebido</p>
                      <p className="text-sm font-medium text-white/80 font-inter mt-0.5">92%</p>
                    </div>
                  </div>
                </div>
                <InvoiceVisual />
              </div>
              {/* Trust badges */}
              <div className="mt-4 flex flex-wrap gap-2">
                {["TISS", "Assinatura Digital", "PDF/A"].map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent-blue/10 border border-accent-blue/20"
                  >
                    <IconCheck size={10} className="text-accent-blue" />
                    <span className="text-[10px] font-semibold text-accent-blue font-inter">
                      {badge}
                    </span>
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Right — WhatsApp IA + Segurança */}
            <motion.div
              {...fadeUp(0.2)}
              className="card-elevated !rounded-[30px] overflow-hidden p-8 flex flex-col"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <IconBrandWhatsapp size={16} className="text-green-400" />
                </div>
                <div className="w-8 h-8 rounded-lg bg-accent-green/10 flex items-center justify-center">
                  <IconShieldCheck size={16} className="text-accent-green" />
                </div>
              </div>
              <h3 className="mt-3 font-manrope font-bold text-xl md:text-2xl text-white leading-tight">
                IA no WhatsApp com segurança total.
              </h3>
              <p className="mt-2 font-inter text-base text-[#828282] leading-relaxed max-w-lg">
                Atendimento automatizado 24/7 com criptografia AES-256,
                auditoria completa e 100% conforme LGPD e CFM.
              </p>
              <div className="flex-1 flex flex-col">
                <WhatsAppVisual />
              </div>
              {/* Trust badges */}
              <div className="mt-4 flex flex-wrap gap-2">
                {["LGPD", "CFM", "AES-256"].map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent-green/10 border border-accent-green/20"
                  >
                    <IconCheck size={10} className="text-accent-green" />
                    <span className="text-[10px] font-semibold text-accent-green font-inter">
                      {badge}
                    </span>
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
