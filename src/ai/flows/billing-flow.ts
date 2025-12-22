'use server';
/**
 * @fileOverview Billing and subscription management flows.
 * - createCheckoutSession: Creates a Stripe Checkout session for a user to subscribe.
 * - createBillingPortalSession: Creates a Stripe Billing Portal session for a user to manage their subscription.
 * - verifyCheckoutSession: Verifies a checkout session and triggers subscription updates.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';
import { stripe } from '@/lib/stripe';
import { getAdminAndOrg } from '@/services/utils';
import { handleSubscriptionChange } from '@/services/organizationService';

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

const VerifyCheckoutSessionSchema = z.object({
  sessionId: z.string(),
  actor: z.string(),
});

const createCheckoutSessionFlow = ai.defineFlow(
  {
    name: 'createCheckoutSessionFlow',
    inputSchema: CreateCheckoutSessionSchema,
    outputSchema: z.object({ sessionId: z.string() }),
  },
  async ({ priceId, actor, name, organizationName, cnpj, contactEmail, contactPhone }) => {
    
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://qoro.dev';
    
    // The webhook now relies on metadata to create the user profile.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      billing_address_collection: 'required',
      line_items: [{ price: priceId, quantity: 1 }],
      // Add the session_id to the success URL for manual verification
      success_url: `${siteUrl}/dashboard?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/signup?plan=${priceId}&payment_cancelled=true`,
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
      
      const portalConfigurationId = process.env.STRIPE_PORTAL_CONFIGURATION_ID;
      if (!portalConfigurationId) {
          throw new Error("O ID de configuração do portal do Stripe não está definido no ambiente.");
      }

      const { url } = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        configuration: portalConfigurationId,
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://qoro.dev'}/dashboard/settings`,
      });
  
      return { url };
    }
  );

const verifyCheckoutSessionFlow = ai.defineFlow(
  {
    name: 'verifyCheckoutSessionFlow',
    inputSchema: VerifyCheckoutSessionSchema,
    outputSchema: z.object({ success: z.boolean(), message: z.string() }),
  },
  async ({ sessionId, actor }) => {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription'],
      });

      if (session.status !== 'complete') {
        throw new Error('A sessão de checkout não foi concluída.');
      }

      const subscription = session.subscription as any; // Expand gives us the full object
      if (!subscription) {
        throw new Error('Detalhes da assinatura não encontrados na sessão.');
      }
      
      const priceId = subscription.items?.data?.[0]?.price?.id;
      if (!priceId) {
        throw new Error('ID do plano não encontrado na assinatura.');
      }

      // We have the subscription details, now trigger the same logic the webhook uses.
      // This ensures consistency whether the update comes from the webhook or manual verification.
      await handleSubscriptionChange(subscription.id, priceId, subscription.status);

      return { success: true, message: 'Assinatura verificada e atualizada com sucesso!' };

    } catch (error: any) {
      console.error(`Falha na verificação manual da sessão de checkout ${sessionId}:`, error);
      // We don't throw an error back to the client to avoid a scary error message.
      // The PlanContext polling will eventually catch the update.
      return { success: false, message: error.message || 'Erro desconhecido durante a verificação.' };
    }
  }
);
  

// --- Exported Functions ---

export async function createCheckoutSession(input: z.infer<typeof CreateCheckoutSessionSchema>): Promise<{ sessionId: string }> {
  return createCheckoutSessionFlow(input);
}

export async function createBillingPortalSession(input: z.infer<typeof CreateBillingPortalSessionSchema>): Promise<{ url: string }> {
  return createBillingPortalSessionFlow(input);
}

export async function verifyCheckoutSession(input: z.infer<typeof VerifyCheckoutSessionSchema>): Promise<{ success: boolean; message: string; }> {
  return verifyCheckoutSessionFlow(input);
}
