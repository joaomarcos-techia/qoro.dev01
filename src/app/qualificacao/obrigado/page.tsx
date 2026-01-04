
'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home } from 'lucide-react';

export default function ThankYouPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-8 text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-8 inline-block rounded-full bg-green-500/10 p-5 border border-green-500/20">
            <CheckCircle className="h-12 w-12 text-green-400" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Obrigado!
        </h1>
        <p className="text-lg text-white/70 mb-10 leading-relaxed">
            Recebemos suas respostas. Nossa equipe de especialistas em gestão de clínicas irá analisá-las e entrará em contato em breve.
        </p>
      </div>
    </div>
  );
}
