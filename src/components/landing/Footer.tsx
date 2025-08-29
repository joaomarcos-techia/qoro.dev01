'use client';

import { Linkedin, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { useState, useEffect } from 'react';

export function Footer() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <footer id="contato" className="bg-black border-t border-white/10 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4 text-xl">
                <Logo />
            </div>
            <p className="text-white/60 mb-6 leading-relaxed">
              O fim da desorganização. O começo da clareza.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white/60 hover:text-primary transition-colors p-2 rounded-xl" aria-label="LinkedIn">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/60 hover:text-primary transition-colors p-2 rounded-xl" aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Soluções</h3>
            <ul className="space-y-3">
              <li><a href="#produtos" className="text-white/60 hover:text-white transition-colors">QoroCRM</a></li>
              <li><a href="#produtos" className="text-white/60 hover:text-white transition-colors">QoroPulse</a></li>
              <li><a href="#produtos" className="text-white/60 hover:text-white transition-colors">QoroTask</a></li>
              <li><a href="#produtos" className="text-white/60 hover:text-white transition-colors">QoroFinance</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Empresa</h3>
            <ul className="space-y-3">
              <li><a href="#sobre" className="text-white/60 hover:text-white transition-colors">Sobre nós</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors">Carreiras</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors">Blog</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contato</h3>
            <ul className="space-y-3">
              <li className="flex items-center text-white/60">
                <Mail className="mr-3 w-4 h-4 text-primary" />
                contato@qoro.com
              </li>
              <li className="flex items-center text-white/60">
                <Phone className="mr-3 w-4 h-4 text-primary" />
                {isMounted && '(88) 99682-2198'}
              </li>
              <li className="flex items-center text-white/60">
                <MapPin className="mr-3 w-4 h-4 text-primary" />
                Ceará, Brasil
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 text-center text-white/60">
          <p>&copy; 2025 Qoro. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
