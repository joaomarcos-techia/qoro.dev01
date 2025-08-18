import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Qoro - Transforme seu negócio com nossa plataforma integrada',
  description: 'A Qoro é a plataforma de gestão que unifica CRM, finanças, tarefas e IA para transformar o caos em clareza e impulsionar o crescimento do seu negócio.',
  viewport: 'width=device-width, initial-scale=1',
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
