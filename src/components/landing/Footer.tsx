
'use client';

import Link from 'next/link';
import { Linkedin, Twitter, Mail } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

const navLinks = [
  { href: '/#sobre', label: 'Sobre' },
  { href: '/#para-quem', label: 'Para Quem é?' },
  { href: '/#precos', label: 'Planos' },
  { href: '/#contato', label: 'Contato' },
];

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

export function Footer() {
  return (
    <footer id="footer" className="bg-black border-t border-white/10 pt-8 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8 mb-8">
          {/* Coluna da Logo e Descrição */}
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
          
          {/* Coluna de Empresa */}
          <div>
            <h3 className="text-sm font-semibold text-white/80 mb-4 tracking-wider uppercase">Empresa</h3>
            <ul className="space-y-3">
              <li><Link href="/politica-de-privacidade" className="text-white/60 hover:text-white transition-colors">Política de Privacidade</Link></li>
              <li><Link href="/termos-de-uso" className="text-white/60 hover:text-white transition-colors">Termos de Uso</Link></li>
            </ul>
          </div>
          
          {/* Coluna de Contato */}
          <div>
            <h3 className="text-sm font-semibold text-white/80 mb-4 tracking-wider uppercase">Contato</h3>
            <ul className="space-y-4">
              <li className="flex items-start text-white/60">
                <Mail className="mr-3 w-4 h-4 mt-1 text-primary flex-shrink-0" />
                <span>contato@qoro.com</span>
              </li>
              <li className="flex items-start text-white/60">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="mr-3 w-4 h-4 mt-1 text-primary flex-shrink-0">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.315 1.847 6.061l-1.107 4.024 4.13-1.082zM12.001 5.549c4.64 0 8.413 3.771 8.415 8.412.002 4.642-3.77 8.41-8.412 8.41-1.748 0-3.41-.539-4.816-1.54l-.359-.214-3.574.941.959-3.483.233-.372c-1.023-1.446-1.63-3.21-1.632-5.106.004-4.64 3.773-8.411 8.414-8.411zm-2.029 11.082c-.225-.113-1.327-.655-1.533-.73-.205-.075-.354-.112-.504.112s-.58.729-.711.879-.262.168-.486.056c-.225-.113-.944-.347-1.8-1.111-1.353-1.192-1.619-1.92-1.845-2.261-.225-.34-.124-.485.043-.634.135-.119.297-.309.447-.46.15-.151.2-.202.3-.338.099-.137.05-.25-.006-.363s-.504-1.217-.692-1.666c-.181-.435-.366-.377-.504-.383a.965.965 0 0 0-.428-.008.826.826 0 0 0-.599.28c-.205.225-.785.767-.785 1.871s.804 2.171.913 2.321c.11.15 1.582 2.415 3.832 3.387.536.231.954.368 1.279.473.537.175.983.149 1.355.09.42-.066 1.327-.542 1.514-1.066.187-.524.187-.973.131-1.067-.056-.094-.205-.15-.43-.263z"/>
                </svg>
                <span>(88) 99682-2198</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-6 mt-6 flex flex-col sm:flex-row justify-between items-center text-sm text-white/50">
          <p>&copy; {new Date().getFullYear()} Qoro. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
