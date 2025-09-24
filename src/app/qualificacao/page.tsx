
'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import Link from 'next/link';

export default function QualificationIntroPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4 text-center">
        <Link href="/" className="absolute top-8 left-8 text-3xl">
            <Logo />
        </Link>

      <div className="max-w-2xl">
        <div className="mx-auto mb-8">
            <Logo height={60} />
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Vamos encontrar a solução perfeita para você
        </h1>
        <p className="text-lg md:text-xl text-white/70 mb-10 leading-relaxed">
          Preencha este formulário de qualificação para que possamos entender melhor sua empresa, seus desafios e indicar a solução mais adequada às suas necessidades.
        </p>
        <Button 
          onClick={() => router.push('/qualificacao/form')}
          size="lg" 
          className="h-14 px-10 text-lg font-semibold group"
        >
          Começar
          <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </div>
  );
}
