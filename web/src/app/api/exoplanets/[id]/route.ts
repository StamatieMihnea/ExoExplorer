import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection('exoplanets');

    // Project only the fields we need
    const projection = {
      _id: 1,
      name: 1,
      mass: 1,
      radius: 1,
      discovered: 1,
      temp_calculated: 1,
      temp_measured: 1,
      star_name: 1,
      star_distance: 1,
      star_mass: 1,
      star_radius: 1,
      star_age: 1,
      texture_high_url: 1,
      texture_low_url: 1,
    };

    // Find exoplanet by ID
    const exoplanet = await collection.findOne(
      { _id: new ObjectId(id) },
      { projection }
    );

    if (!exoplanet) {
      return NextResponse.json(
        { error: 'Exoplanet not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(exoplanet);
  } catch (error) {
    console.error('Error fetching exoplanet:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exoplanet' },
      { status: 500 }
    );
  }
}

