"use client";

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '#home', label: 'Início' },
    { href: '#produtos', label: 'Soluções' },
    { href: '#sobre', label: 'Sobre nós' },
    { href: '#precos', label: 'Planos' },
    { href: '#contato', label: 'Contato' },
  ];
  
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    const targetId = e.currentTarget.getAttribute('href');
    if(targetId) {
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80, // Adjust for header height
          behavior: 'smooth'
        });
      }
    }
    setIsMenuOpen(false);
  };

  return (
    <header className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-neumorphism' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <a href="#home" onClick={handleLinkClick} className="text-2xl lg:text-3xl font-bold text-black">Qoro</a>
            </div>
          </div>
          
          <nav className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navLinks.map(link => (
                <a key={link.href} href={link.href} onClick={handleLinkClick} className="text-gray-700 hover:text-primary px-3 py-2 text-sm font-medium transition-colors">
                  {link.label}
                </a>
              ))}
            </div>
          </nav>

          <div className="hidden md:block">
            <button className="bg-gray-800 text-white px-6 py-2 rounded-xl hover:bg-gray-700 transition-all duration-300 shadow-neumorphism hover:shadow-neumorphism-hover">
              Entrar
            </button>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-black p-2 rounded-xl hover:shadow-neumorphism-inset transition-all duration-300"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-neumorphism">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map(link => (
              <a 
                key={link.href} 
                href={link.href} 
                onClick={handleLinkClick}
                className="text-gray-700 hover:text-primary block px-3 py-2 text-base font-medium rounded-xl hover:bg-gray-50 transition-all duration-300"
              >
                {link.label}
              </a>
            ))}
            <div className="px-3 py-2">
              <button className="w-full bg-gray-800 text-white px-6 py-2 rounded-xl hover:bg-gray-700 transition-all duration-300 shadow-neumorphism hover:shadow-neumorphism-hover">
                Entrar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
