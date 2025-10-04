# ExoExplorer API Documentation

Base URL: `http://localhost:3000/api`

## Endpoints

### 1. Get All Exoplanets (with filtering)

**GET** `/api/exoplanets`

Returns a list of exoplanets based on optional filters.

**Query Parameters:**
- `name` (string) - Search by name (case-insensitive, partial match)
- `minDistance` (number) - Minimum distance in parsecs
- `maxDistance` (number) - Maximum distance in parsecs
- `minMass` (number) - Minimum mass in Jupiter masses
- `maxMass` (number) - Maximum mass in Jupiter masses
- `minRadius` (number) - Minimum radius in Jupiter radii
- `maxRadius` (number) - Maximum radius in Jupiter radii
- `discoveredAfter` (number) - Discovered after this year
- `discoveredBefore` (number) - Discovered before this year
- `limit` (number) - Maximum number of results (optional)
- `sortBy` (string) - Field to sort by (default: 'name')
- `sortOrder` ('asc' | 'desc') - Sort order (default: 'asc')

**Examples:**
```bash
# Get all exoplanets
GET /api/exoplanets

# Search by name
GET /api/exoplanets?name=Proxima

# Get nearby exoplanets (within 10 parsecs)
GET /api/exoplanets?maxDistance=10&sortBy=star_distance&sortOrder=asc

# Get large planets discovered recently
GET /api/exoplanets?minRadius=1.5&discoveredAfter=2020&limit=20

# Get planets sorted by mass
GET /api/exoplanets?sortBy=mass&sortOrder=desc&limit=50
```

**Response:**
```json
[
  {
    "_id": "...",
    "name": "Proxima Centauri b",
    "mass": 1.27,
    "radius": 1.1,
    "discovered": 2016,
    "temp_calculated": 234,
    "temp_measured": null,
    "star_name": "Proxima Centauri",
    "star_distance": 1.295,
    "star_mass": 0.12,
    "star_radius": 0.14,
    "star_age": 4.85
  }
]
```

---

### 2. Get Specific Exoplanet by ID

**GET** `/api/exoplanets/[id]`

Returns details for a specific exoplanet by MongoDB ObjectId.

**Parameters:**
- `id` (path parameter) - MongoDB ObjectId of the exoplanet

**Examples:**
```bash
# Get exoplanet by ID
GET /api/exoplanets/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Proxima Centauri b",
  "mass": 1.27,
  "radius": 1.1,
  "discovered": 2016,
  "temp_calculated": 234,
  "temp_measured": null,
  "star_name": "Proxima Centauri",
  "star_distance": 1.295,
  "star_mass": 0.12,
  "star_radius": 0.14,
  "star_age": 4.85
}
```

**Error Response (400):**
```json
{
  "error": "Invalid ID format"
}
```

**Error Response (404):**
```json
{
  "error": "Exoplanet not found"
}
```

---

### 3. Get Nearby Exoplanets

**GET** `/api/exoplanets/nearby`

Returns the nearest exoplanets to Earth, sorted by distance.

**Query Parameters:**
- `limit` (number) - Maximum number of results (default: 50)
- `maxDistance` (number) - Maximum distance in parsecs (default: 100)

**Examples:**
```bash
# Get 50 nearest exoplanets
GET /api/exoplanets/nearby

# Get 10 nearest exoplanets
GET /api/exoplanets/nearby?limit=10

# Get exoplanets within 20 parsecs (~65 light-years)
GET /api/exoplanets/nearby?maxDistance=20&limit=100
```

**Response:**
```json
[
  {
    "_id": "...",
    "name": "Proxima Centauri b",
    "mass": 1.27,
    "radius": 1.1,
    "discovered": 2016,
    "temp_calculated": 234,
    "star_name": "Proxima Centauri",
    "star_distance": 1.295,
    "star_mass": 0.12,
    "star_radius": 0.14,
    "star_age": 4.85
  },
  {
    "_id": "...",
    "name": "Barnard's star b",
    "mass": 3.23,
    "radius": null,
    "discovered": 2018,
    "temp_calculated": 105,
    "star_name": "Barnard's star",
    "star_distance": 1.83,
    "star_mass": 0.144,
    "star_radius": 0.196,
    "star_age": 10.0
  }
]
```

---

### 4. Get Database Statistics

**GET** `/api/exoplanets/stats`

Returns statistics about the exoplanet database.

**Examples:**
```bash
GET /api/exoplanets/stats
```

**Response:**
```json
{
  "total": 7762,
  "withDistance": 7414,
  "withMass": 6234,
  "withRadius": 4521,
  "withAtmosphere": 142,
  "percentageWithDistance": "95.5",
  "percentageWithMass": "80.3",
  "percentageWithRadius": "58.2",
  "percentageWithAtmosphere": "1.8",
  "nearestExoplanet": {
    "name": "Proxima Centauri b",
    "distance_parsecs": 1.295,
    "distance_light_years": "4.22",
    "star_name": "Proxima Centauri"
  },
  "detectionTypes": [
    { "type": "Radial Velocity", "count": 1045 },
    { "type": "Primary Transit", "count": 4321 },
    { "type": "Imaging", "count": 98 }
  ],
  "discoveryByYear": [
    { "year": 1995, "count": 1 },
    { "year": 1996, "count": 6 },
    { "year": 2020, "count": 521 }
  ]
}
```

---

## Data Model

All exoplanet records include these fields:

| Field | Type | Description | Unit |
|-------|------|-------------|------|
| `_id` | string | MongoDB ObjectId | - |
| `name` | string | Official exoplanet name | - |
| `mass` | number \| null | Planet mass | Jupiter masses |
| `radius` | number \| null | Planet radius | Jupiter radii |
| `discovered` | number \| null | Discovery year | Year (YYYY) |
| `temp_calculated` | number \| null | Calculated equilibrium temperature | Kelvin |
| `temp_measured` | number \| null | Measured temperature | Kelvin |
| `star_name` | string \| null | Host star name | - |
| `star_distance` | number \| null | Distance from Earth | Parsecs |
| `star_mass` | number \| null | Host star mass | Solar masses |
| `star_radius` | number \| null | Host star radius | Solar radii |
| `star_age` | number \| null | Host star age | Billion years (Gyr) |

**Unit Conversions:**
- 1 parsec (pc) = 3.26156 light-years
- 1 Jupiter mass = 317.8 Earth masses
- 1 Jupiter radius = 11.2 Earth radii
- 1 Solar mass = 1047 Jupiter masses

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK` - Successful request
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

Error response format:
```json
{
  "error": "Error message description"
}
```

