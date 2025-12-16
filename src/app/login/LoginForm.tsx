
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, LogIn, AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { signInAndCheckVerification, resendVerification, sendPasswordReset } from '@/lib/authService'; // Alterado para o novo serviço
import { Logo } from '@/components/ui/logo';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getAdminAndOrg } from '@/services/utils';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [userForResend, setUserForResend] = useState<FirebaseUser | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPaymentSuccess = searchParams.get('payment_success') === 'true';
  const isVerified = searchParams.get('verified') === 'true';
  const [isSyncing, setIsSyncing] = useState(isPaymentSuccess);


  useEffect(() => {
    if (isSyncing) {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // Inicia a sondagem para verificar se o perfil do usuário foi criado no banco de dados.
                const interval = setInterval(async () => {
                    try {
                        const profileData = await getAdminAndOrg(user.uid);
                        if (profileData) {
                            console.log("✅ Profile found! Redirecting to dashboard.");
                            clearInterval(interval);
                            await user.getIdToken(true);
                            router.push('/dashboard');
                        } else {
                            console.log("⏳ Profile not found yet, polling...");
                        }
                    } catch (e) {
                         console.error("Error polling for user profile:", e);
                    }
                }, 3000); 

                const timeout = setTimeout(() => {
                    clearInterval(interval);
                    if (isSyncing) {
                        setError("A sincronização está demorando mais que o esperado. Tente fazer login manualmente em alguns instantes.");
                        setIsSyncing(false);
                    }
                }, 45000); 

                return () => {
                    clearInterval(interval)
                    clearTimeout(timeout);
                }; 
            }
        });
        return () => {
            if(unsubscribe) unsubscribe();
        };
    }
  }, [isSyncing, router]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowResend(false);
    setResendSuccess(null);
    setUserForResend(null);
    setIsLoading(true);
  
    try {
      await signInAndCheckVerification(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/email-not-verified') {
        setError(err.message);
        setUserForResend(err.user); // Pega o objeto 'user' do erro customizado
        setShowResend(true);
      } else {
        setError(err.message || 'Ocorreu um erro desconhecido.');
      }
    } finally {
        setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!userForResend) {
        setError('Não foi possível identificar o usuário para o reenvio. Tente fazer login novamente.');
        return;
    }
    setError(null);
    setResendSuccess(null);
    setIsResending(true);
    
    try {
        await resendVerification(userForResend);
        setResendSuccess('Um novo e-mail de verificação foi enviado. Verifique sua caixa de entrada e spam.');
        setShowResend(false);
    } catch (err: any) {
        setError(err.message || 'Falha ao reenviar o e-mail de verificação.');
    } finally {
        setIsResending(false);
    }
  }

  if (isSyncing) {
    return (
        <main className="flex items-center justify-center min-h-screen bg-black p-4">
            <div className="w-full max-w-md mx-auto bg-card rounded-2xl border border-border p-8 md:p-12 text-center">
                <RefreshCw className="w-12 h-12 text-primary mx-auto animate-spin mb-6"/>
                <h2 className="text-2xl font-bold text-foreground mb-4">Pagamento confirmado!</h2>
                <p className="text-muted-foreground">Estamos sincronizando sua conta e preparando tudo para o primeiro acesso. Você será redirecionado em instantes.</p>
                 {error && (
                    <div className="mt-6 bg-destructive/20 border-l-4 border-destructive text-destructive-foreground p-4 rounded-lg flex items-center text-sm text-left">
                        <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                        <div>{error}</div>
                    </div>
                 )}
            </div>
        </main>
    );
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
        
        {isVerified && (
             <div className="mb-4 bg-green-800/20 border-l-4 border-green-500 text-green-300 p-4 rounded-lg flex items-center text-sm">
              <CheckCircle className="w-5 h-5 mr-3" />
              <span>E-mail verificado com sucesso! Você já pode fazer o login.</span>
            </div>
          )}

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
            <div className="bg-destructive/20 border-l-4 border-destructive text-destructive-foreground p-4 rounded-lg flex items-start text-sm">
              <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                {error}
                {showResend && (
                    <button type="button" onClick={handleResendVerification} className="font-bold underline hover:text-white mt-2 block disabled:opacity-50" disabled={isResending}>
                       {isResending ? <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" /> : null}
                        {isResending ? 'Reenviando...' : 'Reenviar e-mail de verificação'}
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
