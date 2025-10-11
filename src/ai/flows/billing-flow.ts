
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
import { FieldValue } from 'firebase-admin/firestore';

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

const UpdateSubscriptionSchema = z.object({
  subscriptionId: z.string(),
  isCreating: z.boolean(),
});

// --- Helper Functions ---

/**
 * Copies billing details from a payment method or customer to a new customer object.
 * This ensures that when a user subscribes, their billing information (name, address, etc.)
 * is correctly mirrored from the checkout session to their customer profile in Stripe.
 */
function copyBillingDetailsToCustomer(
  payment_method: Stripe.PaymentMethod | string | null,
  customer: Stripe.Customer | string | null
): Stripe.CustomerUpdateParams | undefined {
  if (!payment_method || typeof payment_method === 'string' || !customer || typeof customer !== 'string') {
    return;
  }
  const billingDetails = payment_method.billing_details;
  if (!billingDetails) return;

  const customerUpdate: Stripe.CustomerUpdateParams = {
    name: billingDetails.name ?? undefined,
    phone: billingDetails.phone ?? undefined,
    address: billingDetails.address ?? undefined,
  };

  return customerUpdate;
}


// --- Genkit Flows ---

const createCheckoutSessionFlow = ai.defineFlow(
  {
    name: 'createCheckoutSessionFlow',
    inputSchema: CreateCheckoutSessionSchema,
    outputSchema: z.object({ sessionId: z.string() }),
  },
  async ({ priceId, actor, name, organizationName, cnpj, contactEmail, contactPhone }) => {
    
    const user = await adminAuth.getUser(actor);

    const customer = await stripe.customers.create({
      email: user.email,
      name: name,
      metadata: {
        firebaseUID: actor,
      },
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      billing_address_collection: 'required',
      customer: customer.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/login?payment_success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/signup?plan=growth&payment_cancelled=true`,
      subscription_data: {
        metadata: {
            firebaseUID: actor,
            organizationName: organizationName,
            cnpj: cnpj,
            contactEmail: contactEmail || '',
            contactPhone: contactPhone || '',
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
      const { organizationId } = await getAdminAndOrg(actor);
      const orgDoc = await adminDb.collection('organizations').doc(organizationId).get();
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
      inputSchema: UpdateSubscriptionSchema,
      outputSchema: z.object({ success: z.boolean() }),
    },
    async ({ subscriptionId, isCreating }) => {
      
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['default_payment_method'],
      });
      
      const { firebaseUID, organizationName, cnpj, contactEmail, contactPhone } = subscription.metadata;

      if (!firebaseUID) {
        console.error('CRITICAL: Firebase UID not found in subscription metadata for subscription ID:', subscriptionId);
        throw new Error('Firebase UID not found in subscription metadata.');
      }
      
      const userRef = adminDb.collection('users').doc(firebaseUID);
      let orgRef;

      if (isCreating) {
        if (!organizationName || !cnpj) {
            console.error('CRITICAL: Organization details missing in subscription metadata for subscription ID:', subscriptionId);
            throw new Error('Organization details missing in subscription metadata.');
        }

        orgRef = await adminDb.collection('organizations').add({
          name: organizationName,
          cnpj,
          contactEmail,
          contactPhone,
          owner: firebaseUID,
          stripeCustomerId: subscription.customer,
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
          stripeSubscriptionStatus: subscription.status,
          createdAt: FieldValue.serverTimestamp(),
        });
        
        const planId = subscription.items.data[0].price.id === process.env.NEXT_PUBLIC_STRIPE_PERFORMANCE_PLAN_PRICE_ID ? 'performance' : 'growth';

        await userRef.set({
            organizationId: orgRef.id,
            planId: planId,
            stripeSubscriptionStatus: subscription.status,
            role: 'admin',
            permissions: {
                qoroCrm: true,
                qoroPulse: true,
                qoroTask: true,
                qoroFinance: true,
            }
        }, { merge: true });

        await adminAuth.setCustomUserClaims(firebaseUID, { organizationId: orgRef.id, role: 'admin', planId });
        
        const customerUpdateParams = copyBillingDetailsToCustomer(
            subscription.default_payment_method,
            subscription.customer
        );
        if (customerUpdateParams) {
            await stripe.customers.update(subscription.customer as string, customerUpdateParams);
        }

      } else {
         const userDoc = await userRef.get();
         if (!userDoc.exists) {
            console.error(`CRITICAL: User document not found for UID: ${firebaseUID} during subscription update.`);
            throw new Error(`Usuário não encontrado durante a atualização da assinatura.`);
         }
         const organizationId = userDoc.data()?.organizationId;
         if (!organizationId) {
             throw new Error(`Organização não encontrada para o UID: ${firebaseUID}`);
         }
         orgRef = adminDb.collection('organizations').doc(organizationId);

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

export async function updateSubscription(input: z.infer<typeof UpdateSubscriptionSchema>): Promise<{ success: boolean }> {
  return updateSubscriptionFlow(input);
}
