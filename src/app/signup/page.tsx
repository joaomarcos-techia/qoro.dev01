'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Briefcase, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { signUp } from '@/lib/auth';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setIsLoading(false);
      return;
    }

    try {
      await signUp(name, organization, email, password);
      setSuccess('Conta criada! Enviamos um e-mail de verificação para você. Por favor, verifique sua caixa de entrada.');
      // Optionally redirect after a delay
      // setTimeout(() => router.push('/login'), 5000);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso. Tente fazer login.');
      } else {
        setError('Ocorreu um erro ao criar a conta. Tente novamente.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-neumorphism p-8 md:p-12">
        <div className="text-center mb-8">
           <Link href="/">
              <div className="text-3xl font-bold text-gray-900 cursor-pointer mb-2">Qoro</div>
          </Link>
          <p className="text-gray-600">Crie sua conta e acabe com a desorganização.</p>
        </div>

        {success ? (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-800 p-4 rounded-lg flex items-center text-center flex-col">
            <CheckCircle className="w-8 h-8 mb-3 text-green-600" />
            <p className="text-sm font-semibold">{success}</p>
             <Link href="/login" className="mt-4 text-sm font-medium text-primary hover:underline">
                Ir para o Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-6">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl shadow-neumorphism-inset focus:ring-2 focus:ring-primary transition-all duration-300"
              />
            </div>
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Nome da organização"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl shadow-neumorphism-inset focus:ring-2 focus:ring-primary transition-all duration-300"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl shadow-neumorphism-inset focus:ring-2 focus:ring-primary transition-all duration-300"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                placeholder="Senha (mínimo 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl shadow-neumorphism-inset focus:ring-2 focus:ring-primary transition-all duration-300"
              />
            </div>

            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg flex items-center">
                <AlertCircle className="w-5 h-5 mr-3" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-neumorphism hover:shadow-neumorphism-hover flex items-center justify-center font-semibold disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Criando conta...' : 'Criar conta grátis'}
            </button>
          </form>
        )}

        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            Já tem uma conta?{' '}
            <Link href="/login">
              <span className="font-medium text-primary hover:underline">
                Faça login
              </span>
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
