import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user in Prisma database
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    // If user doesn't exist, create it with 15 free credits
    if (!user) {
      const clerkUser = await currentUser();
      const email = clerkUser?.emailAddresses[0]?.emailAddress || '';
      
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: email,
          credits: 15, // 15 free credits on signup
          plan: 'free',
        },
      });
      console.log(`🆕 Created database entry for new user: ${userId} with 15 free credits.`);
    }

    return NextResponse.json({
      credits: user.credits,
      plan: user.plan,
    });
  } catch (error: any) {
    console.error('API User Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
