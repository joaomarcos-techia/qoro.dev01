// src/app/api/stripe/webhook/route.ts
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createUserProfile } from '@/services/organizationService';
import type Stripe from 'stripe';

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error('❌ Webhook secret não configurado.');
    return NextResponse.json({ error: 'Missing webhook secret' }, { status: 400 });
  }

  const rawBody = await req.arrayBuffer();
  const bodyBuffer = Buffer.from(rawBody);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(bodyBuffer, sig, webhookSecret);
  } catch (err: any) {
    console.error('⚠️ Erro ao validar webhook:', err.message);
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  if (relevantEvents.has(event.type)) {
    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode !== 'subscription') {
            console.log('⚙️ Evento de checkout não relacionado a assinatura. Ignorando.');
            return NextResponse.json({ received: true });
        }

        const { firebaseUID, organizationName, userName, cnpj, contactEmail, contactPhone } = session.metadata || {};
        const subscriptionId = session.subscription as string;
        
        if (!firebaseUID || !organizationName || !subscriptionId) {
          console.error('CRITICAL: Metadados essenciais (firebaseUID, organizationName) ou subscriptionId não encontrados na sessão de checkout:', session.id);
          throw new Error('Metadados essenciais não encontrados na sessão de checkout.');
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0].price.id;

        const planId = priceId === process.env.NEXT_PUBLIC_STRIPE_GROWTH_PLAN_PRICE_ID ? 'growth' : 'performance';

        await createUserProfile({
          uid: firebaseUID,
          name: userName,
          organizationName: organizationName,
          email: session.customer_details?.email || '',
          cnpj: cnpj,
          contactEmail: contactEmail,
          contactPhone: contactPhone,
          planId: planId,
          stripePriceId: priceId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          stripeSubscriptionStatus: subscription.status,
          password: '', // Senha é gerenciada pelo Firebase Auth no cliente
        });
        
        console.log(`✅ Perfil de usuário e organização criados com sucesso para UID: ${firebaseUID} via checkout.session.completed.`);
      }

      // TODO: Adicionar lógica para 'customer.subscription.updated' e 'deleted' se necessário no futuro.

    } catch (err: any) {
      console.error('🔥 Erro no handler do webhook:', err.message, err.stack);
      return NextResponse.json({ error: `Webhook handler failed: ${err.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
