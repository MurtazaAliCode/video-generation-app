import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 1. Verify Signature
    const rawBody = await req.text();
    const signature = req.headers.get('x-signature') || '';
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || '';

    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
    const signatureBuffer = Buffer.from(signature, 'utf8');

    if (!crypto.timingSafeEqual(digest, signatureBuffer)) {
      console.error('Invalid LemonSqueezy signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 2. Parse Body
    const event = JSON.parse(rawBody);

    // 3. Handle Order Created Event
    if (event.meta.event_name === 'order_created') {
      const customData = event.meta.custom_data;
      const { userId, credits } = customData;
      const customerEmail = event.data.attributes.user_email;

      if (!userId || !credits) {
        throw new Error('Missing custom data in webhook');
      }

      // Add credits to the user in our database
      await prisma.user.upsert({
        where: { clerkId: userId },
        update: {
          credits: { increment: parseInt(credits) },
        },
        create: {
          clerkId: userId,
          email: customerEmail || '',
          credits: parseInt(credits),
        },
      });

      console.log(`✅ LemonSqueezy: Added ${credits} credits to user ${userId}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Webhook Error:', err.message);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
