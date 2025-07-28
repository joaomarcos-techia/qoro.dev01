import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-neumorphism text-center max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Bem-vindo ao seu Dashboard!</h1>
        <p className="text-gray-600 mb-8">
          Sua conta foi criada e seu e-mail verificado. Explore a plataforma!
        </p>
        <Link href="/">
          <a className="bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-neumorphism hover:shadow-neumorphism-hover font-semibold">
            Voltar para a Home
          </a>
        </Link>
      </div>
    </div>
  );
}
