import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    template: '%s | Qoro',
    default: 'Qoro - Plataforma de Gestão Empresarial Integrada com CRM, Finanças e IA',
  },
  description: 'Transforme o caos em clareza com a Qoro, a plataforma de gestão que unifica CRM, finanças, tarefas e IA. Ideal para PMEs, autônomos e agências que buscam crescimento estratégico e eficiência operacional.',
  keywords: [
    'plataforma de gestão',
    'gestão empresarial',
    'software de crm',
    'controle financeiro',
    'gestão de tarefas',
    'inteligência artificial para negócios',
    'automação de processos',
    'software para pme',
    'gestão para autônomos',
    'Qoro',
    'QoroCRM',
    'QoroFinance',
    'QoroTask',
    'QoroPulse',
  ],
  metadataBase: new URL('https://qoro.com.br'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Qoro - Plataforma de Gestão Empresarial Integrada com CRM, Finanças e IA',
    description: 'Transforme o caos em clareza com a Qoro, a plataforma que unifica CRM, finanças, tarefas e IA.',
    url: 'https://qoro.com.br',
    siteName: 'Qoro',
    images: [
      {
        url: 'https://firebasestorage.googleapis.com/v0/b/qoro-iy1gs.firebasestorage.app/o/logofinal-removebg-preview.png?alt=media&token=a0fdbe4b-fe43-4694-ab94-de692b3a5367', // Deve ser um URL absoluto
        width: 1200,
        height: 630,
        alt: 'Logo da Qoro',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  manifest: '/manifest.json',
  icons: {
    icon: 'https://firebasestorage.googleapis.com/v0/b/qoro-iy1gs.firebasestorage.app/o/logofinal-removebg-preview.png?alt=media&token=a0fdbe4b-fe43-4694-ab94-de692b3a5367',
    shortcut: 'https://firebasestorage.googleapis.com/v0/b/qoro-iy1gs.firebasestorage.app/o/logofinal-removebg-preview.png?alt=media&token=a0fdbe4b-fe43-4694-ab94-de692b3a5367',
    apple: 'https://firebasestorage.googleapis.com/v0/b/qoro-iy1gs.firebasestorage.app/o/logofinal-removebg-preview.png?alt=media&token=a0fdbe4b-fe43-4694-ab94-de692b3a5367',
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable}`}>
      <head>
        {/* A importação de fontes agora é gerenciada pelo next/font */}
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
