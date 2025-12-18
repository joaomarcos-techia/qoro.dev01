
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
    const { planId, organizationId, stripeCustomerId } = orgDetails;

    if (!stripeCustomerId) {
      throw new Error("Cliente Stripe não encontrado para esta organização. O upgrade manual pode ser necessário.");
    }

    let targetPriceId: string | undefined;

    if (planId === 'free') {
      targetPriceId = process.env.NEXT_PUBLIC_STRIPE_GROWTH_PLAN_PRICE_ID;
    } else if (planId === 'growth') {
      targetPriceId = process.env.NEXT_PUBLIC_STRIPE_PERFORMANCE_PLAN_PRICE_ID;
    }

    if (!targetPriceId) {
      throw new Error("Não há um plano superior disponível ou os IDs de preço não estão configurados.");
    }
    
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9004';
    
    const session = await stripe.checkout.sessions.create({
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

    if (!session.url) {
      throw new Error('Falha ao criar a URL da sessão de checkout do Stripe.');
    }

    return { sessionId: session.url };
  }
);

export async function createUpgradeSession(input: z.infer<typeof CreateUpgradeSessionSchema>): Promise<{ sessionId: string }> {
  return createUpgradeSessionFlow(input);
}
