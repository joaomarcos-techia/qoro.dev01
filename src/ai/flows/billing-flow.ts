
'use server';
/**
 * @fileOverview Billing and subscription management flows.
 * - createStripeCheckoutSession - Creates a new Stripe checkout session for a user to subscribe.
 * - stripeWebhookFlow - Handles incoming webhook events from Stripe to sync subscription status.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAdminAndOrg } from '@/services/utils';
import { adminDb } from '@/lib/firebase-admin';
import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
    console.warn("STRIPE_SECRET_KEY is not set. Billing flows will not work.");
}
const stripe = new Stripe(STRIPE_SECRET_KEY || '', { apiVersion: '2024-04-10' });

const CreateCheckoutSchema = z.object({
    priceId: z.string(),
    actor: z.string(),
});

const createStripeCheckoutSessionFlow = ai.defineFlow(
    {
        name: 'createStripeCheckoutSessionFlow',
        inputSchema: CreateCheckoutSchema,
        outputSchema: z.object({ url: z.string().url() }),
    },
    async ({ priceId, actor }) => {
        if (!stripe) throw new Error("Stripe is not configured.");

        // Validate that priceId is a Stripe Price ID, not a Product ID.
        if (!priceId.startsWith('price_')) {
            throw new Error(`Invalid Stripe Price ID: "${priceId}". Please check your environment variables (e.g., NEXT_PUBLIC_STRIPE_GROWTH_PLAN_PRICE_ID) and ensure you are using a Price ID (starting with 'price_') and not a Product ID.`);
        }
        
        const { organizationId, userData } = await getAdminAndOrg(actor);
        
        let customerId = userData.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: userData.email,
                name: userData.name,
                metadata: {
                    organizationId: organizationId,
                }
            });
            customerId = customer.id;
            await adminDb.collection('users').doc(actor).update({ stripeCustomerId: customerId });
        }
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            mode: 'subscription',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/#precos`,
            customer: customerId,
        });

        if (!session.url) {
            throw new Error("Could not create Stripe checkout session.");
        }

        return { url: session.url };
    }
);

export async function createStripeCheckoutSession(input: z.infer<typeof CreateCheckoutSchema>): Promise<{ url: string }> {
    return await createStripeCheckoutSessionFlow(input);
}


// Stripe Webhook Flow
export const stripeWebhookFlow = ai.defineFlow(
    {
        name: "stripeWebhookFlow",
        inputSchema: z.any(),
        outputSchema: z.any(),
    },
    async (payload, streamingCallback, context) => {
        if (!stripe) throw new Error("Stripe is not configured.");
        const signature = context?.headers ? (context.headers['stripe-signature'] as string) : '';
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!webhookSecret) {
            throw new Error("Stripe webhook secret is not configured.");
        }
        
        let event;
        try {
            event = stripe.webhooks.constructEvent(payload as Buffer, signature, webhookSecret);
        } catch (err: any) {
            console.error(`Webhook signature verification failed.`, err.message);
            throw new Error(`Webhook Error: ${err.message}`);
        }

        const session = event.data.object as Stripe.Checkout.Session;

        switch (event.type) {
            case 'checkout.session.completed':
                if (!session.subscription || !session.customer) {
                    throw new Error("Webhook Error: Missing subscription or customer ID in session.");
                }

                const subscription = await stripe.subscriptions.retrieve(session.subscription.toString());
                const customer = await stripe.customers.retrieve(session.customer.toString()) as Stripe.Customer;
                const organizationId = customer.metadata.organizationId;
                
                if (!organizationId) {
                    throw new Error("Webhook Error: Organization ID not found in customer metadata.");
                }

                await adminDb.collection('organizations').doc(organizationId).update({
                    stripeSubscriptionId: subscription.id,
                    stripeCustomerId: subscription.customer,
                    stripePriceId: subscription.items.data[0].price.id,
                    stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
                });
                break;
            case 'invoice.payment_succeeded':
                if (session.subscription) {
                    const subscription = await stripe.subscriptions.retrieve(session.subscription.toString());
                    const customer = await stripe.customers.retrieve(subscription.customer.toString()) as Stripe.Customer;
                    const organizationId = customer.metadata.organizationId;
                    await adminDb.collection('organizations').doc(organizationId).update({
                        stripePriceId: subscription.items.data[0].price.id,
                        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
                    });
                }
                break;
             case 'customer.subscription.deleted':
             case 'customer.subscription.updated':
                if(session.customer) {
                     const customer = await stripe.customers.retrieve(session.customer as string) as Stripe.Customer;
                     if (!customer.deleted) {
                         const organizationId = customer.metadata.organizationId;
    
                         await adminDb.collection('organizations').doc(organizationId).update({
                            stripePriceId: null,
                            stripeSubscriptionId: null,
                            stripeCurrentPeriodEnd: null,
                        });
                     }
                }
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        return { received: true };
    }
);


