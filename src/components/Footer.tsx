import { useState } from "react";
import {
  IconBrandInstagram,
  IconArrowUp,
} from "@tabler/icons-react";
import LegalModal from "./LegalModal";

const produtoLinks = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Modelo de Negócio", href: "#pricing" },
  { label: "Depoimentos", href: "#depoimentos" },
];

const socialLinks = [
  {
    icon: IconBrandInstagram,
    href: "https://www.instagram.com/qoro.dev/",
    label: "Instagram",
  },
];

export default function Footer() {
  const [modal, setModal] = useState<"privacy" | "terms" | null>(null);

  return (
    <footer className="border-t border-white/[0.06] py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <a href="#">
              <img src="/logo-qoro.svg" alt="Qoro" className="h-6 mb-4" />
            </a>
            <p className="text-sm text-white/35 leading-relaxed max-w-[200px]">
              Gestão clínica inteligente com IA. Do agendamento ao financeiro.
            </p>
            <div className="flex gap-3 mt-5">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/30 hover:text-white/70 transition-colors cursor-pointer"
                  aria-label={social.label}
                >
                  <social.icon className="size-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Produto */}
          <div>
            <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-4 font-inter">
              Produto
            </h4>
            <ul className="space-y-3 list-none m-0 p-0">
              {produtoLinks.map((link) => (
                <li key={link.label} className="m-0 p-0">
                  <a
                    href={link.href}
                    className="text-sm text-white/35 hover:text-white/70 transition-colors font-inter"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-4 font-inter">
              Legal
            </h4>
            <ul className="space-y-3 list-none m-0 p-0">
              <li className="m-0 p-0">
                <button
                  onClick={() => setModal("privacy")}
                  className="text-sm text-white/35 hover:text-white/70 transition-colors cursor-pointer bg-transparent border-none p-0 font-inter"
                >
                  Privacidade
                </button>
              </li>
              <li className="m-0 p-0">
                <button
                  onClick={() => setModal("terms")}
                  className="text-sm text-white/35 hover:text-white/70 transition-colors cursor-pointer bg-transparent border-none p-0 font-inter"
                >
                  Termos de uso
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/25 font-inter">
            © {new Date().getFullYear()} Qoro. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <p className="text-xs text-white/20 font-inter">
              Feito com dedicação no Brasil
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="text-white/20 hover:text-white/50 transition-colors cursor-pointer bg-transparent border border-white/[0.06] rounded-full p-1.5"
              aria-label="Voltar ao topo"
            >
              <IconArrowUp size={14} />
            </button>
          </div>
        </div>
      </div>

      <LegalModal type={modal} onClose={() => setModal(null)} />
    </footer>
  );
}
