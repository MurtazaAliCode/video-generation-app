import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Gumroad seller ID for basic verification
const GUMROAD_SELLER_ID = process.env.GUMROAD_SELLER_ID || '';

export async function POST(req: Request) {
  let rawBody = '';
  let parsedData: Record<string, any> = {};
  let status = 200;
  let errorMessage: string | null = null;

  try {
    // Read raw body as text first to avoid payload parsing issues
    rawBody = await req.text();
    
    // Parse the body. Gumroad sends application/x-www-form-urlencoded
    try {
      const searchParams = new URLSearchParams(rawBody);
      searchParams.forEach((value, key) => {
        parsedData[key] = value;
      });
    } catch (parseErr: any) {
      console.error('⚠️ URLSearchParams parsing failed, trying JSON:', parseErr.message);
      try {
        parsedData = JSON.parse(rawBody);
      } catch (jsonErr: any) {
        console.error('⚠️ JSON parsing also failed');
      }
    }

    console.log('📦 Gumroad Webhook Raw Body:', rawBody);
    console.log('📦 Gumroad Webhook Parsed:', JSON.stringify(parsedData, null, 2));

    // Check seller verification
    if (GUMROAD_SELLER_ID && parsedData.seller_id !== GUMROAD_SELLER_ID) {
      errorMessage = `Invalid seller_id: expected ${GUMROAD_SELLER_ID}, got ${parsedData.seller_id}`;
      console.error('❌ ' + errorMessage);
      status = 401;
      
      // Save log before exiting
      await prisma.webhookLog.create({
        data: {
          provider: 'gumroad',
          payload: JSON.stringify({ rawBody, parsedData }),
          error: errorMessage,
          status,
        },
      });

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only process successful sales (not refunds/cancellations)
    const saleRefunded = parsedData.refunded === 'true';
    if (saleRefunded) {
      console.log('↩️ Refund detected — skipping credit addition');
      await prisma.webhookLog.create({
        data: {
          provider: 'gumroad',
          payload: JSON.stringify({ rawBody, parsedData }),
          error: 'Refund skipped',
          status: 200,
        },
      });
      return NextResponse.json({ received: true, action: 'refund_skipped' });
    }

    // Identify user
    const userId = parsedData.custom_fields
      ? (() => {
          try {
            const cf = JSON.parse(parsedData.custom_fields);
            return cf.clerk_user_id || parsedData.clerk_user_id || null;
          } catch {
            return parsedData.clerk_user_id || null;
          }
        })()
      : parsedData.clerk_user_id || null;

    const customerEmail = parsedData.email || '';
    const permalink = (parsedData.permalink || '').toLowerCase();

    if (!userId && !customerEmail) {
      errorMessage = 'Missing clerk_user_id and email in Gumroad webhook';
      console.error('❌ ' + errorMessage);
      status = 400;

      await prisma.webhookLog.create({
        data: {
          provider: 'gumroad',
          payload: JSON.stringify({ rawBody, parsedData }),
          error: errorMessage,
          status,
        },
      });

      return NextResponse.json({ error: 'Missing user identifier' }, { status: 400 });
    }

    // Plan mapping
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
      // Find user by email
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
        errorMessage = `User with email ${customerEmail} not found in database. Cannot add credits.`;
        console.error('❌ ' + errorMessage);
        status = 404;

        await prisma.webhookLog.create({
          data: {
            provider: 'gumroad',
            payload: JSON.stringify({ rawBody, parsedData }),
            error: errorMessage,
            status,
          },
        });

        return NextResponse.json({ error: 'User not found for email fallback' }, { status: 404 });
      }
    }

    // Save success log
    await prisma.webhookLog.create({
      data: {
        provider: 'gumroad',
        payload: JSON.stringify({ rawBody, parsedData, creditsAdded: credits, plan, userId, customerEmail }),
        error: null,
        status: 200,
      },
    });

    return NextResponse.json({ received: true, credits_added: credits, plan });

  } catch (err: any) {
    errorMessage = `Webhook error: ${err.message}`;
    console.error('❌ ' + errorMessage);
    status = 500;

    try {
      await prisma.webhookLog.create({
        data: {
          provider: 'gumroad',
          payload: JSON.stringify({ rawBody, parsedData }),
          error: errorMessage,
          status: 500,
        },
      });
    } catch (logErr) {
      console.error('❌ Failed to save error to WebhookLog:', logErr);
    }

    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
