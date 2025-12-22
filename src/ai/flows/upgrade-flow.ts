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
  targetPriceId: z.string(),
});

const createUpgradeSessionFlow = ai.defineFlow(
  {
    name: 'createUpgradeSessionFlow',
    inputSchema: CreateUpgradeSessionSchema,
    outputSchema: z.object({ sessionId: z.string() }),
  },
  async ({ actor, targetPriceId }) => {
    const orgDetails = await getAdminAndOrg(actor);
    if (!orgDetails) {
      throw new Error("Detalhes da organização não encontrados.");
    }
    const { organizationId, stripeCustomerId, userData } = orgDetails;

    if (!targetPriceId) {
      throw new Error("O ID do plano de destino não foi fornecido.");
    }
    
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://qoro.dev';
    
    let session;
    
    // Add the session_id to the success URL for manual verification on upgrade too
    const successUrl = `${siteUrl}/dashboard?payment_success=true&upgrade=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${siteUrl}/dashboard/settings?upgrade_cancelled=true`;

    if (stripeCustomerId) {
        // User is already a paying customer, create a subscription update session
        const subscriptions = await stripe.subscriptions.list({
            customer: stripeCustomerId,
            limit: 1,
        });

        if (subscriptions.data.length === 0) {
             throw new Error("Assinatura não encontrada no Stripe para este cliente.");
        }

        session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            billing_address_collection: 'required',
            customer: stripeCustomerId,
            line_items: [{ price: targetPriceId, quantity: 1 }],
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                firebaseUID: actor,
                organizationId: organizationId,
                upgrade: "true",
            },
        });

    } else {
        // User is on a free plan and has no Stripe customer ID.
        // Create a new checkout session that will create a new customer and subscription.
        session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            billing_address_collection: 'required',
            line_items: [{ price: targetPriceId, quantity: 1 }],
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                firebaseUID: actor,
                organizationId: organizationId, // Ensure organizationId is passed for upgrades from free
                organizationName: orgDetails.organizationName,
                userName: userData.name,
                cnpj: orgDetails.cnpj,
                upgrade: "true",
            },
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
