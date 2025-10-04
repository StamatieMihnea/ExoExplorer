# ExoExplorer Database Setup

This folder contains the MongoDB database configuration for the ExoExplorer application.

## Quick Start

1. **Copy environment variables:**
   ```bash
   cp .env.example .env
   ```

2. **Start the database:**
   ```bash
   docker-compose up -d
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Load exoplanet data:**
   ```bash
   python3 convert_csv_to_mongo.py
   ```
   
   To drop existing data and reload:
   ```bash
   python3 convert_csv_to_mongo.py --drop
   ```

5. **Access the database:**
   - **MongoDB**: `mongodb://admin:password@localhost:27017/exoexplorer?authSource=admin`
   - **Mongo Express (Web UI)**: http://localhost:8081
     - Username: `admin`
     - Password: `pass`

## Services

### MongoDB
- **Port**: 27017
- **Database**: exoexplorer
- **Root User**: admin
- **Root Password**: password

### Mongo Express
- **Port**: 8081
- **Web Interface**: http://localhost:8081
- **Username**: admin
- **Password**: pass

## Database Schema

The database includes the following collections:

### exoplanets
Contains **7,762 confirmed exoplanets** from the exoplanet.eu catalog (updated October 4, 2025).

**Key fields include:**
- Planet properties: `name`, `mass`, `radius`, `orbital_period`, `temp_calculated`
- Discovery info: `discovered`, `detection_type`, `planet_status`
- Host star data: `star_name`, `star_distance`, `star_mass`, `star_teff`, `star_sp_type`
- Coordinates: `ra`, `dec`
- Atmospheric: `molecules` (detected molecules like H2O, CO, CH4)

See [DATA_STRUCTURE.md](./DATA_STRUCTURE.md) for complete schema documentation and query examples.

### users
User account information with unique email and username.

### observations
User observations of exoplanets.

### favorites
User favorite exoplanets.

## Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Remove everything (including data)
docker-compose down -v
```

## Environment Variables

Copy `.env.example` to `.env` and modify as needed:

- `MONGO_ROOT_USERNAME`: MongoDB root username
- `MONGO_ROOT_PASSWORD`: MongoDB root password
- `MONGO_DATABASE`: Database name
- `MONGO_EXPRESS_USERNAME`: Mongo Express username
- `MONGO_EXPRESS_PASSWORD`: Mongo Express password
- `MONGODB_URI`: Connection string for your Next.js app
