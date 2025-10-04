import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await getDatabase();
    const collection = db.collection('exoplanets');

    // Get various statistics
    const [
      total,
      withDistance,
      withMass,
      withRadius,
      withAtmosphere,
      nearest,
      detectionTypes,
      discoveryByYear,
    ] = await Promise.all([
      // Total count
      collection.countDocuments({}),
      
      // Count with distance data
      collection.countDocuments({ star_distance: { $exists: true, $ne: null } }),
      
      // Count with mass data
      collection.countDocuments({ mass: { $exists: true, $ne: null } }),
      
      // Count with radius data
      collection.countDocuments({ radius: { $exists: true, $ne: null } }),
      
      // Count with atmosphere/molecules data
      collection.countDocuments({ molecules: { $exists: true, $ne: '' } }),
      
      // Find nearest exoplanet
      collection.findOne(
        { star_distance: { $exists: true, $ne: null } },
        { sort: { star_distance: 1 } }
      ),
      
      // Detection types distribution
      collection.aggregate([
        { $match: { detection_type: { $exists: true, $ne: '' } } },
        { $group: { _id: '$detection_type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray(),
      
      // Discovery by year
      collection.aggregate([
        { $match: { discovered: { $exists: true, $ne: null } } },
        { $group: { _id: '$discovered', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]).toArray(),
    ]);

    return NextResponse.json({
      total,
      withDistance,
      withMass,
      withRadius,
      withAtmosphere,
      percentageWithDistance: ((withDistance / total) * 100).toFixed(1),
      percentageWithMass: ((withMass / total) * 100).toFixed(1),
      percentageWithRadius: ((withRadius / total) * 100).toFixed(1),
      percentageWithAtmosphere: ((withAtmosphere / total) * 100).toFixed(1),
      nearestExoplanet: nearest ? {
        name: nearest.name,
        distance_parsecs: nearest.star_distance,
        distance_light_years: (nearest.star_distance * 3.26156).toFixed(2),
        star_name: nearest.star_name,
      } : null,
      detectionTypes: detectionTypes.map((dt: any) => ({
        type: dt._id,
        count: dt.count,
      })),
      discoveryByYear: discoveryByYear.map((dy: any) => ({
        year: dy._id,
        count: dy.count,
      })),
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

