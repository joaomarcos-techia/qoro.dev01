
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
    <main className="flex h-screen items-center justify-center bg-[#110f1c] p-4 sm:p-8">
      <div className="flex h-full w-full max-w-6xl flex-col items-center justify-center md:grid md:grid-cols-2 md:gap-16">
        
        {/* Coluna da Imagem */}
        <div className="flex w-full justify-center md:order-last md:justify-end">
          <div className="relative h-auto w-full max-w-xs md:max-w-md">
            <Image
              src="https://firebasestorage.googleapis.com/v0/b/qoro-iy1gs.firebasestorage.app/o/mesh-gradient22.png?alt=media&token=675b8ae5-eb2b-486c-ad0c-2c0f2bd4db3c"
              alt="Gradiente abstrato com tons de roxo, rosa e azul"
              width={590}
              height={722}
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Coluna de Texto */}
        <div className="w-full max-w-xs flex h-full flex-col justify-center text-left md:order-first md:max-w-full md:text-left">
          <div className="flex-grow md:flex-grow-0"></div>
          <h1 className="text-4xl font-semibold leading-tight text-white md:text-[51px]">
            Aumente o seu faturamento com IA.
          </h1>
          <p className="font-normal text-base text-gray-300/80 my-6 max-w-lg mx-auto md:mx-0 md:text-[20px] md:mb-10">
            Desenvolvemos para você uma operação personalizada que atende, converte e fideliza.
          </p>
          <Button
            onClick={handleRedirect}
            disabled={isLoading}
            size="lg"
            className="w-full bg-[#8A2BE2] text-white hover:bg-[#7a25c1] rounded-full px-4 py-3 text-lg font-semibold transition-all duration-300 md:w-auto"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              'Entre em contato'
            )}
          </Button>
          <div className="flex-grow md:flex-grow-0"></div>
        </div>

      </div>
    </main>
  );
}
