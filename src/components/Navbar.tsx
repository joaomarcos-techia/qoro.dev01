import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useScrolled } from "../hooks/useScrolled";
import { useMagnetic } from "../hooks/useMagnetic";
import { IconMenu2, IconX, IconBrandWhatsapp } from "@tabler/icons-react";
import { useLeadForm } from "../contexts/LeadFormContext";

const navLinks = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Depoimentos", href: "#depoimentos" },
  { label: "Modelo de Negócio", href: "#pricing" },
];

export default function Navbar() {
  const scrolled = useScrolled(50);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { ref: magneticRef, handleMove, handleLeave } = useMagnetic(0.3);
  const { openLeadForm } = useLeadForm();

  return (
    <nav className="fixed top-0 inset-x-0 z-50 flex justify-center px-3 md:px-0">
      <motion.div
        className="flex items-center justify-between px-5 py-3 h-[56px]"
        style={{
          willChange:
            "max-width, background-color, border-radius, backdrop-filter",
        }}
        initial={false}
        animate={{
          maxWidth: scrolled ? "1100px" : "1280px",
          width: "100%",
          backgroundColor: scrolled
            ? "rgba(255, 255, 255, 0.06)"
            : "rgba(0, 0, 0, 0)",
          borderRadius: scrolled ? "12px" : "0px",
          borderWidth: scrolled ? "1px" : "0px",
          borderColor: scrolled
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(255, 255, 255, 0)",
          boxShadow: scrolled
            ? "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)"
            : "none",
          backdropFilter: scrolled ? "blur(20px) saturate(1.4)" : "blur(0px)",
          marginTop: "12px",
        }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Logo */}
        <a href="#" className="flex items-center">
          <img src="/logo-qoro.svg" alt="Qoro" className="h-6" />
        </a>

        {/* Nav Links — Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="relative font-inter font-medium text-sm text-white/70 leading-[1.3] hover:text-white transition-colors cursor-pointer
                         after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-px
                         after:w-0 after:bg-white after:transition-all after:duration-200
                         hover:after:w-full"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA Button — Desktop */}
        <button
          onClick={openLeadForm}
          className="hidden md:flex bg-[#FAFAFA] border border-[rgba(148,148,149,0.15)] rounded-full h-[36px] px-5 py-2 items-center justify-center cursor-pointer hover:shadow-[0_4px_16px_rgba(139,92,246,0.2)] transition-shadow duration-300"
        >
          <span className="font-inter font-semibold text-sm text-[#171719] leading-[1.6] tracking-[-0.192px]">
            Fale conosco
          </span>
        </button>

        {/* Hamburger — Mobile */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-white p-1 cursor-pointer bg-transparent border-none"
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
        >
          {mobileOpen ? (
            <IconX className="size-6" />
          ) : (
            <IconMenu2 className="size-6" />
          )}
        </button>
      </motion.div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setMobileOpen(false)}
            />
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed top-[68px] inset-x-0 mx-4 rounded-2xl bg-surface-2/95 backdrop-blur-xl border border-white/10 p-6 flex flex-col gap-1 z-50"
            >
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="font-inter font-medium text-base text-white/70 hover:text-white transition-colors py-2.5 px-2 rounded-lg hover:bg-white/5"
                >
                  {link.label}
                </motion.a>
              ))}
              <div className="border-t border-white/[0.06] pt-4 mt-3">
                <button
                  onClick={() => { setMobileOpen(false); openLeadForm(); }}
                  className="w-full flex items-center justify-center bg-[#FAFAFA] text-[#171719] rounded-full px-5 py-2.5 font-inter font-semibold text-sm cursor-pointer border-none"
                >
                  Fale conosco
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
