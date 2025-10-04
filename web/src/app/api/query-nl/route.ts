import { NextRequest, NextResponse } from 'next/server';
import { queryExoplanetsWithNaturalLanguage } from '../../../lib/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Execute natural language query
    const results = await queryExoplanetsWithNaturalLanguage(query);

    // Extract only the IDs from the results
    const ids = results.map((exoplanet: any) => exoplanet._id.toString());

    return NextResponse.json(ids);

  } catch (error) {
    console.error('Error processing natural language query:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process query',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

