
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { PrivacyPolicyText } from './PrivacyPolicyText';
import { TermsOfUseText } from './TermsOfUseText';

interface LegalPopupProps {
  content: 'terms' | 'policy' | null;
  onOpenChange: (isOpen: boolean) => void;
}

const documents = {
  terms: {
    title: 'Termos e Condições de Uso',
    description: 'Leia nossos termos e condições de uso para entender seus direitos e obrigações.',
    component: <TermsOfUseText />,
  },
  policy: {
    title: 'Política de Privacidade',
    description: 'Entenda como coletamos, usamos e protegemos seus dados pessoais.',
    component: <PrivacyPolicyText />,
  },
};

export function LegalPopup({ content, onOpenChange }: LegalPopupProps) {
  const docInfo = content ? documents[content] : null;

  return (
    <Dialog open={!!content} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">{docInfo?.title}</DialogTitle>
          {docInfo?.description && (
            <DialogDescription>{docInfo.description}</DialogDescription>
          )}
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-4 -mr-6 prose prose-invert max-w-none">
          {docInfo?.component}
        </div>
      </DialogContent>
    </Dialog>
  );
}
