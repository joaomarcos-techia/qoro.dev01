
'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface LegalPopupProps {
  content: 'terms' | 'policy' | null;
  onOpenChange: (isOpen: boolean) => void;
}

const documents = {
  terms: {
    title: 'Termos e Condições de Uso',
    description: 'Leia nossos termos e condições de uso para entender seus direitos e obrigações.',
    filePath: '/terms.md',
  },
  policy: {
    title: 'Política de Privacidade',
    description: 'Entenda como coletamos, usamos e protegemos seus dados pessoais.',
    filePath: '/politica.md',
  },
};

const useMarkdownContent = (filePath: string) => {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!filePath) return;
    setLoading(true);
    fetch(filePath)
      .then(response => {
        if (!response.ok) {
          throw new Error('Falha ao carregar o documento.');
        }
        return response.text();
      })
      .then(text => {
        // Safe and robust markdown-to-html conversion
        const parsedHtml = text
          .split('\n\n')
          .map(paragraph => {
            const trimmed = paragraph.trim();
            if (trimmed.startsWith('### ')) {
              return `<h3 class="text-lg font-semibold mt-4 mb-2 text-gray-300">${trimmed.substring(4)}</h3>`;
            }
            if (trimmed.startsWith('## ')) {
              return `<h2 class="text-xl font-bold mt-5 mb-3 text-gray-200">${trimmed.substring(3)}</h2>`;
            }
            if (trimmed.startsWith('# ')) {
              return `<h1 class="text-2xl font-bold mt-6 mb-4 text-white">${trimmed.substring(2)}</h1>`;
            }
            if (trimmed.startsWith('* ')) {
              const listItems = trimmed.split('\n').map(item => 
                `<li class="flex items-start"><span class="mr-2 mt-1.5 text-primary">&#8226;</span><span>${item.substring(2)}</span></li>`
              ).join('');
              return `<ul class="space-y-2 my-4">${listItems}</ul>`;
            }
            if (trimmed) {
              return `<p class="text-gray-400 leading-relaxed">${trimmed.replace(/\n/g, '<br />')}</p>`;
            }
            return '';
          })
          .join('');

        setHtml(parsedHtml);
      })
      .catch(error => {
        console.error("Error fetching markdown file:", error);
        setHtml('<p class="text-destructive">Não foi possível carregar o documento.</p>');
      })
      .finally(() => setLoading(false));
  }, [filePath]);

  return { html, loading };
};

export function LegalPopup({ content, onOpenChange }: LegalPopupProps) {
  const docInfo = content ? documents[content] : null;
  const { html, loading } = useMarkdownContent(docInfo?.filePath || '');
  
  return (
    <Dialog open={!!content} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">{docInfo?.title || 'Carregando...'}</DialogTitle>
           {docInfo?.description && (
             <DialogDescription>{docInfo.description}</DialogDescription>
           )}
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-4 -mr-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <article className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
