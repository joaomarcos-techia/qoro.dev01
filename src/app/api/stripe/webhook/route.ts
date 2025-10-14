
// src/app/api/stripe/webhook/route.ts
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createUserProfile } from '@/services/organizationService';
import type Stripe from 'stripe';
import { adminDb } from '@/lib/firebase-admin';

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

  let event: Stripe.Event;
  try {
    const rawBody = await req.text(); // Use text() to verify signature, then parse
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('⚠️ Erro ao validar webhook:', err.message);
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  // --- Main Logic ---
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode !== 'subscription') {
            console.log('⚙️ Evento de checkout não relacionado a assinatura. Ignorando.');
            return NextResponse.json({ received: true });
        }

        const { firebaseUID, organizationName, userName, cnpj, contactEmail, contactPhone } = session.metadata || {};
        const subscriptionId = session.subscription;
        
        if (!firebaseUID || !organizationName || !userName || !subscriptionId) {
          console.error('CRITICAL: Metadados essenciais (firebaseUID, organizationName, userName) ou subscriptionId não encontrados na sessão de checkout:', session.id);
          // Don't throw, just return an error to Stripe to potentially retry
          return NextResponse.json({ error: 'Metadados essenciais não encontrados na sessão de checkout.' }, { status: 400 });
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);

        await createUserProfile({
          uid: firebaseUID,
          name: userName,
          organizationName: organizationName,
          email: session.customer_details?.email || '', // Email comes from customer_details
          cnpj: cnpj,
          contactEmail: contactEmail,
          contactPhone: contactPhone,
          planId: subscription.items.data[0].price.id === process.env.NEXT_PUBLIC_STRIPE_GROWTH_PLAN_PRICE_ID ? 'growth' : 'performance',
          stripePriceId: subscription.items.data[0].price.id,
          stripeCustomerId: subscription.customer as string,
          stripeSubscriptionId: subscription.id,
          stripeSubscriptionStatus: subscription.status,
          password: '', // Password is managed by Firebase Auth on the client
        });
        
        console.log(`✅ Perfil de usuário e organização criados com sucesso para UID: ${firebaseUID} via checkout.session.completed.`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const orgQuery = await adminDb.collection('organizations').where('stripeSubscriptionId', '==', subscription.id).limit(1).get();
        if (!orgQuery.empty) {
            const orgDoc = orgQuery.docs[0];
            await orgDoc.ref.update({
                stripeSubscriptionStatus: subscription.status,
                stripePriceId: subscription.items.data[0].price.id,
            });
            console.log(`✅ Status da assinatura atualizado para ${subscription.status} na organização ${orgDoc.id}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const orgQuery = await adminDb.collection('organizations').where('stripeSubscriptionId', '==', subscription.id).limit(1).get();
        if (!orgQuery.empty) {
            const orgDoc = orgQuery.docs[0];
            await orgDoc.ref.update({
                stripeSubscriptionStatus: 'canceled', // Or subscription.status
            });
            console.log(`✅ Assinatura cancelada para organização ${orgDoc.id}`);
        }
        break;
      }

      default:
        console.warn(`🤷‍♀️ Evento não tratado: ${event.type}`);
    }

  } catch (err: any) {
    console.error('🔥 Erro no handler do webhook:', err.message, err.stack);
    return NextResponse.json({ error: `Webhook handler failed: ${err.message}` }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
