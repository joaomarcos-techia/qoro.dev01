
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, AlertCircle, CheckCircle, User, Building, FileText, Phone, Loader2, CreditCard, Send } from 'lucide-react';
import { createCheckoutSession } from '@/ai/flows/billing-flow';
import { createUserProfile } from '@/ai/flows/user-management';
import { Logo } from '@/components/ui/logo';
import { LegalPopup } from '@/components/landing/LegalPopup';
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { signUpAndVerify, resendVerification } from '@/lib/authService';
import { User as FirebaseUser } from 'firebase/auth';
import { Button } from '@/components/ui/button';

export default function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') || 'free';

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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [popupContent, setPopupContent] = useState<'terms' | 'policy' | null>(null);
  
  const [userForResend, setUserForResend] = useState<FirebaseUser | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendFeedback, setResendFeedback] = useState<string | null>(null);


  const formatCNPJ = (value: string) => {
    if (!value) return "";
    value = value.replace(/\D/g, ''); 
    value = value.replace(/^(\d{2})(\d)/, '$1.$2');
    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
    value = value.replace(/(\d{4})(\d)/, '$1-$2');
    return value.slice(0, 18); 
  };

  const formatPhone = (value: string) => {
    if (!value) return "";
    value = value.replace(/\D/g, '');
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
    value = value.replace(/(\d{5})(\d)/, '$1-$2');
    return value.slice(0, 15);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'cnpj') {
        setFormData(prev => ({ ...prev, [name]: formatCNPJ(value) }));
    } else if (name === 'contactPhone') {
        setFormData(prev => ({ ...prev, [name]: formatPhone(value) }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleResend = async () => {
    if (!userForResend) return;
    setIsResending(true);
    setResendFeedback(null);
    try {
        await resendVerification(userForResend);
        setResendFeedback("Um novo e-mail de verificação foi enviado com sucesso!");
    } catch (error: any) {
        setResendFeedback(`Erro ao reenviar: ${error.message}`);
    } finally {
        setIsResending(false);
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setCheckoutUrl(null);

    if (!agreedToTerms) {
      setError('Você deve concordar com os Termos de Uso e a Política de Privacidade.');
      return;
    }
     if (!formData.name || !formData.organizationName || !formData.email || !formData.password || !formData.cnpj) {
      setError('Todos os campos marcados com * são obrigatórios.');
      return;
    }
    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      const user = await signUpAndVerify(formData.email, formData.password);
      setUserForResend(user); 

      if (plan === 'growth' || plan === 'performance') {
        const priceId = plan === 'growth' 
            ? process.env.NEXT_PUBLIC_STRIPE_GROWTH_PLAN_PRICE_ID
            : process.env.NEXT_PUBLIC_STRIPE_PERFORMANCE_PLAN_PRICE_ID;
        
        if (!priceId) {
            throw new Error('ID do plano de preços não configurado para o checkout.');
        }
        
        const { sessionId } = await createCheckoutSession({
            priceId: priceId,
            actor: user.uid,
            name: formData.name,
            organizationName: formData.organizationName,
            cnpj: formData.cnpj.replace(/\D/g, ''),
            contactEmail: formData.contactEmail,
            contactPhone: formData.contactPhone.replace(/\D/g, '')
        });
        
        setCheckoutUrl(sessionId);
        setSuccessMessage('Conta criada! Um e-mail de verificação foi enviado. Verifique sua caixa de entrada e Spam. Após a verificação, conclua o pagamento para finalizar.');

      } else {
        await createUserProfile({
          ...formData,
          uid: user.uid,
        });
        setSuccessMessage('Conta criada! Um e-mail de verificação foi enviado. Verifique sua caixa de entrada e spam para ativar sua conta antes de fazer o login.');
      }

    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado. Verifique o console para mais detalhes.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <LegalPopup content={popupContent} onOpenChange={(isOpen) => !isOpen && setPopupContent(null)} />
    <main className="flex items-center justify-center min-h-screen bg-black p-4">
      <div className="w-full max-w-3xl mx-auto bg-card rounded-2xl border border-border p-8 md:p-12">
        <div className="text-center mb-8">
           <Link href="/" className="inline-block mb-2 text-3xl">
              <Logo />
          </Link>
          <p className="text-muted-foreground">Crie sua conta para começar a organizar sua empresa.</p>
        </div>

        {successMessage ? (
          <div className="bg-green-800/20 border-l-4 border-green-500 text-green-300 p-6 rounded-lg text-center flex-col">
            <CheckCircle className="w-10 h-10 mb-4 text-green-400 mx-auto" />
            <h3 className="text-xl font-bold text-white mb-2">{checkoutUrl ? 'Quase lá!' : 'Conta Criada com Sucesso!'}</h3>
            <p className="text-sm font-semibold mb-6">{successMessage}</p>
            
            {checkoutUrl ? (
                <a href={checkoutUrl} target="_self" rel="noopener noreferrer" className="w-full bg-primary text-primary-foreground py-3 rounded-xl hover:bg-primary/90 transition-all duration-300 border border-transparent hover:border-primary/50 flex items-center justify-center font-semibold">
                    <CreditCard className="mr-2 h-5 w-5" />
                    Ir para o Pagamento
                </a>
            ) : (
                <Link href="/login" className="w-full bg-primary text-primary-foreground py-3 rounded-xl hover:bg-primary/90 transition-all duration-300 border border-transparent hover:border-primary/50 flex items-center justify-center font-semibold">
                    Ir para Login
                </Link>
            )}
             <div className="mt-6 pt-4 border-t border-green-500/20 text-center">
                <p className="text-xs text-muted-foreground mb-3">Não recebeu o e-mail de verificação? Verifique sua caixa de Spam ou peça um novo envio.</p>
                <Button variant="outline" size="sm" onClick={handleResend} disabled={isResending || !userForResend} className="w-full sm:w-auto">
                    {isResending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                    {isResending ? 'Reenviando...' : 'Reenviar E-mail de Verificação'}
                </Button>
                {resendFeedback && <p className="text-xs mt-2">{resendFeedback}</p>}
             </div>

          </div>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-8">
            {/* Seção Empresa */}
            <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center"><Building className="w-5 h-5 mr-3 text-primary"/>Informações da Empresa</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="relative">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input name="organizationName" type="text" placeholder="Nome da Empresa *" value={formData.organizationName} onChange={handleInputChange} required className="w-full pl-12 pr-4 py-3 bg-input rounded-xl border-border focus:ring-2 focus:ring-primary transition-all duration-200"/>
                    </div>
                    <div className="relative">
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input name="cnpj" type="text" placeholder="CNPJ *" value={formData.cnpj} onChange={handleInputChange} required className="w-full pl-12 pr-4 py-3 bg-input rounded-xl border-border focus:ring-2 focus:ring-primary transition-all duration-200"/>
                    </div>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input name="contactEmail" type="email" placeholder="E-mail de Contato (opcional)" value={formData.contactEmail} onChange={handleInputChange} className="w-full pl-12 pr-4 py-3 bg-input rounded-xl border-border focus:ring-2 focus:ring-primary transition-all duration-200"/>
                    </div>
                    <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input name="contactPhone" type="tel" placeholder="Telefone de Contato (opcional)" value={formData.contactPhone} onChange={handleInputChange} className="w-full pl-12 pr-4 py-3 bg-input rounded-xl border-border focus:ring-2 focus:ring-primary transition-all duration-200"/>
                    </div>
                </div>
            </div>

            {/* Seção Pessoal */}
             <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center"><User className="w-5 h-5 mr-3 text-primary"/>Informações Pessoais e de Acesso</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="relative md:col-span-2">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input name="name" type="text" placeholder="Seu Nome *" value={formData.name} onChange={handleInputChange} required className="w-full pl-12 pr-4 py-3 bg-input rounded-xl border-border focus:ring-2 focus:ring-primary transition-all duration-200"/>
                    </div>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input name="email" type="email" placeholder="Seu E-mail de login *" value={formData.email} onChange={handleInputChange} required className="w-full pl-12 pr-4 py-3 bg-input rounded-xl border-border focus:ring-2 focus:ring-primary transition-all duration-200"/>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input name="password" type="password" placeholder="Sua Senha *" value={formData.password} onChange={handleInputChange} required className="w-full pl-12 pr-4 py-3 bg-input rounded-xl border-border focus:ring-2 focus:ring-primary transition-all duration-200"/>
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)} />
                <Label htmlFor="terms" className="text-sm text-muted-foreground">
                    Concordo com os{' '}
                    <button type="button" onClick={() => setPopupContent('terms')} className="text-primary hover:underline font-semibold">
                    Termos de Uso
                    </button>{' '}
                    e a{' '}
                    <button type="button" onClick={() => setPopupContent('policy')} className="text-primary hover:underline font-semibold">
                    Política de Privacidade
                    </button>
                    .
                </Label>
            </div>

            {error && (
              <div className="bg-destructive/20 border-l-4 border-destructive text-destructive-foreground p-4 rounded-lg flex items-center">
                <AlertCircle className="w-5 h-5 mr-3" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="pt-2">
                <button
                type="submit"
                disabled={isLoading || !agreedToTerms}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl hover:bg-primary/90 transition-all duration-200 border border-transparent hover:border-primary/50 flex items-center justify-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                {isLoading && <Loader2 className="animate-spin mr-2 h-5 w-5" />}
                {isLoading ? 'Criando conta...' : 'Criar conta e Continuar'}
                </button>
            </div>
          </form>
        )}
         <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              Já tem uma conta?{' '}
              <Link href="/login">
                <span className="font-medium text-primary hover:underline">
                  Faça o login
                </span>
              </Link>
            </p>
        </div>
      </div>
    </main>
    </>
  );
}
