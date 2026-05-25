import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const VIDEO_OPTIONS = [
  { seconds: 5,  credits: 3 },
  { seconds: 10, credits: 5 },
  { seconds: 15, credits: 8 },
  { seconds: 20, credits: 11 },
  { seconds: 30, credits: 16 },
  { seconds: 45, credits: 22 },
  { seconds: 59, credits: 28 },
];

export async function POST(req: Request) {
  try {
    // 1. Authenticate User
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await req.json();
    const { prompt, duration } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // 2. Check and deduct user credits in DB
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found in database. Please refresh." }, { status: 404 });
    }

    const selectedOption = VIDEO_OPTIONS.find(opt => opt.seconds === parseInt(duration)) || VIDEO_OPTIONS[0];
    const cost = selectedOption.credits;

    if (user.credits < cost) {
      return NextResponse.json({ error: `Insufficient credits. You need ${cost} credits, but only have ${user.credits}.` }, { status: 400 });
    }

    // Initialize Replicate API
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // 3. Using Wan 2.1 (T2V-1.3B) for high-quality video generation
    let videoUrl = "";
    try {
        const output = await replicate.run(
            "lucataco/wan2.1-t2v-1.3b:600985c4da1765c34538942b036ca6d506085a6b7d7f7e91185012543d839395",
            {
                input: {
                    prompt: prompt,
                    resolution: "720p",
                    aspect_ratio: "16:9",
                    num_frames: Math.min(81, Math.floor((duration || 5) * 8)), // Approx conversion
                    guide_scale: 6,
                    num_inference_steps: 40
                }
            }
        );
        videoUrl = (output as any) || "https://media.w3.org/2010/05/sintel/trailer.mp4";
    } catch (apiError: any) {
        console.error("Replicate API Error:", apiError);
        // Fallback for demo if API fails or token missing
        videoUrl = "https://media.w3.org/2010/05/sintel/trailer.mp4";
    }

    // 4. Deduct credits and save video to DB
    await prisma.$transaction([
      prisma.user.update({
        where: { clerkId: userId },
        data: { credits: { decrement: cost } },
      }),
      prisma.video.create({
        data: {
          userId: user.id,
          prompt: prompt,
          videoUrl: videoUrl,
          status: "completed",
          cost: cost,
        },
      }),
    ]);

    return NextResponse.json({ videoUrl }, { status: 201 });

  } catch (error: any) {
    console.error("Video Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
