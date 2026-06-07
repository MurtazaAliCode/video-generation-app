import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ videos: [] });
    }

    const videos = await prisma.video.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20, // Last 20 generations
      select: {
        id: true,
        prompt: true,
        videoUrl: true,
        cost: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ videos });
  } catch (error: any) {
    console.error('Videos API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
