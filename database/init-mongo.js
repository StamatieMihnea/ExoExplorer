// MongoDB initialization script for ExoExplorer
// This script runs when the MongoDB container starts for the first time
// It creates the collections - data will be loaded via Python script

// Switch to the exoexplorer database
db = db.getSiblingDB('exoexplorer');

// Create collections for the ExoExplorer app
db.createCollection('exoplanets');
db.createCollection('users');
db.createCollection('observations');
db.createCollection('favorites');

print('ExoExplorer database initialized!');
print('Collections created: exoplanets, users, observations, favorites');
print('');
print('To load exoplanet data, run:');
print('  pip install pymongo');
print('  python3 convert_csv_to_mongo.py');

