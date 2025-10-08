'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, LogIn, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { signIn, sendPasswordResetEmail } from '@/lib/auth';
import { Logo } from '@/components/ui/logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowResend(false);
    setResendSuccess(null);
    setIsLoading(true);

    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      if ((err as any).code === 'auth/email-not-verified') {
        setError('Seu e-mail ainda não foi verificado.');
        setShowResend(true);
      } else {
        setError(err.message || 'Ocorreu um erro desconhecido. Tente novamente.');
      }
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError(null);
    setIsLoading(true);
    try {
        // Firebase uses the password reset flow to also handle verification for new accounts
        await sendPasswordResetEmail(email);
        setResendSuccess('Um novo e-mail de verificação/configuração de conta foi enviado. Verifique sua caixa de entrada.');
        setShowResend(false);
    } catch (err: any) {
        setError(err.message);
    }
    setIsLoading(false);
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-black p-4">
      <div className="w-full max-w-md mx-auto bg-card rounded-2xl border border-border p-8 md:p-12">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-2 text-3xl">
            <Logo />
          </Link>
          <p className="text-muted-foreground">Bem-vindo de volta! Faça login para continuar.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-12 pr-4 py-3 bg-input rounded-xl border-border focus:ring-2 focus:ring-primary transition-all duration-200"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-12 pr-4 py-3 bg-input rounded-xl border-border focus:ring-2 focus:ring-primary transition-all duration-200"
            />
          </div>

          {error && (
            <div className="bg-destructive/20 border-l-4 border-destructive text-destructive-foreground p-4 rounded-lg flex items-center text-sm">
              <AlertCircle className="w-5 h-5 mr-3" />
              <div>
                {error}
                {showResend && (
                    <button type="button" onClick={handleResendVerification} className="font-bold underline hover:text-white mt-1 block">
                        Reenviar e-mail de verificação
                    </button>
                )}
              </div>
            </div>
          )}

          {resendSuccess && (
             <div className="bg-green-800/20 border-l-4 border-green-500 text-green-300 p-4 rounded-lg flex items-center text-sm">
              <CheckCircle className="w-5 h-5 mr-3" />
              <span>{resendSuccess}</span>
            </div>
          )}


          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl hover:bg-primary/90 transition-all duration-200 border border-transparent hover:border-primary/50 flex items-center justify-center font-semibold disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <LogIn className="mr-2 w-5 h-5" />
            )}
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Não tem uma conta?{' '}
            <Link href="/#precos">
              <span className="font-medium text-primary hover:underline">
                Crie uma agora
              </span>
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
