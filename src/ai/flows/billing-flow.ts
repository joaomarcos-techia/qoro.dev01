
'use server';
/**
 * @fileOverview Billing and subscription management flows.
 * - createCheckoutSession: Creates a Stripe Checkout session for a user to subscribe.
 * - createBillingPortalSession: Creates a Stripe Billing Portal session for a user to manage their subscription.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';
import { stripe } from '@/lib/stripe';
import { getAdminAndOrg } from '@/services/utils';

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
    
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9004';
    const planId = priceId === process.env.NEXT_PUBLIC_STRIPE_GROWTH_PLAN_PRICE_ID ? 'growth' : 'performance';

    // The webhook now relies on metadata to create the user profile.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      billing_address_collection: 'required',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/login?payment_success=true`,
      cancel_url: `${siteUrl}/signup?plan=${planId}&payment_cancelled=true`,
      // Crucial metadata for the webhook to construct the user profile
      metadata: {
          firebaseUID: actor,
          organizationName: organizationName,
          userName: name,
          cnpj: cnpj,
          contactEmail: contactEmail || '',
          contactPhone: contactPhone || '',
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
  

// --- Exported Functions ---

export async function createCheckoutSession(input: z.infer<typeof CreateCheckoutSessionSchema>): Promise<{ sessionId: string }> {
  return createCheckoutSessionFlow(input);
}

export async function createBillingPortalSession(input: z.infer<typeof CreateBillingPortalSessionSchema>): Promise<{ url: string }> {
  return createBillingPortalSessionFlow(input);
}
