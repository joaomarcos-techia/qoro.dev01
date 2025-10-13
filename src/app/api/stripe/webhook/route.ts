
// src/app/api/stripe/webhook/route.ts
import type { Stripe } from 'stripe';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { updateSubscription } from '@/ai/flows/billing-flow';

// Desativa o bodyParser padrão do Next.js para que possamos receber o corpo bruto (raw body)
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Função para ler o corpo da requisição como um buffer.
 * Necessário para a verificação da assinatura do webhook do Stripe.
 */
async function buffer(readable: NodeJS.ReadableStream) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed',
]);

export async function POST(req: Request) {
  const buf = await buffer(req.body as unknown as NodeJS.ReadableStream);
  const sig = req.headers.get('stripe-signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  if (!sig || !webhookSecret) {
    console.error('Webhook Error: A assinatura ou o segredo do webhook não estão configurados.');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 400 });
  }

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  if (relevantEvents.has(event.type)) {
    try {
      let subscriptionId: string;
      let isCreating = false;

      switch (event.type) {
        case 'checkout.session.completed':
          const checkoutSession = event.data.object as Stripe.Checkout.Session;
          if (typeof checkoutSession.subscription !== 'string') {
            throw new Error('ID da assinatura não encontrado na sessão de checkout.');
          }
           subscriptionId = checkoutSession.subscription;
           isCreating = true;
          break;
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
        case 'customer.subscription.paused':
        case 'customer.subscription.resumed':
          const subscription = event.data.object as Stripe.Subscription;
          subscriptionId = subscription.id;
          isCreating = false;
          break;
        default:
          console.log(`Webhook event não tratado: ${event.type}`);
          return NextResponse.json({ received: true });
      }

      await updateSubscription({
        subscriptionId,
        isCreating,
      });

    } catch (error) {
      console.error('Error handling webhook event:', error);
      return NextResponse.json({ error: 'Webhook handler failed. View logs for more details.' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
