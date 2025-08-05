import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Qoro - Transforme seu negócio com nossa plataforma integrada',
  description: 'Qoro - Plataforma completa com CRM, monitoramento, gestão de tarefas e controle financeiro para transformar seu negócio',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
