// src/lib/stripe.ts
import { Stripe } from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  // Em um ambiente de desenvolvimento, podemos permitir que continue sem a chave,
  // mas em produção, isso seria um erro crítico.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('A variável de ambiente STRIPE_SECRET_KEY não está definida em produção.');
  }
}

// Inicializa o Stripe, mesmo que a chave seja undefined.
// A biblioteca Stripe lidará com os erros se tentarmos fazer uma chamada de API sem a chave.
export const stripe = new Stripe(stripeSecretKey!, {
  apiVersion: '2024-06-20', // Use a versão mais recente da API
  typescript: true,
});
