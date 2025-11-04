
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import SignUpForm from './SignUpForm';

function Loading() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-black p-4">
      <div className="w-full max-w-3xl mx-auto bg-card rounded-2xl border border-border p-8 md:p-12 text-center">
        <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
      </div>
    </main>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SignUpForm />
    </Suspense>
  );
}
