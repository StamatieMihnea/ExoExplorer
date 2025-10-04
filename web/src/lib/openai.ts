import OpenAI from 'openai';
import { getDatabase } from './mongodb';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = `You convert a user's natural-language request into a MongoDB query JSON targeting a collection with the schema below. Output only a single JSON object with optional keys: filter, projection, sort, limit, skip. Do not include explanations.

Collection schema (field → type)
_id: ObjectId
name: string
planet_status: string
mass: number
mass_error_min: number
mass_error_max: number
mass_sini: number
mass_sini_error_min: number
mass_sini_error_max: number
radius: number
orbital_period: number
orbital_period_error_min: number
orbital_period_error_max: number
semi_major_axis: number
semi_major_axis_error_min: number
semi_major_axis_error_max: number
eccentricity: number
eccentricity_error_min: number
eccentricity_error_max: number
inclination: number
inclination_error_min: number
inclination_error_max: number
angular_distance: number
discovered: number
updated: string
omega: number
omega_error_min: number
omega_error_max: number
tperi: number
tperi_error_min: number
tperi_error_max: number
k: number
k_error_min: number
k_error_max: number
publication: string
detection_type: string
mass_measurement_type: string
radius_measurement_type: string
alternate_names: string
star_name: string
ra: number
dec: number
mag_v: number
star_distance: number
star_distance_error_min: number
star_distance_error_max: number
star_metallicity: number
star_metallicity_error_min: number
star_metallicity_error_max: number
star_mass: number
star_mass_error_min: number
star_mass_error_max: number
star_radius: number
star_radius_error_min: number
star_radius_error_max: number
star_sp_type: string
star_age: number
star_age_error_min: number
star_age_error_max: number
star_teff: number
star_teff_error_min: number
star_teff_error_max: number
star_alternate_names: string

Operator rules
- Use $eq,$ne,$gt,$gte,$lt,$lte,$in,$nin,$exists,$and,$or,$regex,$options.
- Ranges like "between X and Y" → { $gte: X, $lte: Y }.
- Inequalities like ">, at least, no more than" → $gt/$gte/$lt/$lte.
- Text: exact phrase → ^...$; otherwise case-insensitive contains with $regex and $options:"i".
- Booleans implied by words: "confirmed" → planet_status:"Confirmed"; "RV"/"radial velocity" → detection_type contains "Radial Velocity"; "astrometry" → detection_type contains "Astrometry".
- Years use discovered; recency uses updated (ISO strings ok).
- If unconstrained, use { } as filter. Never invent fields.

Output contract
Return only JSON like { "filter": { ... }, "projection": { ... }, "sort": { ... }, "limit": 50, "skip": 0 }. Omit keys you don't need. Default limit 50 for generic "list/show" requests. Add projection only if the user asks for specific fields. For "top/highest/closest/brightest", set appropriate sort + limit.

Vocabulary mapping
"mass" → mass; "minimum mass/m sin i" → mass_sini; "period" → orbital_period; "semi-major axis" → semi_major_axis; "eccentricity" → eccentricity; "inclination" → inclination; "brightness/visual magnitude" → mag_v (lower is brighter); "distance/nearest" → star_distance; "metallicity" → star_metallicity; "temperature/Teff" → star_teff; "spectral type" → star_sp_type; "aka/alias" → alternate_names or star_alternate_names with $regex.

If ambiguous, prefer sane defaults (e.g., "nearby" → star_distance <= 50) and inclusive bounds. If nothing matches the schema, return { "filter": {} }.

Your response MUST be only the JSON object.`;

interface MongoQueryStructure {
  filter?: any;
  projection?: any;
  sort?: any;
  limit?: number;
  skip?: number;
}

/**
 * Converts natural language to a MongoDB query structure using OpenAI
 * @param userPrompt - Natural language query from the user
 * @returns MongoDB query structure with filter, projection, sort, limit, skip
 */
export async function convertNaturalLanguageToMongoQuery(userPrompt: string): Promise<MongoQueryStructure> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'o4-mini',
      reasoning_effort: 'high',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    
    // Clean up the response (remove markdown code blocks if present)
    let cleanResponse = responseText.trim();
    if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    
    const queryStructure: MongoQueryStructure = JSON.parse(cleanResponse);
    
    console.log('Generated MongoDB query structure:', queryStructure);
    
    return queryStructure;
  } catch (error) {
    console.error('Error converting natural language to MongoDB query:', error);
    throw error;
  }
}

/**
 * Queries the exoplanets collection using a natural language prompt
 * @param userPrompt - Natural language query from the user
 * @returns Array of exoplanet documents matching the query
 */
export async function queryExoplanetsWithNaturalLanguage(userPrompt: string): Promise<any[]> {
  try {
    // Convert natural language to MongoDB query structure
    const queryStructure = await convertNaturalLanguageToMongoQuery(userPrompt);
    
    // Execute the query on MongoDB
    const db = await getDatabase();
    const collection = db.collection('exoplanets');
    
    // Build the query
    let query = collection.find(queryStructure.filter || {});
    
    // Apply projection if provided
    if (queryStructure.projection) {
      query = query.project(queryStructure.projection);
    }
    
    // Apply sort if provided
    if (queryStructure.sort) {
      query = query.sort(queryStructure.sort);
    }
    
    // Apply skip if provided
    if (queryStructure.skip) {
      query = query.skip(queryStructure.skip);
    }
    
    // Apply limit (default to 100 if not specified, max 1000 for safety)
    const limit = Math.min(queryStructure.limit || 100, 1000);
    query = query.limit(limit);
    
    // Execute and return results
    const results = await query.toArray();
    
    console.log(`Query returned ${results.length} results`);
    
    return results;
  } catch (error) {
    console.error('Error querying exoplanets with natural language:', error);
    throw error;
  }
}

