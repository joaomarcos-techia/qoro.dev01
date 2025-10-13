
'use server';
/**
 * @fileOverview Billing and subscription management flows.
 * - createCheckoutSession: Creates a Stripe Checkout session for a user to subscribe.
 * - createBillingPortalSession: Creates a Stripe Billing Portal session for a user to manage their subscription.
 * - updateSubscription: Updates the subscription status in Firestore based on Stripe webhook events.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { stripe } from '@/lib/stripe';
import { getAdminAndOrg } from '@/services/utils';
import type { Stripe } from 'stripe';
import * as orgService from '@/services/organizationService';

const CreateCheckoutSessionSchema = z.object({
  priceId: z.string(),
  actor: z.string(),
  name: z.string(),
  organizationName: z.string(),
  cnpj: z.string(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
});

const CreateBillingPortalSessionSchema = z.object({
  actor: z.string(),
});

const createCheckoutSessionFlow = ai.defineFlow(
  {
    name: 'createCheckoutSessionFlow',
    inputSchema: CreateCheckoutSessionSchema,
    outputSchema: z.object({ sessionId: z.string() }),
  },
  async ({ priceId, actor, name, organizationName, cnpj, contactEmail, contactPhone }) => {
    
    const user = await adminAuth.getUser(actor);

    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    let customer;
    if (customers.data.length > 0) {
        customer = customers.data[0];
    } else {
        customer = await stripe.customers.create({
            email: user.email,
            name: name,
            metadata: {
                firebaseUID: actor,
            },
        });
    }

    const planId = priceId === process.env.NEXT_PUBLIC_STRIPE_GROWTH_PLAN_PRICE_ID ? 'growth' : 'performance';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      billing_address_collection: 'required',
      customer: customer.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/login?payment_success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/signup?plan=${planId}&payment_cancelled=true`,
      subscription_data: {
        metadata: {
            firebaseUID: actor,
            organizationName: organizationName,
            cnpj: cnpj,
            contactEmail: contactEmail || '',
            contactPhone: contactPhone || '',
            planId: planId,
            stripePriceId: priceId,
        }
      },
    });

    if (!session.url) {
      throw new Error('Failed to create Stripe checkout session URL.');
    }

    return { sessionId: session.url };
  }
);


const createBillingPortalSessionFlow = ai.defineFlow(
    {
      name: 'createBillingPortalSessionFlow',
      inputSchema: CreateBillingPortalSessionSchema,
      outputSchema: z.object({ url: z.string() }),
    },
    async ({ actor }) => {
      const orgDetails = await getAdminAndOrg(actor);
      if (!orgDetails) {
        throw new Error("Organização do usuário não encontrada ou não sincronizada.");
      }
      const orgDoc = await adminDb.collection('organizations').doc(orgDetails.organizationId).get();
      const stripeCustomerId = orgDoc.data()?.stripeCustomerId;
  
      if (!stripeCustomerId) {
        throw new Error("Customer ID do Stripe não encontrado para esta organização.");
      }
  
      const { url } = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings`,
      });
  
      return { url };
    }
  );
  
const updateSubscriptionFlow = ai.defineFlow(
    {
        name: 'updateSubscriptionFlow',
        inputSchema: z.object({ subscriptionId: z.string(), isCreating: z.boolean() }),
        outputSchema: z.object({ success: z.boolean() }),
    },
    async ({ subscriptionId, isCreating }) => {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        if (isCreating) {
            const metadata = subscription.metadata;
            const firebaseUID = metadata.firebaseUID;
            
            if (!firebaseUID) {
                console.error('CRITICAL: Firebase UID not found in subscription metadata for ID:', subscriptionId);
                throw new Error('Firebase UID não encontrado nos metadados da assinatura.');
            }
            
            const userRecord = await adminAuth.getUser(firebaseUID);
            
            const creationData = {
                uid: firebaseUID,
                name: userRecord.displayName || metadata.organizationName,
                email: userRecord.email!,
                organizationName: metadata.organizationName,
                cnpj: metadata.cnpj,
                contactEmail: metadata.contactEmail,
                contactPhone: metadata.contactPhone,
                planId: metadata.planId,
                stripePriceId: metadata.stripePriceId,
                password: '', // Password is set on client
                stripeCustomerId: subscription.customer as string,
                stripeSubscriptionId: subscription.id,
                stripeSubscriptionStatus: subscription.status,
            };

            await orgService.createUserProfile(creationData);

        } else {
            // This part handles updates like cancellations or plan changes.
            const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
            const firebaseUID = customer.metadata.firebaseUID;

            if (!firebaseUID) {
                console.error('CRITICAL: Firebase UID not found in customer metadata for subscription update ID:', subscriptionId);
                throw new Error('Firebase UID not found for subscription update.');
            }

            const userRef = adminDb.collection('users').doc(firebaseUID);
            const userDoc = await userRef.get();
            if (!userDoc.exists || !userDoc.data()?.organizationId) {
                console.error(`User or organization not found for UID: ${firebaseUID} during subscription update.`);
                throw new Error(`Usuário ou organização não encontrado durante a atualização da assinatura.`);
            }
            const organizationId = userDoc.data()!.organizationId;
            const orgRef = adminDb.collection('organizations').doc(organizationId);

            const subscriptionData = {
                stripeSubscriptionId: subscription.id,
                stripePriceId: subscription.items.data[0].price.id,
                stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
                stripeSubscriptionStatus: subscription.status,
            };
    
            await orgRef.update(subscriptionData);
            await userRef.update({ stripeSubscriptionStatus: subscription.status });
        }

        return { success: true };
    }
);


// --- Exported Functions ---

export async function createCheckoutSession(input: z.infer<typeof CreateCheckoutSessionSchema>): Promise<{ sessionId: string }> {
  return createCheckoutSessionFlow(input);
}

export async function createBillingPortalSession(input: z.infer<typeof CreateBillingPortalSessionSchema>): Promise<{ url: string }> {
  return createBillingPortalSessionFlow(input);
}

export async function updateSubscription(input: { subscriptionId: string, isCreating: boolean }): Promise<{ success: boolean }> {
  return updateSubscriptionFlow(input);
}
