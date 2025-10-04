import { NextRequest, NextResponse } from 'next/server';

// Base URL for FastAPI backend
const FASTAPI_BASE_URL = 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    // Get the endpoint path from query params
    const searchParams = request.nextUrl.searchParams;
    const endpoint = searchParams.get('endpoint') || '/';

    // Make the fetch call to FastAPI
    const response = await fetch(`${FASTAPI_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Check if the response is ok
    if (!response.ok) {
      return NextResponse.json(
        { error: `FastAPI returned status ${response.status}` },
        { status: response.status }
      );
    }

    // Get the JSON data from FastAPI
    const data = await response.json();

    // Return the data from FastAPI
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error calling FastAPI:', error);
    return NextResponse.json(
      { 
        error: 'Failed to connect to FastAPI server',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the endpoint path from query params
    const searchParams = request.nextUrl.searchParams;
    const endpoint = searchParams.get('endpoint') || '/';

    // Get the body from the request
    const body = await request.json();

    // Make the fetch call to FastAPI
    const response = await fetch(`${FASTAPI_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Check if the response is ok
    if (!response.ok) {
      return NextResponse.json(
        { error: `FastAPI returned status ${response.status}` },
        { status: response.status }
      );
    }

    // Get the JSON data from FastAPI
    const data = await response.json();

    // Return the data from FastAPI
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error calling FastAPI:', error);
    return NextResponse.json(
      { 
        error: 'Failed to connect to FastAPI server',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

