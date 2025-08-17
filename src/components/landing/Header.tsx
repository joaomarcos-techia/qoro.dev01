
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/#home', label: 'Início' },
    { href: '/#produtos', label: 'Soluções' },
    { href: '/#sobre', label: 'Sobre' },
    { href: '/#precos', label: 'Planos' },
    { href: '/#contato', label: 'Contato' },
    { href: 'http://bit.ly/41Emn3C', label: 'Serviços' },
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


  if (pathname !== '/') {
    return null;
  }

  return (
    <header className="fixed w-full top-0 left-0 z-50 transition-all duration-300 ease-in-out py-4 bg-black/50 backdrop-blur-lg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-full py-3 px-6 flex items-center justify-between shadow-lg border border-border transition-all duration-300 ease-in-out">
          <div className="flex items-center">
            <Link href="/#home" onClick={(e) => handleLinkClick(e, '/#home')} className="text-xl font-bold text-white">
              Qoro
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            {navLinks.map(link => (
              <a 
                key={link.href} 
                href={link.href} 
                onClick={(e) => handleLinkClick(e, link.href)}
                target={link.href.startsWith('http') ? '_blank' : '_self'}
                rel={link.href.startsWith('http') ? 'noopener noreferrer' : ''}
                className="text-gray-300 hover:text-white text-sm transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <Link href="/login">
              <div className="hidden md:block bg-primary text-primary-foreground px-5 py-2 rounded-full font-medium text-sm transition-all duration-300 ease-in-out hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 hover:scale-105">
                  Entrar
              </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
