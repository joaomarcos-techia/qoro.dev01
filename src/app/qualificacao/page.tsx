
'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import Link from 'next/link';
import { useState } from 'react';

export default function QualificationIntroPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = () => {
    setIsLoading(true);
    router.push('/qualificacao/form');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4 text-center">
        

      <div className="max-w-2xl text-center">
        <div className="flex justify-center mb-8">
            <Logo height={60} />
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Vamos encontrar a solução perfeita para sua clínica
        </h1>
        <p className="text-lg md:text-xl text-white/70 mb-10 leading-relaxed">
          Preencha este formulário rápido para que possamos entender os desafios da sua clínica e indicar a melhor solução para otimizar sua gestão e atendimento.
        </p>
        <Button 
          onClick={handleStart}
          disabled={isLoading}
          size="lg" 
          className="h-14 px-10 text-lg font-semibold group"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
              Carregando...
            </>
          ) : (
            <>
              Começar
              <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
