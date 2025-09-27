'use client';

import Link from 'next/link';
import { Linkedin, Twitter, Mail } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { useState } from 'react';
import { LegalPopup } from './LegalPopup';

export function Footer() {
  const [popupContent, setPopupContent] = useState<'terms' | 'policy' | null>(null);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, href: string) => {
    if (href.startsWith('/#')) {
      e.preventDefault();
      const targetId = href.substring(2);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 100,
          behavior: 'smooth'
        });
      }
    }
  };

  return (
    <>
      <footer id="footer" className="bg-black border-t border-white/10 pt-8 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8 mb-8">
            <div className="lg:col-span-2">
              <Link href="/#home" onClick={(e) => handleLinkClick(e, '/#home')}>
                <Logo height={32} />
              </Link>
              <p className="text-white/60 mt-4 mb-2 leading-relaxed max-w-sm">
                O fim da desorganização. O começo da clareza.
              </p>
              <p className="text-white/40 text-sm mt-2 mb-6">
                CNPJ: 61.698.053/0001-12
              </p>
              <div className="flex space-x-2">
                <a href="#" className="text-white/60 hover:text-primary transition-colors p-2 rounded-xl" aria-label="LinkedIn">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="text-white/60 hover:text-primary transition-colors p-2 rounded-xl" aria-label="Twitter">
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-white/80 mb-4 tracking-wider uppercase">Empresa</h3>
              <ul className="space-y-3">
                <li><button onClick={() => setPopupContent('policy')} className="text-white/60 hover:text-white transition-colors text-left">Política de Privacidade</button></li>
                <li><button onClick={() => setPopupContent('terms')} className="text-white/60 hover:text-white transition-colors text-left">Termos de Uso</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-white/80 mb-4 tracking-wider uppercase">Contato</h3>
              <ul className="space-y-4">
                <li className="flex items-start text-white/60">
                  <Mail className="mr-3 w-4 h-4 mt-1 text-primary flex-shrink-0" />
                  <span>contato@qoro.com</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-6 mt-6 flex flex-col sm:flex-row justify-between items-center text-sm text-white/50">
            <p>&copy; {new Date().getFullYear()} Qoro. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
      <LegalPopup content={popupContent} onOpenChange={(isOpen) => !isOpen && setPopupContent(null)} />
    </>
  );
}
