import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2026-02-25.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, planId, planName, billingPeriod } = (session.metadata || {}) as {
          userId?: string;
          planId?: string;
          planName?: string;
          billingPeriod?: string;
        };

        if (userId && (planId || planName)) {
          // Get plan details
          let plan;
          if (planId) {
            plan = await db.plan.findUnique({ where: { id: planId } });
          } else if (planName) {
            plan = await db.plan.findFirst({ where: { name: planName } });
          }

          // Update or create subscription
          const existingSub = await db.subscription.findUnique({
            where: { userId },
          });

          if (existingSub) {
            await db.subscription.update({
              where: { id: existingSub.id },
              data: {
                planId: plan?.id || null,
                planName: plan?.name || planName || 'TRIAL',
                status: 'ACTIVE',
                isTrial: false,
                stripeSubscriptionId: session.subscription as string,
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(
                  Date.now() + (billingPeriod === 'YEARLY' ? 365 : 30) * 24 * 60 * 60 * 1000
                ),
                maxTradesPerDay: plan?.maxTradesPerDay || -1,
                maxActiveTrades: plan?.maxActiveTrades || -1,
              },
            });
          } else {
            await db.subscription.create({
              data: {
                userId,
                planId: plan?.id || null,
                planName: plan?.name || planName || 'TRIAL',
                status: 'ACTIVE',
                isTrial: false,
                stripeSubscriptionId: session.subscription as string,
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(
                  Date.now() + (billingPeriod === 'YEARLY' ? 365 : 30) * 24 * 60 * 60 * 1000
                ),
                maxTradesPerDay: plan?.maxTradesPerDay || -1,
                maxActiveTrades: plan?.maxActiveTrades || -1,
              },
            });
          }

          // Create payment record
          await db.payment.create({
            data: {
              userId,
              amount: (session.amount_total || 0) / 100,
              currency: session.currency || 'usd',
              status: 'COMPLETED',
              stripePaymentIntentId: session.payment_intent as string,
              planName: plan?.name || planName || 'UNKNOWN',
              billingPeriod: billingPeriod || 'MONTHLY',
            },
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const dbSubscription = await db.subscription.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (dbSubscription) {
          const subData = subscription as unknown as {
            current_period_start: number;
            current_period_end: number;
            cancel_at_period_end: boolean;
          };
          await db.subscription.update({
            where: { id: dbSubscription.id },
            data: {
              status: subscription.status === 'active' ? 'ACTIVE' : 'CANCELLED',
              currentPeriodStart: new Date(subData.current_period_start * 1000),
              currentPeriodEnd: new Date(subData.current_period_end * 1000),
              cancelAtPeriodEnd: subData.cancel_at_period_end,
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const dbSubscription = await db.subscription.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (dbSubscription) {
          await db.subscription.update({
            where: { id: dbSubscription.id },
            data: {
              status: 'CANCELLED',
              planName: 'TRIAL',
            },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const dbSubscription = await db.subscription.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (dbSubscription) {
          await db.subscription.update({
            where: { id: dbSubscription.id },
            data: { status: 'PAST_DUE' },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}
