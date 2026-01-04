
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleRedirect = () => {
    setIsLoading(true);
    router.push('/qualificacao');
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-[#110f1c] p-4 sm:p-8">
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
        
        {/* Coluna de Texto */}
        <div className="text-center md:text-left animate-fade-in-up">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Aumente o seu faturamento com IA.
          </h1>
          <p className="text-lg sm:text-xl text-gray-300/80 mb-10 max-w-lg mx-auto md:mx-0">
            Desenvolvemos para você uma operação personalizada que atende, converte e fideliza.
          </p>
          <Button
            onClick={handleRedirect}
            disabled={isLoading}
            size="lg"
            className="bg-[#8A2BE2] text-white hover:bg-[#7a25c1] rounded-full px-10 py-6 text-lg font-semibold transition-all duration-300 shadow-lg shadow-[#8A2BE2]/20 hover:shadow-[#8A2BE2]/40"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              'Entre em contato'
            )}
          </Button>
        </div>

        {/* Coluna da Imagem */}
        <div className="flex justify-center md:justify-end animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="relative w-full max-w-md h-auto aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-purple-900/20">
            <Image
              src="https://firebasestorage.googleapis.com/v0/b/qoro-iy1gs.firebasestorage.app/o/mesh-gradient22.png?alt=media&token=675b8ae5-eb2b-486c-ad0c-2c0f2bd4db3c"
              alt="Gradiente abstrato com tons de roxo, rosa e azul"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        </div>
      </div>
    </main>
  );
}
