# ExoExplorer Database Schema

## Exoplanets Collection

The `exoplanets` collection contains **7,762 confirmed exoplanets** from the exoplanet.eu catalog (updated October 4, 2025).

### Key Fields

#### Planet Identification
- `name` - Official planet name (e.g., "Kepler-452b", "Proxima Centauri b")
- `planet_status` - Confirmation status (e.g., "Confirmed")
- `alternate_names` - Other names for the planet

#### Physical Properties
- `mass` - Planet mass in Jupiter masses
- `mass_error_min` / `mass_error_max` - Mass measurement errors
- `radius` - Planet radius in Jupiter radii
- `radius_error_min` / `radius_error_max` - Radius measurement errors
- `temp_calculated` - Calculated equilibrium temperature (K)
- `temp_measured` - Measured temperature (K)

#### Orbital Characteristics
- `orbital_period` - Orbital period in days
- `semi_major_axis` - Semi-major axis in AU
- `eccentricity` - Orbital eccentricity (0-1)
- `inclination` - Orbital inclination in degrees
- `angular_distance` - Angular distance from host star

#### Discovery Information
- `discovered` - Year of discovery
- `updated` - Last update date (YYYY-MM-DD)
- `detection_type` - Method of detection (e.g., "Radial Velocity", "Primary Transit", "Imaging")
- `publication` - Publication status

#### Host Star Properties
- `star_name` - Name of the host star
- `star_distance` - Distance to star system (parsecs)
- `star_mass` - Star mass in solar masses
- `star_radius` - Star radius in solar radii
- `star_teff` - Star effective temperature (K)
- `star_metallicity` - Star metallicity [Fe/H]
- `star_sp_type` - Spectral type (e.g., "G2V", "M5V")
- `star_age` - Age of star in Gyr
- `ra` - Right ascension (J2000)
- `dec` - Declination (J2000)
- `mag_v`, `mag_i`, `mag_j`, `mag_h`, `mag_k` - Star magnitudes in different bands

#### Atmospheric & Composition
- `molecules` - Detected molecules (e.g., "H2O, CO, CH4")
- `geometric_albedo` - Geometric albedo value

### Indexes

The following indexes are created for optimal query performance:

```javascript
db.exoplanets.createIndex({ 'name': 1 });
db.exoplanets.createIndex({ 'discovered': 1 });
db.exoplanets.createIndex({ 'star_name': 1 });
db.exoplanets.createIndex({ 'star_distance': 1 });
db.exoplanets.createIndex({ 'detection_type': 1 });
db.exoplanets.createIndex({ 'planet_status': 1 });
db.exoplanets.createIndex({ 'mass': 1 });
db.exoplanets.createIndex({ 'radius': 1 });
```

### Example Document

```json
{
  "name": "Proxima Centauri b",
  "planet_status": "Confirmed",
  "mass": 1.27,
  "radius": 1.1,
  "orbital_period": 11.2,
  "discovered": 2016,
  "detection_type": "Radial Velocity",
  "star_name": "Proxima Centauri",
  "star_distance": 4.2,
  "star_mass": 0.12,
  "star_teff": 3042,
  "star_sp_type": "M5.5V"
}
```

## Other Collections

### users
User account information with unique email and username indexes.

### observations
User observations of exoplanets, indexed by user_id, exoplanet_id, and creation date.

### favorites
User favorite exoplanets with compound unique index on (user_id, exoplanet_id).

## Data Source

**exoplanet.eu** - The Extrasolar Planets Encyclopaedia
- Catalog Date: October 4, 2025, 17:39:17
- Total Exoplanets: 7,762
- Source File: `exoplanet.eu_catalog_04-10-25_17_39_17.csv`

## Query Examples

### Find planets in habitable zone (rough estimate)
```javascript
db.exoplanets.find({
  temp_calculated: { $gte: 200, $lte: 350 },
  radius: { $lte: 2.5 }
})
```

### Find nearest exoplanets
```javascript
db.exoplanets.find({ 
  star_distance: { $exists: true } 
}).sort({ star_distance: 1 }).limit(10)
```

### Find planets discovered in recent years
```javascript
db.exoplanets.find({ 
  discovered: { $gte: 2020 } 
}).sort({ discovered: -1 })
```

### Find planets by detection method
```javascript
db.exoplanets.find({ 
  detection_type: "Primary Transit" 
})
```

### Find planets with atmospheric data
```javascript
db.exoplanets.find({ 
  molecules: { $exists: true, $ne: "" } 
})
```
