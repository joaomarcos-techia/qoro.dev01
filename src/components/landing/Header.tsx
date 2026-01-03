
"use client";

import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll(); 
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/#dor', label: 'A Dor' },
    { href: '/#solucao', label: 'A Solução' },
    { href: '/#casos', label: 'Estudos de Caso' },
    { href: '/#contato', label: 'Contato' },
  ];
  
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, href: string) => {
    if (href.startsWith('/#')) {
        e.preventDefault();
        setIsMenuOpen(false); 
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
    <header className={cn(
      "fixed w-full top-0 left-0 z-50 transition-all duration-300 ease-in-out",
      hasScrolled ? "py-2" : "py-4"
    )}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={cn(
          "rounded-full py-3 px-6 flex items-center justify-between transition-all duration-300 ease-in-out overflow-hidden border",
          hasScrolled ? "bg-black/50 backdrop-blur-lg border-white/10 shadow-lg" : "bg-transparent border-transparent"
        )}>
          <div className="flex-shrink-0">
            <Link href="/#home" onClick={(e) => handleLinkClick(e, '/#home')} className="text-xl">
              <Logo/>
            </Link>
          </div>
          
          <div className="hidden md:flex flex-1 justify-center">
            <nav className="flex items-center space-x-12">
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
              </nav>
          </div>
      )}
    </header>
  );
}
