
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import LoginForm from './LoginForm';

function Loading() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-black p-4">
      <div className="w-full max-w-md mx-auto bg-card rounded-2xl border border-border p-8 md:p-12 text-center">
        <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LoginForm />
    </Suspense>
  );
}
