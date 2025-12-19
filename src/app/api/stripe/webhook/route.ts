
// src/app/api/stripe/webhook/route.ts
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createUserProfile, handleSubscriptionChange } from '@/services/organizationService';
import type Stripe from 'stripe';
import { adminDb } from '@/lib/firebase-admin';

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

// Helper function to map Stripe Price ID to internal Plan ID
function getPlanFromPriceId(priceId: string): 'free' | 'growth' | 'performance' {
  const planMap: Record<string, 'free' | 'growth' | 'performance'> = {
    [process.env.NEXT_PUBLIC_STRIPE_PERFORMANCE_PLAN_PRICE_ID!]: 'performance',
    [process.env.NEXT_PUBLIC_STRIPE_GROWTH_PLAN_PRICE_ID!]: 'growth',
  };
  return planMap[priceId] || 'free'; // Default to 'free' if no match
}


export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing webhook secret' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await req.text(); // Use text() to verify signature, then parse
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  // --- Main Logic ---
  if (!relevantEvents.has(event.type)) {
    return NextResponse.json({ received: true });
  }
  
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode !== 'subscription' || !session.subscription) {
            return NextResponse.json({ received: true });
        }

        const { firebaseUID, organizationName, userName, cnpj, contactEmail, contactPhone, organizationId, upgrade } = session.metadata || {};
        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        const priceId = subscription.items.data?.[0]?.price?.id;
        if (!priceId) {
            return NextResponse.json({ error: 'Subscription item with price ID not found.' }, { status: 400 });
        }
        
        if (upgrade === 'true') {
          if (!organizationId) {
            return NextResponse.json({ error: 'Metadados de upgrade essenciais (organizationId) não encontrados.' }, { status: 400 });
          }

          // Update the existing organization with the new Stripe details.
          const orgRef = adminDb.collection('organizations').doc(organizationId);
          await orgRef.update({
            stripeCustomerId: subscription.customer as string,
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
          });

          // Trigger the standard subscription change handler to update plan details for all users.
          await handleSubscriptionChange(
            subscription.id,
            priceId,
            subscription.status
          );

        } else {
          // Logic for a brand-new user registration
          if (!firebaseUID || !organizationName || !userName) {
            return NextResponse.json({ error: 'Metadados de novo cliente essenciais não encontrados.' }, { status: 400 });
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
            return NextResponse.json({ error: 'Subscription item with price ID not found on update.' }, { status: 400 });
        }
        await handleSubscriptionChange(
            subscription.id,
            priceId,
            subscription.status
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const orgSnapshot = await adminDb.collection('organizations').where('stripeSubscriptionId', '==', subscription.id).limit(1).get();
        
        if (!orgSnapshot.empty) {
            const orgDoc = orgSnapshot.docs[0];
            const orgRef = adminDb.collection('organizations').doc(orgDoc.id);
            
            // Clean up Stripe data from the organization
            await orgRef.update({
              stripeSubscriptionId: null,
              stripePriceId: null,
              stripeSubscriptionStatus: 'canceled',
            });
            
            // Standardize plan to 'free' upon cancellation
            await handleSubscriptionChange(
                subscription.id,
                'free', // Force plan to free
                'canceled'
            );
        }
        break;
      }

      default:
        // This case is already handled by the initial check, but kept for safety.
        break;
    }

  } catch (err: any) {
    return NextResponse.json({ error: `Webhook handler failed: ${err.message}` }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
