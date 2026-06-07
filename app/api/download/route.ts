import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const videoUrl = searchParams.get('url');
    const filename = searchParams.get('filename') || `vidflow-video.mp4`;

    if (!videoUrl) {
      return NextResponse.json({ error: 'Missing video URL' }, { status: 400 });
    }

    // Fetch the video server-side (no CORS restriction from server)
    const videoResponse = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VidFlow/1.0)',
      },
    });

    if (!videoResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch video' }, { status: 502 });
    }

    const contentType = videoResponse.headers.get('content-type') || 'video/mp4';
    const videoBuffer = await videoResponse.arrayBuffer();

    return new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(videoBuffer.byteLength),
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error: any) {
    console.error('Download proxy error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
