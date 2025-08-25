import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { MODEL } from '@/app/config/constants';
import { ServerRateLimiter } from '@/app/lib/utils/api-helpers';

export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Server-side rate limiting
    if (!ServerRateLimiter.checkLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const { input, summaryInstructions } = await request.json();

    // Environment validation
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OpenAI API key not configured');
      return NextResponse.json(
        { error: 'Translation service temporarily unavailable' },
        { status: 500 }
      );
    }

    const client = new OpenAI({
      apiKey,
    });

    // Enhanced content moderation
    const moderatedText = await client.moderations.create({
      input,
    });

    const { flagged, categories } = moderatedText.results[0];

    if (flagged) {
      const keys: string[] = Object.keys(categories);
      const flaggedCategories = keys.filter(
        (key: string) => categories[key as keyof typeof categories]
      );
      return NextResponse.json(
        {
          error: `Content flagged as inappropriate: ${flaggedCategories.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const userInput: string = `TASK:
    ${summaryInstructions}
    
    CONTENT:
    ${input}`;

    const instructions: string = `You are a precise summarizer. You will ONLY use facts present in the provided CONTENT (Markdown from a single web page). 
        Rules:
        - Do not browse, guess, or invent facts; if something isn't stated, write “Not specified”.
        - Ignore boilerplate (cookie notices, nav, footers, unrelated promos).
        - Keep dates, numbers, names exact as written; include units and currencies.
        - If CONTENT is empty/very short (<300 chars), return “No substantive content to summarize.”
        - If CONTENT is not in English, summarize in the same language.
        - If there are multiple sections, map your points to the structure present (headings, lists).
        - Prefer concise wording over flowery prose.
        `;

    const response = await client.responses.create({
      model: MODEL,
      instructions,
      input: userInput,
    });

    if (response.status !== 'completed') {
      throw new Error(`Responses API error: ${response.status}`);
    }

    return NextResponse.json({
      response: response.output_text || 'Response recieved',
      originalInput: input,
      summaryInstructions,
      remainingRequests: ServerRateLimiter.getRemaining(ip),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'OpenAI failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
