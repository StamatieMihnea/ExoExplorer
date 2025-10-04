import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ExoplanetSearchParams } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const params: ExoplanetSearchParams = {
      name: searchParams.get('name') || undefined,
      minDistance: searchParams.get('minDistance') ? Number(searchParams.get('minDistance')) : undefined,
      maxDistance: searchParams.get('maxDistance') ? Number(searchParams.get('maxDistance')) : undefined,
      minMass: searchParams.get('minMass') ? Number(searchParams.get('minMass')) : undefined,
      maxMass: searchParams.get('maxMass') ? Number(searchParams.get('maxMass')) : undefined,
      minRadius: searchParams.get('minRadius') ? Number(searchParams.get('minRadius')) : undefined,
      maxRadius: searchParams.get('maxRadius') ? Number(searchParams.get('maxRadius')) : undefined,
      discoveredAfter: searchParams.get('discoveredAfter') ? Number(searchParams.get('discoveredAfter')) : undefined,
      discoveredBefore: searchParams.get('discoveredBefore') ? Number(searchParams.get('discoveredBefore')) : undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      sortBy: searchParams.get('sortBy') || 'name',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
    };

    const db = await getDatabase();
    const collection = db.collection('exoplanets');

    // Build query filter
    const filter: any = {};

    if (params.name) {
      filter.name = { $regex: params.name, $options: 'i' };
    }

    if (params.minDistance !== undefined || params.maxDistance !== undefined) {
      filter.star_distance = {};
      if (params.minDistance !== undefined) {
        filter.star_distance.$gte = params.minDistance;
      }
      if (params.maxDistance !== undefined) {
        filter.star_distance.$lte = params.maxDistance;
      }
    }

    if (params.minMass !== undefined || params.maxMass !== undefined) {
      filter.mass = {};
      if (params.minMass !== undefined) {
        filter.mass.$gte = params.minMass;
      }
      if (params.maxMass !== undefined) {
        filter.mass.$lte = params.maxMass;
      }
    }

    if (params.minRadius !== undefined || params.maxRadius !== undefined) {
      filter.radius = {};
      if (params.minRadius !== undefined) {
        filter.radius.$gte = params.minRadius;
      }
      if (params.maxRadius !== undefined) {
        filter.radius.$lte = params.maxRadius;
      }
    }

    if (params.discoveredAfter !== undefined || params.discoveredBefore !== undefined) {
      filter.discovered = {};
      if (params.discoveredAfter !== undefined) {
        filter.discovered.$gte = params.discoveredAfter;
      }
      if (params.discoveredBefore !== undefined) {
        filter.discovered.$lte = params.discoveredBefore;
      }
    }

    // Build sort
    const sort: any = {};
    sort[params.sortBy!] = params.sortOrder === 'asc' ? 1 : -1;

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
    };

    // Execute query
    let query = collection.find(filter, { projection }).sort(sort);
    
    if (params.limit) {
      query = query.limit(params.limit);
    }

    const exoplanets = await query.toArray();

    return NextResponse.json(exoplanets);
  } catch (error) {
    console.error('Error fetching exoplanets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exoplanets' },
      { status: 500 }
    );
  }
}

