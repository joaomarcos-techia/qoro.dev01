import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconX, IconCheck, IconBrandWhatsapp, IconChevronDown } from "@tabler/icons-react";
import { useLeadForm } from "../contexts/LeadFormContext";

/* ─── Options ─── */
const CLINIC_TYPES = [
  "Clínica de Estética",
  "Clínica Odontológica",
  "Clínica de Dermatologia",
  "Clínica de Fisioterapia",
  "Outra",
];

const VOLUME_OPTIONS = [
  "Menos de 50",
  "Entre 50 e 150",
  "Entre 150 e 400",
  "Mais de 400",
];

const DIFFICULTY_OPTIONS = [
  "Pacientes que somem após o primeiro contato",
  "Falta de follow-up e reativação de pacientes",
  "Agenda com muitos buracos e cancelamentos",
  "Captação e conversão de novos pacientes",
  "Gestão manual e operação sobrecarregada",
];

/* ─── Phone mask ─── */
function applyPhoneMask(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function rawDigits(masked: string): string {
  return masked.replace(/\D/g, "");
}

/* ─── Types ─── */
interface FormData {
  nome: string;
  whatsapp: string;
  tipoClinica: string;
  atendimentos: string;
  dificuldade: string;
}

type FormStatus = "filling" | "success";

const initial: FormData = {
  nome: "",
  whatsapp: "",
  tipoClinica: "",
  atendimentos: "",
  dificuldade: "",
};

/* ─── Animations ─── */
const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const panel = {
  hidden: { opacity: 0, scale: 0.95, y: 24 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", damping: 28, stiffness: 350 } },
  exit: { opacity: 0, scale: 0.97, y: 12, transition: { duration: 0.2 } },
};

const slideForward = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -60, transition: { duration: 0.2 } },
};

const slideBack = {
  initial: { opacity: 0, x: -60 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: 60, transition: { duration: 0.2 } },
};

/* ─── Custom Select ─── */
function CustomSelect({
  value,
  options,
  placeholder,
  onChange,
  onBlur,
  error,
}: {
  value: string;
  options: string[];
  placeholder: string;
  onChange: (val: string) => void;
  onBlur: () => void;
  error?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        onBlur();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onBlur]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); onBlur(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onBlur]);

  const toggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < 260);
    }
    setOpen(!open);
  };

  return (
    <div ref={ref} className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className={`form-input w-full text-left flex items-center justify-between cursor-pointer ${
          !value ? "text-white/35" : "text-white"
        } ${open ? "border-primary shadow-[0_0_0_3px_rgba(139,92,246,0.15)]" : ""} ${
          error ? "border-destructive/50" : ""
        }`}
        aria-required="true"
        aria-invalid={error}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="truncate">{value || placeholder}</span>
        <IconChevronDown
          size={16}
          className={`shrink-0 transition-transform duration-200 ${
            open ? "rotate-180 text-primary" : "text-white/40"
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: dropUp ? 4 : -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropUp ? 4 : -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            role="listbox"
            className={`absolute z-50 w-full rounded-xl border border-white/10 bg-[hsl(260_15%_10%)] shadow-[0_16px_48px_rgba(0,0,0,0.5)] overflow-hidden list-none m-0 p-1 max-h-[220px] overflow-y-auto ${
              dropUp ? "bottom-full mb-1.5" : "top-full mt-1.5"
            }`}
          >
            {options.map((opt) => (
              <li
                key={opt}
                role="option"
                aria-selected={value === opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`px-3 py-2.5 text-sm font-inter rounded-lg cursor-pointer transition-colors duration-150 ${
                  value === opt
                    ? "bg-primary/15 text-primary-light"
                    : "text-white/70 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {opt}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Component ─── */
export default function LeadForm() {
  const { isOpen, closeLeadForm } = useLeadForm();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [status, setStatus] = useState<FormStatus>("filling");
  const [data, setData] = useState<FormData>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const modalRef = useRef<HTMLDivElement>(null);

  /* Reset on close */
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(1);
        setDirection("forward");
        setStatus("filling");
        setData(initial);
        setErrors({});
        setTouched({});
      }, 300);
    }
  }, [isOpen]);

  /* Body scroll lock */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isOpen]);

  /* ESC key */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLeadForm();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, closeLeadForm]);

  /* ─── Validation ─── */
  const validate = useCallback((fields: (keyof FormData)[]): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    for (const f of fields) {
      if (f === "nome" && data.nome.trim().length < 2) {
        newErrors.nome = "Informe seu nome completo";
      }
      if (f === "whatsapp" && rawDigits(data.whatsapp).length !== 11) {
        newErrors.whatsapp = "Informe um número válido com DDD";
      }
      if (f === "tipoClinica" && !data.tipoClinica) {
        newErrors.tipoClinica = "Selecione o tipo de clínica";
      }
      if (f === "atendimentos" && !data.atendimentos) {
        newErrors.atendimentos = "Selecione o volume de atendimentos";
      }
      if (f === "dificuldade" && !data.dificuldade) {
        newErrors.dificuldade = "Selecione sua maior dificuldade";
      }
    }
    setErrors((prev) => ({ ...prev, ...newErrors }));
    for (const f of fields) {
      if (!newErrors[f]) setErrors((prev) => { const n = { ...prev }; delete n[f]; return n; });
    }
    return Object.keys(newErrors).length === 0;
  }, [data]);

  const handleBlur = (field: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate([field]);
  };

  /* ─── Handlers ─── */
  const goNext = () => {
    const step1Fields: (keyof FormData)[] = ["nome", "whatsapp", "tipoClinica"];
    setTouched({ nome: true, whatsapp: true, tipoClinica: true });
    if (!validate(step1Fields)) return;
    setDirection("forward");
    setStep(2);
  };

  const goBack = () => {
    setDirection("back");
    setStep(1);
  };

  const handleSubmit = () => {
    const step2Fields: (keyof FormData)[] = ["atendimentos", "dificuldade"];
    setTouched((prev) => ({ ...prev, atendimentos: true, dificuldade: true }));
    if (!validate(step2Fields)) return;

    setStatus("success");

    const message = encodeURIComponent(
      `Olá! Me chamo ${data.nome.trim()}, tenho uma ${data.tipoClinica} e realizamos ${data.atendimentos} atendimentos por mês. Minha maior dificuldade hoje é: ${data.dificuldade}. Quero entender como a automação pode me ajudar.`
    );

    setTimeout(() => {
      window.open(`https://wa.me/5588996822198?text=${message}`, "_blank");
      closeLeadForm();
    }, 2000);
  };

  const update = (field: keyof FormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setTimeout(() => validate([field]), 0);
    }
  };

  const variants = direction === "forward" ? slideForward : slideBack;

  /* ─── Render ─── */
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          variants={backdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.25 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeLeadForm}
          />

          {/* Panel */}
          <motion.div
            ref={modalRef}
            variants={panel}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-md bg-[hsl(260_20%_7%)] border border-white/10 rounded-2xl overflow-visible shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Formulário de contato"
          >
            {/* Close */}
            <button
              onClick={closeLeadForm}
              className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors cursor-pointer z-10 bg-transparent border-none p-1"
              aria-label="Fechar"
            >
              <IconX size={20} />
            </button>

            <AnimatePresence mode="wait">
              {status === "filling" ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  className="p-6 sm:p-8"
                >
                  {/* Header */}
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-white font-geist mb-1">
                      Fale com a Qoro
                    </h2>
                    <p className="text-sm text-white/45 font-inter">
                      Preencha para falar com um especialista
                    </p>
                  </div>

                  {/* Progress */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/50 font-inter">
                        Passo {step} de 2
                      </span>
                      <span className="text-xs text-primary font-inter font-medium">
                        {step === 1 ? "Seus dados" : "Sobre sua clínica"}
                      </span>
                    </div>
                    <div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={false}
                        animate={{ width: step === 1 ? "50%" : "100%" }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                      />
                    </div>
                  </div>

                  {/* Steps */}
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div
                        key="step1"
                        variants={variants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="space-y-4"
                      >
                        {/* Nome */}
                        <FieldGroup
                          label="Nome completo"
                          error={touched.nome ? errors.nome : undefined}
                        >
                          <input
                            type="text"
                            value={data.nome}
                            onChange={(e) => update("nome", e.target.value.slice(0, 100))}
                            onBlur={() => handleBlur("nome")}
                            placeholder="Seu nome"
                            className="form-input"
                            aria-required="true"
                            aria-invalid={!!errors.nome}
                            autoFocus
                          />
                        </FieldGroup>

                        {/* WhatsApp */}
                        <FieldGroup
                          label="WhatsApp com DDD"
                          error={touched.whatsapp ? errors.whatsapp : undefined}
                        >
                          <input
                            type="tel"
                            inputMode="tel"
                            value={data.whatsapp}
                            onChange={(e) => update("whatsapp", applyPhoneMask(e.target.value))}
                            onBlur={() => handleBlur("whatsapp")}
                            placeholder="(85) 99999-9999"
                            className="form-input"
                            aria-required="true"
                            aria-invalid={!!errors.whatsapp}
                          />
                        </FieldGroup>

                        {/* Tipo de clínica */}
                        <FieldGroup
                          label="Tipo de clínica"
                          error={touched.tipoClinica ? errors.tipoClinica : undefined}
                        >
                          <CustomSelect
                            value={data.tipoClinica}
                            options={CLINIC_TYPES}
                            placeholder="Selecione..."
                            onChange={(val) => update("tipoClinica", val)}
                            onBlur={() => handleBlur("tipoClinica")}
                            error={!!errors.tipoClinica && touched.tipoClinica}
                          />
                        </FieldGroup>

                        <button
                          onClick={goNext}
                          className="w-full mt-2 bg-primary hover:bg-primary-light text-white font-semibold rounded-xl px-6 py-3.5 text-sm transition-all duration-200 hover:scale-[1.02] cursor-pointer border-none font-inter"
                        >
                          Continuar →
                        </button>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div
                        key="step2"
                        variants={variants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="space-y-4"
                      >
                        {/* Atendimentos */}
                        <FieldGroup
                          label="Quantos atendimentos por mês sua clínica realiza?"
                          error={touched.atendimentos ? errors.atendimentos : undefined}
                        >
                          <CustomSelect
                            value={data.atendimentos}
                            options={VOLUME_OPTIONS}
                            placeholder="Selecione..."
                            onChange={(val) => update("atendimentos", val)}
                            onBlur={() => handleBlur("atendimentos")}
                            error={!!errors.atendimentos && touched.atendimentos}
                          />
                        </FieldGroup>

                        {/* Dificuldade */}
                        <FieldGroup
                          label="Qual é sua maior dificuldade hoje?"
                          error={touched.dificuldade ? errors.dificuldade : undefined}
                        >
                          <CustomSelect
                            value={data.dificuldade}
                            options={DIFFICULTY_OPTIONS}
                            placeholder="Selecione..."
                            onChange={(val) => update("dificuldade", val)}
                            onBlur={() => handleBlur("dificuldade")}
                            error={!!errors.dificuldade && touched.dificuldade}
                          />
                        </FieldGroup>

                        <button
                          onClick={handleSubmit}
                          className="w-full mt-2 bg-primary hover:bg-primary-light text-white font-semibold rounded-xl px-6 py-3.5 text-sm transition-all duration-200 hover:scale-[1.02] cursor-pointer border-none font-inter flex items-center justify-center gap-2"
                        >
                          Quero automatizar minha clínica →
                        </button>

                        <button
                          onClick={goBack}
                          className="w-full text-white/40 hover:text-white/70 text-sm bg-transparent border-none py-2 cursor-pointer transition-colors font-inter"
                        >
                          ← Voltar
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Bottom texts */}
                  <div className="mt-6 space-y-2 text-center">
                    <p className="text-[11px] text-white/30 font-inter">
                      Atendemos apenas 5 novas clínicas por mês para garantir resultados.
                    </p>
                    <p className="text-[11px] text-white/25 font-inter">
                      🔒 Suas informações são 100% seguras. Sem spam.
                    </p>
                  </div>
                </motion.div>
              ) : (
                /* Success state */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-8 sm:p-10 flex flex-col items-center text-center"
                >
                  <motion.div
                    className="w-16 h-16 rounded-full bg-accent-green/20 flex items-center justify-center mb-5"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 15, stiffness: 300, delay: 0.1 }}
                  >
                    <IconCheck size={32} className="text-accent-green" />
                  </motion.div>
                  <motion.h3
                    className="text-xl font-semibold text-white font-geist mb-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    Obrigado, {data.nome.split(" ")[0]}!
                  </motion.h3>
                  <motion.p
                    className="text-sm text-white/50 font-inter mb-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Redirecionando para o WhatsApp...
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <IconBrandWhatsapp size={24} className="text-accent-green/60" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Field wrapper ─── */
function FieldGroup({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-white/60 mb-1.5 font-inter">
        {label}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-[11px] text-destructive mt-1 font-inter"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
