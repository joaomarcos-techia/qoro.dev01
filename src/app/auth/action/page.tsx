
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { handleActionCode } from '@/lib/authService';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

function ActionHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState('Processando sua solicitação...');
  const [error, setError] = useState('');

  useEffect(() => {
    const actionCode = searchParams.get('oobCode');
    
    if (actionCode) {
      handleActionCode(actionCode)
        .then((redirectUrl) => {
          setMessage('Ação concluída! Redirecionando...');
          router.push(redirectUrl);
        })
        .catch(() => {
          setError('O link de ação é inválido ou já expirou. Por favor, tente novamente.');
          // Optional: redirect to login with error after a delay
          setTimeout(() => router.push('/login?error=invalid_link'), 3000);
        });
    } else {
       // If there's no code, maybe redirect to login page
       router.push('/login');
    }
  }, [searchParams, router]);

  return (
    <main className="flex items-center justify-center min-h-screen bg-black p-4">
      <div className="w-full max-w-md mx-auto bg-card rounded-2xl border border-border p-8 md:p-12 text-center">
        <Logo className="mx-auto mb-8" />
        {error ? (
          <>
            <h2 className="text-2xl font-bold text-destructive mb-4">Erro na Verificação</h2>
            <p className="text-muted-foreground">{error}</p>
          </>
        ) : (
          <>
            <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-foreground">{message}</h2>
          </>
        )}
      </div>
    </main>
  );
}

export default function ActionPage() {
    return (
        <Suspense fallback={
            <main className="flex items-center justify-center min-h-screen bg-black p-4">
              <div className="w-full max-w-md mx-auto bg-card rounded-2xl border border-border p-8 md:p-12 text-center">
                <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin mb-6" />
                <h2 className="text-2xl font-bold text-foreground">Carregando...</h2>
              </div>
            </main>
        }>
            <ActionHandler />
        </Suspense>
    )
}
