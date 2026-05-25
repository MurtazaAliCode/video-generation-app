import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

const PLANS = {
  starter: {
    name: 'Starter',
    credits: 50,
    url: process.env.GUMROAD_URL_STARTER!,
  },
  pro: {
    name: 'Pro',
    credits: 150,
    url: process.env.GUMROAD_URL_PRO!,
  },
  elite: {
    name: 'Elite',
    credits: 350,
    url: process.env.GUMROAD_URL_ELITE!,
  },
};

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    if (!userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan } = await req.json();
    const selectedPlan = PLANS[plan as keyof typeof PLANS];

    if (!selectedPlan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    if (!selectedPlan.url) {
      throw new Error(`Missing Gumroad URL for plan: ${plan}`);
    }

    // Get primary email
    const emailAddress = user.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId
    )?.emailAddress || '';

    // Construct Gumroad payment link with custom clerk_user_id AND email for prefilling
    const redirectUrl = `${selectedPlan.url}?clerk_user_id=${userId}&email=${encodeURIComponent(emailAddress)}`;

    return NextResponse.json({ url: redirectUrl });
  } catch (error: any) {
    console.error('Gumroad Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
