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

    console.log('🔷 FastAPI Response:', {
      endpoint,
      prediction: data.prediction,
      willSave: endpoint === '/predict' && (data.prediction === 'CONFIRMED' || data.prediction === 'CANDIDATE')
    });

    // If this is a prediction endpoint and result is CONFIRMED or CANDIDATE, save to database
    if (endpoint === '/predict' && (data.prediction === 'CONFIRMED' || data.prediction === 'CANDIDATE')) {
      console.log('🟣 ENTERING SAVE BLOCK - Will attempt to save to database');
      console.log('🟣 Prediction:', data.prediction);
      console.log('🟣 Body received:', JSON.stringify(body, null, 2));
      try {
        const db = await getDatabase();
        const collection = db.collection('exoplanets');
        
        // Map form data to exoplanet schema compatible with Three.js scene
        console.log('🔵 Form data received - planet_name:', body.planet_name);
        
        const exoplanetDoc: any = {
          // Required fields for the scene
          name: body.planet_name || `Exoplanet-${Date.now()}`,
          radius: body.radius || body.koi_prad || null,  // Use direct radius first, then koi_prad
          mass: body.mass || body.koi_mass || null,  // Use direct mass first, then koi_mass
          temp_calculated: body.koi_teq || null,  // Map koi_teq to temp_calculated
          
          // Star properties (required for scene positioning)
          star_name: body.star_name || null,
          star_distance: body.star_distance || 1000,  // Default 1000 light years if not provided
          star_radius: body.koi_srad || null,
          star_mass: body.koi_smass || null,
          star_age: body.koi_sage || null,
          
          // Discovery metadata
          discovered: new Date().getFullYear(),
          discovery_method: 'Transit',
          
          // Store all the raw KOI data for reference
          koi_data: body,
          
          // ML prediction metadata
          ml_prediction: {
            prediction: data.prediction,
            probabilities: data.probabilities,
            predicted_at: new Date().toISOString(),
          },
          
          // Status and timestamps
          planet_status: data.prediction, // Either 'CONFIRMED' or 'CANDIDATE'
          created_at: new Date().toISOString(),
          added_via_ml: true,
        };
        
        console.log('🔵 Prepared document with name:', exoplanetDoc.name);
        
        // Check if a planet with this name already exists
        const existingPlanet = await collection.findOne({
          name: exoplanetDoc.name
        });
        
        if (!existingPlanet) {
          // Insert new confirmed planet
          console.log('🟢 Inserting planet to database...');
          const result = await collection.insertOne(exoplanetDoc);
          console.log('✅ SUCCESS! Saved confirmed planet to database!');
          console.log('   - Planet ID:', result.insertedId);
          console.log('   - Planet Name:', exoplanetDoc.name);
          console.log('   - Radius:', exoplanetDoc.radius);
          console.log('   - Distance:', exoplanetDoc.star_distance);
          
          // Add database info to response
          data.saved_to_db = true;
          data.planet_id = result.insertedId.toString();
        } else {
          console.log('🟡 Planet already exists in database');
          console.log('   - Existing ID:', existingPlanet._id);
          console.log('   - Name:', existingPlanet.name);
          data.saved_to_db = false;
          data.already_exists = true;
          data.planet_id = existingPlanet._id.toString();
        }
      } catch (dbError) {
        console.error('❌ Error saving to database:', dbError);
        console.error('❌ Error details:', dbError instanceof Error ? dbError.message : 'Unknown error');
        console.error('❌ Stack trace:', dbError instanceof Error ? dbError.stack : 'No stack trace');
        data.db_error = 'Failed to save to database';
        data.db_error_details = dbError instanceof Error ? dbError.message : 'Unknown error';
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

