#!/usr/bin/env python3

import csv
import json
import os
import sys
from pymongo import MongoClient, ASCENDING
from pymongo.errors import ConnectionFailure, BulkWriteError

def clean_value(value):
    if value == '' or value is None:
        return None
    
    try:
        float_val = float(value)
        if float_val.is_integer():
            return int(float_val)
        return float_val
    except (ValueError, AttributeError):
        return value

def parse_csv_to_json(csv_file):
    exoplanets = []
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            doc = {}
            for key, value in row.items():
                cleaned = clean_value(value)
                if cleaned is not None:
                    clean_key = key.replace('.', '_').replace(' ', '_')
                    doc[clean_key] = cleaned
            
            if doc:
                exoplanets.append(doc)
    
    return exoplanets

def connect_to_mongodb():
    mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://admin:password@localhost:27017/')
    database_name = os.getenv('MONGO_DATABASE', 'exoexplorer')
    
    print(f"Connecting to MongoDB at {mongodb_uri.split('@')[1] if '@' in mongodb_uri else mongodb_uri}...")
    
    try:
        client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
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
    print("\nCreating indexes...")
    
    db.exoplanets.create_index([('name', ASCENDING)])
    db.exoplanets.create_index([('discovered', ASCENDING)])
    db.exoplanets.create_index([('star_name', ASCENDING)])
    db.exoplanets.create_index([('star_distance', ASCENDING)])
    db.exoplanets.create_index([('detection_type', ASCENDING)])
    db.exoplanets.create_index([('planet_status', ASCENDING)])
    db.exoplanets.create_index([('mass', ASCENDING)])
    db.exoplanets.create_index([('radius', ASCENDING)])
    
    db.users.create_index([('email', ASCENDING)], unique=True)
    db.users.create_index([('username', ASCENDING)], unique=True)
    
    db.observations.create_index([('user_id', ASCENDING)])
    db.observations.create_index([('exoplanet_id', ASCENDING)])
    db.observations.create_index([('created_at', -1)])
    
    db.favorites.create_index([('user_id', ASCENDING)])
    db.favorites.create_index([('exoplanet_id', ASCENDING)])
    db.favorites.create_index([('user_id', ASCENDING), ('exoplanet_id', ASCENDING)], unique=True)
    
    print("✓ Indexes created successfully!")

def insert_exoplanets(db, exoplanets, drop_existing=False):
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
    drop_existing = '--drop' in sys.argv
    
    csv_file = 'exoplanet.eu_catalog_04-10-25_17_39_17.csv'
    
    print("=" * 80)
    print("ExoExplorer - Exoplanet Data Loader")
    print("=" * 80)
    
    print(f"\nParsing {csv_file}...")
    exoplanets = parse_csv_to_json(csv_file)
    print(f"✓ Found {len(exoplanets)} exoplanets")
    
    db, client = connect_to_mongodb()
    
    success = insert_exoplanets(db, exoplanets, drop_existing)
    
    if success:
        create_indexes(db)
        
        print("\n" + "=" * 80)
        print("DATABASE SUMMARY")
        print("=" * 80)
        print(f"Total exoplanets: {db.exoplanets.count_documents({})}")
        print(f"Total users: {db.users.count_documents({})}")
        print(f"Total observations: {db.observations.count_documents({})}")
        print(f"Total favorites: {db.favorites.count_documents({})}")
        
        with_distance = db.exoplanets.count_documents({'star_distance': {'$exists': True, '$ne': None}})
        print(f"\nExoplanets with distance data: {with_distance} ({with_distance/db.exoplanets.count_documents({})*100:.1f}%)")
        
        nearest = db.exoplanets.find_one({'star_distance': {'$exists': True}}, sort=[('star_distance', 1)])
        if nearest:
            print(f"Nearest exoplanet: {nearest['name']} at {nearest['star_distance']} parsecs")
        
        print("\n✓ All done! Database is ready to use.")
        print("\nAccess Mongo Express at: http://localhost:8081")
        print("  Username: admin")
        print("  Password: pass")
    
    client.close()
