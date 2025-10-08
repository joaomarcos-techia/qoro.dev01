'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const QualificationForm = dynamic(() => import('./QualificationForm'), {
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-black">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
  ssr: false, // O formulário é totalmente interativo no cliente
});

export default function QualificationFormPage() {
  return <QualificationForm />;
}
