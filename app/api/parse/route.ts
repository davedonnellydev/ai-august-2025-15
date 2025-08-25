import { NextRequest, NextResponse } from 'next/server';
import Parser from '@postlight/parser';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (typeof url !== 'string' || url.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid url' },
        { status: 400 }
      );
    }

    // Postlight parser returns the parsed article object or throws on error
    const article = await Parser.parse(url, { contentType: 'markdown' });

    return NextResponse.json({ article });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Parser failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
