#!/usr/bin/env python3
"""
Quick diagnostic script to check if textures have been generated in MongoDB
"""

from pymongo import MongoClient

MONGODB_URI = "mongodb://localhost:27017/"
DATABASE_NAME = "exoplanet_explorer"
COLLECTION_NAME = "exoplanets"

def check_textures():
    print("Connecting to MongoDB...")
    client = MongoClient(MONGODB_URI)
    db = client[DATABASE_NAME]
    collection = db[COLLECTION_NAME]
    
    # Count total planets
    total = collection.count_documents({})
    print(f"\n📊 Total exoplanets in database: {total}")
    
    # Count planets with high-res textures
    with_high = collection.count_documents({'texture_high_url': {'$exists': True}})
    print(f"✅ Planets with high-res textures: {with_high} ({with_high/total*100:.1f}%)")
    
    # Count planets with low-res textures
    with_low = collection.count_documents({'texture_low_url': {'$exists': True}})
    print(f"✅ Planets with low-res textures: {with_low} ({with_low/total*100:.1f}%)")
    
    # Show a sample
    if with_high > 0:
        print("\n🔍 Sample planet with textures:")
        sample = collection.find_one(
            {'texture_high_url': {'$exists': True}},
            {'name': 1, 'texture_high_url': 1, 'texture_low_url': 1}
        )
        if sample:
            high_size = len(sample.get('texture_high_url', ''))
            low_size = len(sample.get('texture_low_url', ''))
            print(f"  Name: {sample.get('name')}")
            print(f"  High-res size: {high_size:,} bytes ({high_size/1024:.1f} KB)")
            print(f"  Low-res size: {low_size:,} bytes ({low_size/1024:.1f} KB)")
    else:
        print("\n⚠️  NO TEXTURES FOUND IN DATABASE!")
        print("\nTo generate textures, run:")
        print("  python generate_textures.py --mode local --limit 10    # Test with 10 planets")
        print("  python generate_textures.py --mode local                # Generate for all")
    
    client.close()

if __name__ == '__main__':
    try:
        check_textures()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nMake sure MongoDB is running:")
        print("  docker-compose up -d  # If using Docker")
        print("  mongod                # If running locally")

