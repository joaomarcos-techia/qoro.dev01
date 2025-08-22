"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/logo';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: '/#home', label: 'Início' },
    { href: '/#sobre', label: 'Sobre' },
    { href: '/#precos', label: 'Planos' },
    { href: '/#servicos', label: 'Serviços' },
    { href: '/#contato', label: 'Contato' },
  ];
  
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, href: string) => {
    if (href.startsWith('/#')) {
        e.preventDefault();
        setIsMenuOpen(false); // Close mobile menu on link click
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
    <header className="fixed w-full top-0 left-0 z-50 transition-all duration-300 ease-in-out py-4">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-full py-3 px-6 flex items-center justify-between shadow-lg border border-border bg-black/50 backdrop-blur-lg transition-all duration-300 ease-in-out overflow-hidden">
          <div className="flex-shrink-0">
            <Link href="/#home" onClick={(e) => handleLinkClick(e, '/#home')} className="text-xl">
              <Logo/>
            </Link>
          </div>
          
          <nav className="hidden md:flex flex-1 justify-center items-center space-x-16">
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
          
          <div className="hidden md:flex flex-shrink-0">
             <Link href="/login">
                <div className="bg-primary text-primary-foreground px-5 py-2 rounded-full font-medium text-sm transition-all duration-300 ease-in-out hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 hover:scale-105">
                    Entrar
                </div>
            </Link>
          </div>

          <div className="flex items-center gap-4 md:hidden">
            <button
                className="md:hidden text-white"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
            >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      {/* Mobile Menu */}
      {isMenuOpen && (
          <div className="md:hidden mt-2 mx-4 rounded-xl bg-black/80 backdrop-blur-lg border border-border p-4">
              <nav className="flex flex-col space-y-4 text-center">
                  {navLinks.map(link => (
                      <a 
                          key={link.href} 
                          href={link.href} 
                          onClick={(e) => handleLinkClick(e, link.href)}
                          className="text-gray-300 hover:text-white text-base py-2"
                      >
                          {link.label}
                      </a>
                  ))}
                   <Link href="/login">
                        <div className="w-full bg-primary text-primary-foreground mt-2 py-2.5 rounded-full font-medium text-sm">
                            Entrar
                        </div>
                    </Link>
              </nav>
          </div>
      )}
    </header>
  );
}
