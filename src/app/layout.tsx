import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const iconUrl = 'https://firebasestorage.googleapis.com/v0/b/qoro-iy1gs.firebasestorage.app/o/logofinal-removebg-preview.png?alt=media&token=1f0aea30-e316-4cc5-99f3-f124234faf08';

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
  metadataBase: new URL('https://qoro.dev'),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: iconUrl,
    apple: iconUrl,
  },
  openGraph: {
    title: 'Qoro | Plataforma de Gestão Empresarial Integrada com CRM, Finanças e IA',
    description: 'Transforme o caos em clareza com a Qoro, a plataforma que unifica CRM, finanças, tarefas e IA.',
    url: 'https://qoro.dev',
    siteName: 'Qoro',
    images: [
      {
        url: iconUrl,
        width: 1200,
        height: 630,
        alt: 'Logo da Qoro',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
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
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
