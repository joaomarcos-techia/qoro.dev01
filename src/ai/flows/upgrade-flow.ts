
'use server';
/**
 * @fileOverview Flow for handling subscription upgrades.
 * - createUpgradeSession: Creates a Stripe Checkout session for a user to upgrade their subscription.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { stripe } from '@/lib/stripe';
import { getAdminAndOrg } from '@/services/utils';

const CreateUpgradeSessionSchema = z.object({
  actor: z.string(),
});

const createUpgradeSessionFlow = ai.defineFlow(
  {
    name: 'createUpgradeSessionFlow',
    inputSchema: CreateUpgradeSessionSchema,
    outputSchema: z.object({ sessionId: z.string() }),
  },
  async ({ actor }) => {
    const orgDetails = await getAdminAndOrg(actor);
    if (!orgDetails) {
      throw new Error("Detalhes da organização não encontrados.");
    }
    const { planId, organizationId, stripeCustomerId, userData } = orgDetails;

    let targetPriceId: string | undefined;

    if (planId === 'free') {
      targetPriceId = process.env.NEXT_PUBLIC_STRIPE_GROWTH_PLAN_PRICE_ID;
    } else if (planId === 'growth') {
      targetPriceId = process.env.NEXT_PUBLIC_STRIPE_PERFORMANCE_PLAN_PRICE_ID;
    }

    if (!targetPriceId) {
      throw new Error("Não há um plano superior disponível ou os IDs de preço não estão configurados.");
    }
    
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9003';
    
    let session;
    
    // If the user already has a Stripe customer ID, we modify the existing subscription.
    // Otherwise, we create a new checkout session for a new subscription.
    if (stripeCustomerId) {
        const subscriptions = await stripe.subscriptions.list({
            customer: stripeCustomerId,
            limit: 1,
        });

        if (subscriptions.data.length === 0) {
            throw new Error("Assinatura não encontrada no Stripe para este cliente.");
        }

        const subscription = subscriptions.data[0];

        session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            billing_address_collection: 'required',
            customer: stripeCustomerId,
            line_items: [{ price: targetPriceId, quantity: 1 }],
            success_url: `${siteUrl}/dashboard?payment_success=true&upgrade=true`,
            cancel_url: `${siteUrl}/dashboard/settings?upgrade_cancelled=true`,
            metadata: {
                firebaseUID: actor,
                organizationId: organizationId,
                upgrade: "true",
            },
        });

    } else {
        // User is on a free plan and has no Stripe customer ID.
        // We create a checkout session that will create a new customer and subscription.
        session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            billing_address_collection: 'required',
            line_items: [{ price: targetPriceId, quantity: 1 }],
            success_url: `${siteUrl}/dashboard?payment_success=true&upgrade=true`,
            cancel_url: `${siteUrl}/dashboard/settings?upgrade_cancelled=true`,
            // Provide customer creation details via metadata for the webhook
            metadata: {
                firebaseUID: actor,
                organizationId: organizationId,
                organizationName: orgDetails.organizationName,
                userName: userData.name,
                cnpj: orgDetails.cnpj,
                upgrade: "true",
            },
             // Pass customer email if available to pre-fill Stripe checkout
            customer_email: userData.email,
        });
    }

    if (!session.url) {
      throw new Error('Falha ao criar a URL da sessão de checkout do Stripe.');
    }

    return { sessionId: session.url };
  }
);

export async function createUpgradeSession(input: z.infer<typeof CreateUpgradeSessionSchema>): Promise<{ sessionId: string }> {
  return createUpgradeSessionFlow(input);
}
