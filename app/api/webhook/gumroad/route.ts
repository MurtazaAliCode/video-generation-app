import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Gumroad seller ID for basic verification
const GUMROAD_SELLER_ID = process.env.GUMROAD_SELLER_ID || '';

export async function POST(req: Request) {
  try {
    // Gumroad sends data as application/x-www-form-urlencoded
    const formData = await req.formData();
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    console.log('📦 Gumroad Webhook Received:', JSON.stringify(data, null, 2));

    // Basic seller verification — ensure ping is from our Gumroad account
    if (GUMROAD_SELLER_ID && data.seller_id !== GUMROAD_SELLER_ID) {
      console.error('❌ Invalid seller_id — possible fake request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only process successful sales (not refunds/cancellations)
    const saleRefunded = data.refunded === 'true';
    if (saleRefunded) {
      console.log('↩️ Refund detected — skipping credit addition');
      return NextResponse.json({ received: true, action: 'refund_skipped' });
    }

    // Get user ID passed via checkout URL as ?clerk_user_id=xxx
    const userId = data.custom_fields
      ? (() => {
          try {
            const cf = JSON.parse(data.custom_fields);
            return cf.clerk_user_id || data.clerk_user_id || null;
          } catch {
            return data.clerk_user_id || null;
          }
        })()
      : data.clerk_user_id || null;

    const customerEmail = data.email || '';
    const permalink = (data.permalink || '').toLowerCase();

    if (!userId && !customerEmail) {
      console.error('❌ Missing clerk_user_id and email in Gumroad webhook');
      return NextResponse.json({ error: 'Missing user identifier' }, { status: 400 });
    }

    // Map product permalink to credits + plan name
    let credits = 50;
    let plan = 'starter';

    if (permalink.includes('elite')) {
      credits = 350;
      plan = 'elite';
    } else if (permalink.includes('pro')) {
      credits = 150;
      plan = 'pro';
    } else {
      credits = 50;
      plan = 'starter';
    }

    // Add credits to user in database
    if (userId) {
      await prisma.user.upsert({
        where: { clerkId: userId },
        update: {
          credits: { increment: credits },
          plan: plan,
        },
        create: {
          clerkId: userId,
          email: customerEmail,
          credits: credits,
          plan: plan,
        },
      });
      console.log(`✅ Gumroad: Added ${credits} credits (${plan} plan) to user ${userId} (clerkId)`);
    } else if (customerEmail) {
      // Fallback to searching by email
      const dbUser = await prisma.user.findUnique({
        where: { email: customerEmail }
      });
      
      if (dbUser) {
        await prisma.user.update({
          where: { email: customerEmail },
          data: {
            credits: { increment: credits },
            plan: plan,
          }
        });
        console.log(`✅ Gumroad: Added ${credits} credits (${plan} plan) to user ${customerEmail} (email)`);
      } else {
        console.error(`❌ User with email ${customerEmail} not found in database. Cannot add credits.`);
        return NextResponse.json({ error: 'User not found for email fallback' }, { status: 404 });
      }
    }

    return NextResponse.json({ received: true, credits_added: credits, plan });

  } catch (err: any) {
    console.error('❌ Gumroad Webhook Error:', err.message);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
