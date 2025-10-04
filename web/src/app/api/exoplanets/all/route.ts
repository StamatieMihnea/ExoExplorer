import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
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

    // Get all exoplanets
    const exoplanets = await collection
      .find({}, { projection })
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json(exoplanets);
  } catch (error) {
    console.error('Error fetching all exoplanets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exoplanets' },
      { status: 500 }
    );
  }
}

