'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const SignUpForm = dynamic(() => import('@/app/signup/SignUpForm'), {
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
  ssr: false, // O formulário é totalmente interativo no cliente
});

export default function SignUpPage() {
  return <SignUpForm />;
}
