
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, AlertCircle, CheckCircle, User, Building, FileText, Phone } from 'lucide-react';
import { signUp } from '@/ai/flows/user-management';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    organizationName: '',
    cnpj: '',
    contactEmail: '',
    contactPhone: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setIsLoading(false);
      return;
    }
     if (!formData.name || !formData.organizationName || !formData.email || !formData.password || !formData.cnpj) {
      setError('Todos os campos marcados com * são obrigatórios.');
      setIsLoading(false);
      return;
    }

    try {
      const user = await signUp({
        ...formData
      });
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser as FirebaseUser);
      }
      setSuccess('Conta criada! Verifique seu e-mail para confirmar sua conta.');
    } catch (err: any) {
      if (err.message && err.message.includes('already in use')) {
        setError('Este e-mail já está em uso. Tente fazer login.');
      } else {
        setError('Ocorreu um erro ao criar a conta. Tente novamente.');
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-3xl mx-auto bg-white rounded-3xl shadow-neumorphism p-8 md:p-12">
        <div className="text-center mb-8">
           <Link href="/">
              <div className="text-3xl font-bold text-gray-900 cursor-pointer mb-2">Qoro</div>
          </Link>
          <p className="text-gray-600">Crie sua conta para começar a organizar sua empresa.</p>
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
          <form onSubmit={handleSignUp} className="space-y-8">
            {/* Seção Empresa */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Building className="w-5 h-5 mr-3 text-primary"/>Informações da Empresa</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="relative">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input name="organizationName" type="text" placeholder="Nome da Empresa *" value={formData.organizationName} onChange={handleInputChange} required className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl shadow-neumorphism-inset focus:ring-2 focus:ring-primary transition-all duration-300"/>
                    </div>
                    <div className="relative">
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input name="cnpj" type="text" placeholder="CNPJ *" value={formData.cnpj} onChange={handleInputChange} required className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl shadow-neumorphism-inset focus:ring-2 focus:ring-primary transition-all duration-300"/>
                    </div>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input name="contactEmail" type="email" placeholder="E-mail de Contato" value={formData.contactEmail} onChange={handleInputChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl shadow-neumorphism-inset focus:ring-2 focus:ring-primary transition-all duration-300"/>
                    </div>
                    <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input name="contactPhone" type="tel" placeholder="Telefone de Contato" value={formData.contactPhone} onChange={handleInputChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl shadow-neumorphism-inset focus:ring-2 focus:ring-primary transition-all duration-300"/>
                    </div>
                </div>
            </div>

            {/* Seção Pessoal */}
             <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><User className="w-5 h-5 mr-3 text-primary"/>Informações Pessoais e de Acesso</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="relative md:col-span-2">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input name="name" type="text" placeholder="Seu Nome *" value={formData.name} onChange={handleInputChange} required className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl shadow-neumorphism-inset focus:ring-2 focus:ring-primary transition-all duration-300"/>
                    </div>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input name="email" type="email" placeholder="Seu E-mail de login *" value={formData.email} onChange={handleInputChange} required className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl shadow-neumorphism-inset focus:ring-2 focus:ring-primary transition-all duration-300"/>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input name="password" type="password" placeholder="Sua Senha *" value={formData.password} onChange={handleInputChange} required className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl shadow-neumorphism-inset focus:ring-2 focus:ring-primary transition-all duration-300"/>
                    </div>
                </div>
            </div>

            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg flex items-center">
                <AlertCircle className="w-5 h-5 mr-3" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="pt-2">
                <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-neumorphism hover:shadow-neumorphism-hover flex items-center justify-center font-semibold disabled:opacity-75 disabled:cursor-not-allowed"
                >
                {isLoading ? 'Criando conta...' : 'Criar conta grátis'}
                </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
