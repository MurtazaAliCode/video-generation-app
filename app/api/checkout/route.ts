import { NextResponse } from 'next/server';
import { lemonSqueezySetup, createCheckout } from '@lemonsqueezy/lemonsqueezy.js';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

// Initialize LemonSqueezy
lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEEZY_API_KEY!,
});

// LemonSqueezy Variant IDs (You will get these after creating products in LemonSqueezy)
const PLANS = {
  starter: {
    name: 'Starter',
    credits: 50,
    variantId: process.env.LEMONSQUEEZY_VARIANT_STARTER!, // e.g. '123456'
  },
  pro: {
    name: 'Pro',
    credits: 150,
    variantId: process.env.LEMONSQUEEZY_VARIANT_PRO!, // e.g. '123457'
  },
  elite: {
    name: 'Elite',
    credits: 350,
    variantId: process.env.LEMONSQUEEZY_VARIANT_ELITE!, // e.g. '123458'
  },
};

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan } = await req.json();
    const selectedPlan = PLANS[plan as keyof typeof PLANS];

    if (!selectedPlan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    if (!process.env.LEMONSQUEEZY_STORE_ID) {
      throw new Error('Missing LEMONSQUEEZY_STORE_ID');
    }
    if (!selectedPlan.variantId) {
      throw new Error(`Missing LemonSqueezy Variant ID for plan: ${plan}`);
    }

    // Create LemonSqueezy Checkout
    const checkout = await createCheckout(
      process.env.LEMONSQUEEZY_STORE_ID,
      selectedPlan.variantId,
      {
        checkoutData: {
          custom: {
            userId: userId,
            plan: plan,
            credits: selectedPlan.credits.toString(),
          },
        },
        productOptions: {
          redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true&plan=${plan}`,
        },
      }
    );

    if (checkout.error) {
      throw new Error(checkout.error.message);
    }

    return NextResponse.json({ url: checkout.data?.data.attributes.url });
  } catch (error: any) {
    console.error('LemonSqueezy Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
