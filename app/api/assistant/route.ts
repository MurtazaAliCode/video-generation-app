import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SYSTEM_INSTRUCTION = `
You are VidFlow AI Assistant, a warm, helpful, and friendly helper on the VidFlow AI video generation platform.
You guide users on how to make the best AI videos and how the platform works.
Keep responses concise (1-3 short paragraphs), conversational, and polite.
Answer in the same language the user uses (e.g., if they ask in Roman Urdu, answer in Roman Urdu; if Urdu, answer in Urdu; if English, answer in English).

Key platform information to help guide users:
- **AI Model**: VidFlow uses the state-of-the-art Wan 2.1 AI model (Text-to-Video) for hyper-realistic and high-quality generation.
- **Video Durations**: 5-second video generations are optimized for extreme speed (30-90 seconds) and high physical consistency (costs 3 credits). If they ask for longer videos (like 59 seconds), explain that standard AI video models are built for short high-quality shots (5s), and they can stitch multiple 5s clips together or keep them short for best results!
- **Prompts**: Users can write prompts in Urdu, Roman Urdu, English, or any language. Suggest that for maximum accuracy, English prompts are recommended, but they can write in any zaban!
- **Writing Good Prompts**: Tell them to include details about camera angles ("cinematic shot", "close-up"), lighting ("neon glow", "golden hour"), mood, and movement.
- **Credits & Plans**: If they ask about credits, they get 15 free credits to start. Starter ($4.99/mo) gives 50 credits, Pro ($14.99/mo) gives 150 credits, and Elite ($29.99/mo) gives 350 credits. They can buy more credits on the Pricing page!
`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;

    // Fallback Mock Assistant for local development/testing if API key is not set
    if (!geminiKey || geminiKey === 'your_gemini_api_key_here') {
      const lastUserMsg = messages[messages.length - 1]?.content || '';
      console.log('🤖 Using Mock Assistant Fallback (No GEMINI_API_KEY set)');

      let reply = '';
      const lowerMsg = lastUserMsg.toLowerCase();

      if (lowerMsg.includes('credits') || lowerMsg.includes('cradit') || lowerMsg.includes('price') || lowerMsg.includes('plan')) {
        reply = "Aap pricing plans check kar sakte hain! Humare paas 3 premium plans hain:\n\n1. **Starter** ($4.99/mo) — 50 Credits\n2. **Pro** ($14.99/mo) — 150 Credits\n3. **Elite** ($29.99/mo) — 350 Credits\n\nAap pricing page par ja kar inhen buy kar sakte hain aur aapke credits instant add ho jayenge!";
      } else if (lowerMsg.includes('urdu') || lowerMsg.includes('roman') || lowerMsg.includes('zaban') || lowerMsg.includes('language')) {
        reply = "Ji haan! Aap bilkul Urdu, Roman Urdu, ya kisi bhi zaban me prompts de sakte hain. Lekin sabse behtareen aur accurate videos ke liye English prompts generate karna behtar hota hai. Agar aapko madad chahiye, to mujhe batayein, main aapke prompt ko English me translate kar doonga!";
      } else if (lowerMsg.includes('59') || lowerMsg.includes('seconds') || lowerMsg.includes('time') || lowerMsg.includes('duration') || lowerMsg.includes('lambi')) {
        reply = "VidFlow me aap max 59 seconds tak ki options dekh sakte hain, lekin best AI video quality aur fast generation ke liye **5-second** video highly optimized hai (sirf 3 credits me!). Standard AI video models natively 5s ke clips generate karte hain, jisse quality top-notch rehti hai.";
      } else {
        reply = "Salam! Main aapka VidFlow AI Assistant hoon. Main aapko behtareen AI video prompts likhne aur platform ke baare me guide kar sakta hoon. Mujhse koi bhi sawal Urdu ya English me poochein!";
      }

      // Simulate a small delay for premium feels
      await new Promise((resolve) => setTimeout(resolve, 800));

      return NextResponse.json({ reply });
    }

    // Convert message history to Gemini API format
    const contents = messages.map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    // Call Gemini API using fetch
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: contents,
          systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }],
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API Error details:', errText);
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const resData = await response.json();
    const reply = resData.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I am facing an issue understanding that. Please try again!';

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Assistant API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate assistant response' },
      { status: 500 }
    );
  }
}
