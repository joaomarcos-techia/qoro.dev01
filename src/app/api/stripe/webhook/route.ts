
// src/app/api/stripe/webhook/route.ts
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createUserProfile, handleSubscriptionChange } from '@/services/organizationService';
import type Stripe from 'stripe';
import { adminDb } from '@/lib/firebase-admin';

// Define os eventos relevantes para o webhook. Eventos não listados serão ignorados.
const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

// Função auxiliar robusta para mapear o ID do preço do Stripe para o ID do plano interno.
function getPlanFromPriceId(priceId: string): 'free' | 'growth' | 'performance' {
  const planMap: Record<string, 'free' | 'growth' | 'performance'> = {
    [process.env.NEXT_PUBLIC_STRIPE_PERFORMANCE_PLAN_PRICE_ID!]: 'performance',
    [process.env.NEXT_PUBLIC_STRIPE_GROWTH_PLAN_PRICE_ID!]: 'growth',
  };
  return planMap[priceId] || 'free'; // Garante um fallback seguro para 'free'.
}


export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret or signature missing' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
  }

  if (!relevantEvents.has(event.type)) {
    return NextResponse.json({ received: true });
  }
  
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode !== 'subscription' || !session.subscription) {
            return NextResponse.json({ received: true, message: 'Ignoring non-subscription checkout session.' });
        }

        const { firebaseUID, organizationName, userName, cnpj, contactEmail, contactPhone, organizationId, upgrade } = session.metadata || {};
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        
        const priceId = subscription.items.data?.[0]?.price?.id;
        if (!priceId) {
            console.error(`❌ Price ID not found in subscription items for session ${session.id}.`);
            return NextResponse.json({ error: 'Price ID not found in subscription items.' }, { status: 400 });
        }
        
        if (upgrade === 'true') {
          if (!organizationId) {
            console.error(`❌ organizationId is required for upgrades, but was not found in metadata for session ${session.id}.`);
            return NextResponse.json({ error: 'organizationId is required for upgrades.' }, { status: 400 });
          }
          
          const orgRef = adminDb.collection('organizations').doc(organizationId);
          const orgDoc = await orgRef.get();

          // Idempotency Check: If this subscription is already set, do nothing.
          if (orgDoc.exists() && orgDoc.data()?.stripeSubscriptionId === subscription.id) {
            return NextResponse.json({ received: true, message: 'Upgrade already processed.' });
          }

          await orgRef.update({
            stripeCustomerId: subscription.customer as string,
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
          });

          await handleSubscriptionChange(subscription.id, priceId, subscription.status);

        } else {
          // New user signup flow
          if (!firebaseUID || !organizationName || !userName) {
            console.error(`❌ Essential metadata for new customer missing in session ${session.id}.`);
            return NextResponse.json({ error: 'Essential metadata for new customer missing.' }, { status: 400 });
          }

          const planId = getPlanFromPriceId(priceId);

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
            stripeCustomerId: subscription.customer as string,
            stripeSubscriptionId: subscription.id,
            stripeSubscriptionStatus: subscription.status,
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const priceId = subscription.items.data?.[0]?.price?.id;
        if (!priceId) {
            console.error(`❌ Price ID not found on subscription update event ${subscription.id}.`);
            return NextResponse.json({ error: 'Price ID not found on subscription update.' }, { status: 400 });
        }
        await handleSubscriptionChange(subscription.id, priceId, subscription.status);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        // The `handleSubscriptionChange` function now correctly handles the downgrade to 'free'.
        await handleSubscriptionChange(
            subscription.id,
            'free_plan_dummy_id', // A dummy price ID is fine since the plan will always be 'free'
            'canceled'
        );
        break;
      }
      
      default:
        // This case should not be reached due to the initial event check.
        console.warn(`🤷‍♀️ Unhandled relevant event type: ${event.type}`);
        break;
    }

  } catch (err: any) {
    console.error(`🚨 Webhook handler failed for event: ${event.type}. Error: ${err.message}`, {
      eventId: event.id,
      errorStack: err.stack,
    });
    return NextResponse.json({ error: `Webhook handler failed: ${err.message}` }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
