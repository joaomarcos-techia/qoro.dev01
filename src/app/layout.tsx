import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

// URL da imagem do Firebase
const iconUrl = '/favicon.ico';

export const metadata: Metadata = {
  title: {
    template: '%s | Qoro',
    default: 'Qoro - Otimizadora Clínica',
  },
  description: 'Otimize sua clínica com a Qoro. Unificamos agendamento, prontuários, finanças e IA para transformar a gestão do seu negócio e maximizar seus resultados.',
  keywords: [
    'otimizadora clínica',
    'software para clínicas',
    'gestão de clínicas',
    'prontuário eletrônico',
    'agendamento online',
    'gestão financeira para clínicas',
    'inteligência artificial para saúde',
    'software médico',
    'software para dentistas',
    'Qoro',
  ],
  metadataBase: new URL('https://qoro.dev'),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: iconUrl, sizes: '32x32', type: 'image/png' },
      { url: iconUrl, sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: iconUrl, sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'icon',
        url: iconUrl,
        sizes: '192x192',
        type: 'image/png',
      },
      {
        rel: 'icon',
        url: iconUrl,
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  },
  openGraph: {
    title: 'Qoro | A Otimizadora Clínica que Unifica Gestão, Finanças e IA',
    description: 'Transforme a gestão da sua clínica com a Qoro. Unificamos agendamento, prontuários, finanças e IA.',
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
