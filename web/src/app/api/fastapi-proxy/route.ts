import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

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

    // If this is a prediction endpoint and result is CONFIRMED, save to database
    if (endpoint === '/predict' && data.prediction === 'CONFIRMED') {
      try {
        const db = await getDatabase();
        const collection = db.collection('exoplanets');
        
        // Prepare the exoplanet document from the input data
        const exoplanetDoc: any = {
          planet_status: 'CONFIRMED',
          ...body,
          ml_prediction: {
            prediction: data.prediction,
            probabilities: data.probabilities,
            predicted_at: new Date().toISOString(),
          }
        };
        
        // Check if a planet with this data already exists
        // We can use a combination of unique fields to identify duplicates
        const existingPlanet = await collection.findOne({
          $or: [
            { name: body.name },
            {
              koi_period: body.koi_period,
              koi_depth: body.koi_depth,
              star_name: body.star_name
            }
          ]
        });
        
        if (!existingPlanet) {
          // Insert new confirmed planet
          const result = await collection.insertOne(exoplanetDoc);
          console.log('Saved confirmed planet to database:', result.insertedId);
          
          // Add database info to response
          data.saved_to_db = true;
          data.planet_id = result.insertedId.toString();
        } else {
          console.log('Planet already exists in database:', existingPlanet._id);
          data.saved_to_db = false;
          data.already_exists = true;
          data.planet_id = existingPlanet._id.toString();
        }
      } catch (dbError) {
        console.error('Error saving to database:', dbError);
        data.db_error = 'Failed to save to database';
      }
    }

    // Return the data from FastAPI (with added db info if applicable)
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

