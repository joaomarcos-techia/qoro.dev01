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
    <header className="fixed w-full top-0 left-0 z-50 transition-all duration-300 ease-in-out py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#18191B]/80 backdrop-blur-lg rounded-full py-3 px-6 flex items-center justify-between shadow-lg border border-[#24262D] transition-all duration-300 ease-in-out">
          <div className="flex items-center">
            <Link href="/#home" onClick={(e) => handleLinkClick(e, '/#home')} className="text-xl font-bold text-white">
              Qoro
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} onClick={(e) => handleLinkClick(e, link.href)} className="text-gray-300 hover:text-white text-sm transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>

          <Link href="/login">
              <div className="hidden md:block bg-blue-600 text-white px-5 py-2 rounded-full font-medium text-sm transition-all duration-300 ease-in-out hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 hover:scale-105">
                  Entrar
              </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
