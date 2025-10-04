#!/usr/bin/env python3
"""
Load exoplanet CSV data directly into MongoDB

This script reads the exoplanet.eu CSV catalog and loads it directly
into a MongoDB database.

Requirements:
    pip install pymongo

Usage:
    python3 convert_csv_to_mongo.py [--drop]
    
    --drop: Drop existing collections before inserting (default: False)

Environment Variables:
    MONGODB_URI: MongoDB connection string (default: mongodb://admin:password@localhost:27017/)
    MONGO_DATABASE: Database name (default: exoexplorer)
"""

import csv
import json
import os
import sys
from pymongo import MongoClient, ASCENDING
from pymongo.errors import ConnectionFailure, BulkWriteError

def clean_value(value):
    """Convert CSV value to appropriate type for MongoDB"""
    if value == '' or value is None:
        return None
    
    # Try to convert to float
    try:
        float_val = float(value)
        # If it's a whole number, return as int
        if float_val.is_integer():
            return int(float_val)
        return float_val
    except (ValueError, AttributeError):
        # Return as string
        return value

def parse_csv_to_json(csv_file):
    """Parse CSV file and return list of exoplanet documents"""
    exoplanets = []
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            # Create a clean document with only non-null values
            doc = {}
            for key, value in row.items():
                cleaned = clean_value(value)
                if cleaned is not None:
                    # Replace special characters in field names
                    clean_key = key.replace('.', '_').replace(' ', '_')
                    doc[clean_key] = cleaned
            
            # Only add if document has data
            if doc:
                exoplanets.append(doc)
    
    return exoplanets

def connect_to_mongodb():
    """Connect to MongoDB and return database instance"""
    mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://admin:password@localhost:27017/')
    database_name = os.getenv('MONGO_DATABASE', 'exoexplorer')
    
    print(f"Connecting to MongoDB at {mongodb_uri.split('@')[1] if '@' in mongodb_uri else mongodb_uri}...")
    
    try:
        client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
        # Test connection
        client.admin.command('ping')
        print("✓ Connected to MongoDB successfully!")
        
        db = client[database_name]
        return db, client
    except ConnectionFailure as e:
        print(f"✗ Failed to connect to MongoDB: {e}")
        print("\nMake sure MongoDB is running:")
        print("  cd database && docker-compose up -d")
        sys.exit(1)

def create_indexes(db):
    """Create indexes for better query performance"""
    print("\nCreating indexes...")
    
    # Exoplanets indexes
    db.exoplanets.create_index([('name', ASCENDING)])
    db.exoplanets.create_index([('discovered', ASCENDING)])
    db.exoplanets.create_index([('star_name', ASCENDING)])
    db.exoplanets.create_index([('star_distance', ASCENDING)])
    db.exoplanets.create_index([('detection_type', ASCENDING)])
    db.exoplanets.create_index([('planet_status', ASCENDING)])
    db.exoplanets.create_index([('mass', ASCENDING)])
    db.exoplanets.create_index([('radius', ASCENDING)])
    
    # User indexes
    db.users.create_index([('email', ASCENDING)], unique=True)
    db.users.create_index([('username', ASCENDING)], unique=True)
    
    # Observations indexes
    db.observations.create_index([('user_id', ASCENDING)])
    db.observations.create_index([('exoplanet_id', ASCENDING)])
    db.observations.create_index([('created_at', -1)])
    
    # Favorites indexes
    db.favorites.create_index([('user_id', ASCENDING)])
    db.favorites.create_index([('exoplanet_id', ASCENDING)])
    db.favorites.create_index([('user_id', ASCENDING), ('exoplanet_id', ASCENDING)], unique=True)
    
    print("✓ Indexes created successfully!")

def insert_exoplanets(db, exoplanets, drop_existing=False):
    """Insert exoplanet data into MongoDB"""
    
    if drop_existing:
        print("\nDropping existing exoplanets collection...")
        db.exoplanets.drop()
        print("✓ Collection dropped")
    
    existing_count = db.exoplanets.count_documents({})
    if existing_count > 0:
        print(f"\n⚠ Warning: Collection already has {existing_count} documents")
        response = input("Do you want to continue and add more? (y/n): ")
        if response.lower() != 'y':
            print("Aborted.")
            return False
    
    print(f"\nInserting {len(exoplanets)} exoplanet records...")
    
    # Insert in batches for better performance
    batch_size = 1000
    inserted_count = 0
    
    try:
        for i in range(0, len(exoplanets), batch_size):
            batch = exoplanets[i:i + batch_size]
            result = db.exoplanets.insert_many(batch, ordered=False)
            inserted_count += len(result.inserted_ids)
            print(f"  Inserted {inserted_count}/{len(exoplanets)} records...")
        
        print(f"✓ Successfully inserted {inserted_count} exoplanet records!")
        return True
    except BulkWriteError as e:
        print(f"⚠ Bulk write completed with some errors: {e.details['nInserted']} inserted")
        return True

if __name__ == '__main__':
    # Check for command line arguments
    drop_existing = '--drop' in sys.argv
    
    csv_file = 'exoplanet.eu_catalog_04-10-25_17_39_17.csv'
    
    print("=" * 80)
    print("ExoExplorer - Exoplanet Data Loader")
    print("=" * 80)
    
    # Parse CSV
    print(f"\nParsing {csv_file}...")
    exoplanets = parse_csv_to_json(csv_file)
    print(f"✓ Found {len(exoplanets)} exoplanets")
    
    # Connect to MongoDB
    db, client = connect_to_mongodb()
    
    # Insert data
    success = insert_exoplanets(db, exoplanets, drop_existing)
    
    if success:
        # Create indexes
        create_indexes(db)
        
        # Print summary
        print("\n" + "=" * 80)
        print("DATABASE SUMMARY")
        print("=" * 80)
        print(f"Total exoplanets: {db.exoplanets.count_documents({})}")
        print(f"Total users: {db.users.count_documents({})}")
        print(f"Total observations: {db.observations.count_documents({})}")
        print(f"Total favorites: {db.favorites.count_documents({})}")
        
        # Show some statistics
        with_distance = db.exoplanets.count_documents({'star_distance': {'$exists': True, '$ne': None}})
        print(f"\nExoplanets with distance data: {with_distance} ({with_distance/db.exoplanets.count_documents({})*100:.1f}%)")
        
        # Find nearest exoplanet
        nearest = db.exoplanets.find_one({'star_distance': {'$exists': True}}, sort=[('star_distance', 1)])
        if nearest:
            print(f"Nearest exoplanet: {nearest['name']} at {nearest['star_distance']} parsecs")
        
        print("\n✓ All done! Database is ready to use.")
        print("\nAccess Mongo Express at: http://localhost:8081")
        print("  Username: admin")
        print("  Password: pass")
    
    # Close connection
    client.close()

