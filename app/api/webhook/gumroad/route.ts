import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // Gumroad sends content as application/x-www-form-urlencoded
    const formData = await req.formData();
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    console.log("📦 Gumroad Webhook Received Payload:", data);

    const userId = data.clerk_user_id;
    const permalink = data.permalink || ''; // e.g. "starter", "pro", "elite"
    const customerEmail = data.email;

    if (!userId) {
      console.error("❌ Missing clerk_user_id in Gumroad Webhook");
      return NextResponse.json({ error: "Missing clerk_user_id" }, { status: 400 });
    }

    // Determine plan and credits based on the permalink or custom parameters
    let credits = 50; // fallback default
    let plan = 'starter';

    const normalizedPermalink = permalink.toLowerCase();
    if (normalizedPermalink.includes('elite')) {
      credits = 350;
      plan = 'elite';
    } else if (normalizedPermalink.includes('pro')) {
      credits = 150;
      plan = 'pro';
    } else {
      credits = 50;
      plan = 'starter';
    }

    // Add credits to the user in database
    await prisma.user.upsert({
      where: { clerkId: userId },
      update: {
        credits: { increment: credits },
        plan: plan,
      },
      create: {
        clerkId: userId,
        email: customerEmail || '',
        credits: credits,
        plan: plan,
      },
    });

    console.log(`✅ Gumroad: Added ${credits} credits to user ${userId}`);
    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Gumroad Webhook Error:', err.message);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
