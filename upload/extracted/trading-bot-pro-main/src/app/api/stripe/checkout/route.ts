import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2026-02-25.clover',
});

export async function POST(request: NextRequest) {
  try {
    const { userId, planId, billingPeriod } = await request.json();

    if (!userId || !planId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Get user with subscription
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get plan from database
    const plan = await db.plan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: 'Invalid or inactive plan' }, { status: 400 });
    }

    // Create or get Stripe customer
    let customerId = user.subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId },
      });
      customerId = customer.id;

      // Update subscription with customer ID
      if (user.subscription) {
        await db.subscription.update({
          where: { id: user.subscription.id },
          data: { stripeCustomerId: customerId },
        });
      }
    }

    // Get price from plan
    const price = billingPeriod === 'YEARLY' ? plan.priceYearly : plan.priceMonthly;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: plan.currency || 'usd',
            product_data: {
              name: `${plan.displayName} Plan`,
              description: plan.description || `Trading Bot Pro - ${plan.displayName} subscription`,
            },
            unit_amount: Math.round(price * 100),
            recurring: {
              interval: billingPeriod === 'YEARLY' ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}?canceled=true`,
      metadata: {
        userId,
        planId: plan.id,
        planName: plan.name,
        billingPeriod: billingPeriod || 'MONTHLY',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
