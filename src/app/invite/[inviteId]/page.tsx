
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, AlertCircle, CheckCircle, User, Loader2 } from 'lucide-react';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { adminAuth } from '@/lib/firebase-admin';
import { Logo } from '@/components/ui/logo';
import { signUpAndVerify } from '@/lib/authService';

async function validateInvite(inviteId: string) {
    const inviteRef = adminDb.collection('invites').doc(inviteId);
    const doc = await inviteRef.get();
  
    if (!doc.exists || doc.data()?.status !== 'pending' || doc.data()?.expiresAt.toDate() < new Date()) {
      throw new Error("Convite inválido, expirado ou já utilizado.");
    }
    const data = doc.data()!;
    return { email: data.email, organizationName: data.organizationName };
};
  
async function acceptInvite(inviteId: string, { name, uid }: { name: string; uid: string }) {
    const inviteRef = adminDb.collection('invites').doc(inviteId);
    return adminDb.runTransaction(async (transaction) => {
      const inviteDoc = await transaction.get(inviteRef);
      if (!inviteDoc.exists || inviteDoc.data()?.status !== 'pending') {
        throw new Error("Convite inválido ou já aceito.");
      }
      const inviteData = inviteDoc.data()!;
      const orgDoc = await transaction.get(adminDb.collection('organizations').doc(inviteData.organizationId));
      if (!orgDoc.exists) {
        throw new Error("Organização associada ao convite não encontrada.");
      }
      const planId = orgDoc.data()!.planId || 'free';
  
      const userRef = adminDb.collection('users').doc(uid);
      transaction.set(userRef, {
        name,
        email: inviteData.email,
        organizationId: inviteData.organizationId,
        role: 'member',
        createdAt: new Date(),
        planId: planId,
        permissions: {
          qoroCrm: true,
          qoroPulse: planId === 'performance',
          qoroTask: true,
          qoroFinance: true,
        },
      });
  
      transaction.update(inviteRef, { status: 'accepted', acceptedBy: uid, acceptedAt: new Date() });
      await adminAuth.setCustomUserClaims(uid, { organizationId: inviteData.organizationId, role: 'member', planId });
      return { success: true };
    });
};


export default function AcceptInvitePage() {
  const router = useRouter();
  const params = useParams();
  const inviteId = params.inviteId as string;

  const [formData, setFormData] = useState({ name: '', password: '', confirmPassword: '' });
  const [inviteInfo, setInviteInfo] = useState<{ email: string; organizationName: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function verifyInvite() {
      if (!inviteId) {
        setError('ID de convite inválido.');
        setIsLoading(false);
        return;
      }
      try {
        const info = await validateInvite(inviteId);
        setInviteInfo(info);
      } catch (err: any) {
        setError(err.message || 'Este convite é inválido, expirou ou já foi utilizado.');
      } finally {
        setIsLoading(false);
      }
    }
    verifyInvite();
  }, [inviteId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (!inviteInfo) {
      setError('Informações do convite não encontradas.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('[AcceptInvite] Chamando signUpAndVerify...');
      const user = await signUpAndVerify(inviteInfo.email, formData.password);
      console.log('[AcceptInvite] signUpAndVerify concluído. Chamando acceptInvite...');
      
      await acceptInvite(inviteId, {
        name: formData.name,
        uid: user.uid,
      });
      console.log('[AcceptInvite] acceptInvite concluído com sucesso.');

      setSuccess(true);
      setTimeout(() => router.push('/login'), 5000); 

    } catch (err: any) {
      console.error('❌ [AcceptInvite] ERRO no handleAccept:', err);
      let errorMessage = 'Ocorreu um erro ao finalizar o cadastro. Verifique o console.';
      if (err.code === 'auth/email-already-in-use') {
          errorMessage = 'Este e-mail já está em uso por outra conta.';
      }
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-black p-4">
        <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin mb-4" />
            <p className="text-muted-foreground">Validando convite...</p>
        </div>
      </main>
    );
  }
  
  if (error && !inviteInfo) {
     return (
      <main className="flex items-center justify-center min-h-screen bg-black p-4">
        <div className="w-full max-w-md mx-auto bg-card rounded-2xl border border-border p-8 md:p-12 text-center">
             <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
             <h2 className="text-2xl font-bold text-foreground mb-2">Convite Inválido</h2>
             <p className="text-muted-foreground">{error}</p>
             <Link href="/signup">
                <div className="mt-6 w-full bg-primary text-primary-foreground py-2 rounded-xl hover:bg-primary/90 transition-all duration-200 font-semibold">
                    Criar uma nova conta
                </div>
            </Link>
        </div>
      </main>
    );
  }
  
  if (success) {
     return (
      <main className="flex items-center justify-center min-h-screen bg-black p-4">
        <div className="w-full max-w-md mx-auto bg-card rounded-2xl border border-border p-8 md:p-12 text-center">
             <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
             <h2 className="text-2xl font-bold text-foreground mb-2">Conta Criada!</h2>
             <p className="text-muted-foreground">Seja bem-vindo(a)! Um e-mail de verificação foi enviado. Por favor, verifique sua conta antes de fazer o login. Você será redirecionado para a página de login em instantes.</p>
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
          <p className="text-muted-foreground">Você foi convidado para se juntar à organização <span className="font-bold text-primary">{inviteInfo?.organizationName}</span>.</p>
        </div>

        <form onSubmit={handleAccept} className="space-y-6">
            <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input type="email" value={inviteInfo?.email || ''} disabled className="w-full pl-12 pr-4 py-3 bg-secondary rounded-xl border-border cursor-not-allowed"/>
            </div>
            <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input name="name" type="text" placeholder="Seu nome completo *" value={formData.name} onChange={handleInputChange} required className="w-full pl-12 pr-4 py-3 bg-input rounded-xl border-border focus:ring-2 focus:ring-primary"/>
            </div>
            <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input name="password" type="password" placeholder="Crie uma senha *" value={formData.password} onChange={handleInputChange} required className="w-full pl-12 pr-4 py-3 bg-input rounded-xl border-border focus:ring-2 focus:ring-primary"/>
            </div>
             <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input name="confirmPassword" type="password" placeholder="Confirme sua senha *" value={formData.confirmPassword} onChange={handleInputChange} required className="w-full pl-12 pr-4 py-3 bg-input rounded-xl border-border focus:ring-2 focus:ring-primary"/>
            </div>

          {error && (
            <div className="bg-destructive/20 border-l-4 border-destructive text-destructive-foreground p-4 rounded-lg flex items-center text-sm">
              <AlertCircle className="w-5 h-5 mr-3" />
              <div>{error}</div>
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="w-full bg-primary text-primary-foreground py-3 rounded-xl hover:bg-primary/90 transition-all duration-200 flex items-center justify-center font-semibold disabled:opacity-75">
            {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            {isSubmitting ? 'Finalizando...' : 'Aceitar Convite e Criar Conta'}
          </button>
        </form>
      </div>
    </main>
  );
}
