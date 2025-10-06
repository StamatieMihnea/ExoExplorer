#!/usr/bin/env python3

import argparse
import base64
import io
import math
import random
import sys
from enum import Enum
from typing import Tuple, Optional
from PIL import Image, ImageDraw, ImageFilter
from pymongo import MongoClient
from datetime import datetime

MONGODB_URI = "mongodb://localhost:27017/"
DATABASE_NAME = "exoplanet_explorer"
COLLECTION_NAME = "exoplanets"

class PlanetType(Enum):
    HOT_JUPITER = "hot_jupiter"
    WARM_NEPTUNE = "warm_neptune"
    ICE_GIANT = "ice_giant"
    SUPER_EARTH = "super_earth"
    TERRESTRIAL = "terrestrial"
    MINI_NEPTUNE = "mini_neptune"

EARTH_MASS = 1.0
EARTH_RADIUS = 1.0
JUPITER_MASS = 317.8
JUPITER_RADIUS = 11.2
NEPTUNE_MASS = 17.1
NEPTUNE_RADIUS = 3.88


def classify_planet(exoplanet: dict) -> PlanetType:
    mass = exoplanet.get('mass', EARTH_MASS)
    radius = exoplanet.get('radius', EARTH_RADIUS)
    temp = exoplanet.get('temp_calculated') or exoplanet.get('temp_measured') or 300
    
    density = mass / (radius ** 3)
    
    if radius > 8 and temp > 1000 and density < 0.4:
        return PlanetType.HOT_JUPITER
    
    if 3 < radius < 8 and 500 < temp < 1000 and density < 0.8:
        return PlanetType.WARM_NEPTUNE
    
    if radius > 3 and temp < 500 and density < 0.8:
        return PlanetType.ICE_GIANT
    
    if 1.5 < radius < 4 and density < 1.2:
        return PlanetType.MINI_NEPTUNE
    
    if radius > 1.5 and density >= 1.2:
        return PlanetType.SUPER_EARTH
    
    return PlanetType.TERRESTRIAL


def get_scientific_colors(exoplanet: dict, planet_type: PlanetType) -> Tuple[Tuple[int, int, int], Tuple[int, int, int], Tuple[int, int, int]]:
    temp = exoplanet.get('temp_calculated') or exoplanet.get('temp_measured') or 300
    
    def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    
    if planet_type == PlanetType.HOT_JUPITER:
        if temp > 2000:
            return hex_to_rgb('#5a3820'), hex_to_rgb('#3d2510'), hex_to_rgb('#8a5530')
        elif temp > 1500:
            return hex_to_rgb('#6a4530'), hex_to_rgb('#4a3020'), hex_to_rgb('#9a6540')
        else:
            return hex_to_rgb('#7a5840'), hex_to_rgb('#5a4030'), hex_to_rgb('#aa7860')
    
    elif planet_type == PlanetType.WARM_NEPTUNE:
        return hex_to_rgb('#8bc5e8'), hex_to_rgb('#6ba3d0'), hex_to_rgb('#aae5ff')
    
    elif planet_type == PlanetType.ICE_GIANT:
        if temp < 100:
            return hex_to_rgb('#6a8fc5'), hex_to_rgb('#4a6fa5'), hex_to_rgb('#8aafe5')
        else:
            return hex_to_rgb('#9ad8e5'), hex_to_rgb('#7ab8c5'), hex_to_rgb('#baf8ff')
    
    elif planet_type == PlanetType.MINI_NEPTUNE:
        cloudiness = random.random()
        if cloudiness > 0.7:
            return hex_to_rgb('#e5f5ff'), hex_to_rgb('#c5d5e5'), hex_to_rgb('#ffffff')
        elif cloudiness > 0.4:
            return hex_to_rgb('#aad5f5'), hex_to_rgb('#8ab5d5'), hex_to_rgb('#caf5ff')
        else:
            return hex_to_rgb('#8aafb5'), hex_to_rgb('#6a8fa5'), hex_to_rgb('#aacfd5')
    
    elif planet_type == PlanetType.SUPER_EARTH:
        if temp > 700:
            return hex_to_rgb('#ff7a40'), hex_to_rgb('#e85a20'), hex_to_rgb('#ffaa70')
        elif temp > 400:
            return hex_to_rgb('#d8b090'), hex_to_rgb('#b89070'), hex_to_rgb('#f8d0b0')
        elif temp > 250:
            variation = random.random()
            if variation < 0.4:
                return hex_to_rgb('#4d7aaa'), hex_to_rgb('#3d6a9a'), hex_to_rgb('#6d9aca')
            elif variation < 0.7:
                return hex_to_rgb('#6a9a7a'), hex_to_rgb('#5a8a6a'), hex_to_rgb('#8aba9a')
            else:
                return hex_to_rgb('#aa9a7a'), hex_to_rgb('#8a7a5a'), hex_to_rgb('#caba9a')
        else:
            return hex_to_rgb('#e5f5ff'), hex_to_rgb('#c5d5e5'), hex_to_rgb('#ffffff')
    
    elif planet_type == PlanetType.TERRESTRIAL:
        if temp > 600:
            return hex_to_rgb('#f8e0b0'), hex_to_rgb('#d8c090'), hex_to_rgb('#ffffd0')
        elif temp > 350:
            return hex_to_rgb('#e8b080'), hex_to_rgb('#c89060'), hex_to_rgb('#ffd0a0')
        elif temp > 200:
            variation = random.random()
            if variation < 0.3:
                return hex_to_rgb('#5d8aba'), hex_to_rgb('#4d7aaa'), hex_to_rgb('#7daadd')
            elif variation < 0.6:
                return hex_to_rgb('#7a9a8a'), hex_to_rgb('#6a8a7a'), hex_to_rgb('#9abaaa')
            else:
                return hex_to_rgb('#baaa8a'), hex_to_rgb('#9a8a6a'), hex_to_rgb('#dacaaa')
        elif temp > 150:
            return hex_to_rgb('#e89a70'), hex_to_rgb('#c87a50'), hex_to_rgb('#ffba90')
        else:
            return hex_to_rgb('#f5ffff'), hex_to_rgb('#d5e5f5'), hex_to_rgb('#ffffff')
    
    return (160, 160, 160), (128, 128, 128), (192, 192, 192)


def simple_perlin_noise(x: float, y: float, scale: float = 10, octaves: int = 3) -> float:
    value = 0
    amplitude = 1
    frequency = scale
    max_value = 0
    
    for _ in range(octaves):
        value += math.sin(x * frequency) * math.cos(y * frequency) * amplitude
        max_value += amplitude
        amplitude *= 0.5
        frequency *= 2
    
    return (value / max_value + 1) / 2


def add_noise(img: Image.Image, intensity: int = 25):
    pixels = img.load()
    width, height = img.size
    
    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y]
            noise = random.randint(-intensity, intensity)
            pixels[x, y] = (
                max(0, min(255, r + noise)),
                max(0, min(255, g + noise)),
                max(0, min(255, b + noise))
            )


def draw_atmospheric_bands(img: Image.Image, colors: Tuple, turbulence: float = 1.0):
    draw = ImageDraw.Draw(img)
    width, height = img.size
    bands = random.randint(6, 12)
    
    for i in range(bands):
        y = (i / bands) * height
        band_height = height / bands
        
        color = colors[1] if i % 2 == 0 else colors[2]
        
        points = []
        for x in range(0, width + 5, 5):
            wave1 = math.sin(x / width * math.pi * 6 + i) * turbulence * 8
            wave2 = math.sin(x / width * math.pi * 3 + i * 2) * turbulence * 4
            wave_y = y + wave1 + wave2
            points.append((x, wave_y))
        
        if points:
            points.extend([(width, y + band_height), (0, y + band_height)])
            draw.polygon(points, fill=color)


def draw_clouds(img: Image.Image, colors: Tuple, density: float = 0.3, pattern: str = 'wisps'):
    overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    width, height = img.size
    
    if pattern == 'bands':
        bands = random.randint(5, 10)
        for i in range(bands):
            band_y = (i / bands) * height
            band_height = height / bands
            alpha = int((random.random() * 0.4 + 0.3) * 255)
            color = colors[1] + (alpha,)
            draw.rectangle([(0, band_y), (width, band_y + band_height)], fill=color)
    
    elif pattern == 'spots':
        spots = random.randint(3, 8)
        for _ in range(spots):
            x = random.random() * width
            y = random.random() * height
            size = random.randint(10, 40)
            alpha = int(0.4 * 255)
            color = colors[1] + (alpha,)
            draw.ellipse([(x - size, y - size), (x + size, y + size)], fill=color)
    
    else:
        step = 2
        for y in range(0, height, step):
            for x in range(0, width, step):
                noise = simple_perlin_noise(x / width, y / height, 8, 2)
                if noise > (1 - density):
                    alpha = int((noise - (1 - density)) / density * 0.5 * 255)
                    color = colors[1] + (alpha,)
                    draw.rectangle([(x, y), (x + step, y + step)], fill=color)
    
    img.paste(overlay, (0, 0), overlay)


def get_texture_resolution(radius: Optional[float]) -> int:
    if not radius:
        return 256
    
    if radius > 10:
        return 512
    elif radius > 5:
        return 256
    elif radius > 2:
        return 128
    else:
        return 64


def generate_planet_texture(exoplanet: dict, resolution: Optional[int] = None) -> Image.Image:
    size = resolution or get_texture_resolution(exoplanet.get('radius'))
    
    planet_type = classify_planet(exoplanet)
    colors = get_scientific_colors(exoplanet, planet_type)
    temp = exoplanet.get('temp_calculated') or exoplanet.get('temp_measured') or 300
    
    img = Image.new('RGB', (size, size), colors[0])
    
    if planet_type == PlanetType.HOT_JUPITER:
        draw_atmospheric_bands(img, colors, turbulence=1.5)
        draw_clouds(img, colors, density=0.4, pattern='spots')
        add_noise(img, intensity=25)
    
    elif planet_type == PlanetType.WARM_NEPTUNE:
        draw_atmospheric_bands(img, colors, turbulence=1.0)
        draw_clouds(img, colors, density=0.3, pattern='bands')
        add_noise(img, intensity=20)
    
    elif planet_type == PlanetType.ICE_GIANT:
        draw_atmospheric_bands(img, colors, turbulence=0.5)
        if random.random() > 0.7:
            draw_clouds(img, colors, density=0.2, pattern='spots')
        add_noise(img, intensity=15)
    
    elif planet_type == PlanetType.MINI_NEPTUNE:
        if random.random() > 0.5:
            draw_atmospheric_bands(img, colors, turbulence=0.7)
        draw_clouds(img, colors, density=0.4, pattern='wisps')
        add_noise(img, intensity=18)
    
    elif planet_type == PlanetType.SUPER_EARTH:
        if temp > 700:
            draw_atmospheric_bands(img, colors, turbulence=0.8)
            add_noise(img, intensity=30)
        elif 250 < temp < 400:
            draw_clouds(img, colors, density=0.3, pattern='wisps')
            add_noise(img, intensity=20)
        else:
            add_noise(img, intensity=22)
    
    elif planet_type == PlanetType.TERRESTRIAL:
        if temp > 600:
            draw_clouds(img, colors, density=0.8, pattern='wisps')
            add_noise(img, intensity=18)
        elif 200 < temp < 350:
            draw_clouds(img, colors, density=0.25, pattern='wisps')
            add_noise(img, intensity=20)
        elif temp > 150:
            add_noise(img, intensity=25)
        else:
            add_noise(img, intensity=15)
    
    img = img.filter(ImageFilter.GaussianBlur(radius=0.5))
    
    return img


def generate_simple_texture(exoplanet: dict) -> Image.Image:
    size = 32
    
    planet_type = classify_planet(exoplanet)
    colors = get_scientific_colors(exoplanet, planet_type)
    
    img = Image.new('RGB', (size, size), colors[0])
    draw = ImageDraw.Draw(img)
    
    for r in range(size // 2, 0, -1):
        alpha = r / (size / 2)
        color = tuple(int(colors[0][i] * alpha + colors[1][i] * (1 - alpha)) for i in range(3))
        draw.ellipse([(size//2 - r, size//2 - r), (size//2 + r, size//2 + r)], fill=color)
    
    return img


def image_to_base64(img: Image.Image, format='PNG') -> str:
    buffer = io.BytesIO()
    img.save(buffer, format=format)
    return base64.b64encode(buffer.getvalue()).decode('utf-8')


def generate_and_store_textures(limit: Optional[int] = None, mode: str = 'local'):
    print(f"Connecting to MongoDB at {MONGODB_URI}...")
    client = MongoClient(MONGODB_URI)
    db = client[DATABASE_NAME]
    collection = db[COLLECTION_NAME]
    
    query = {}
    exoplanets = list(collection.find(query).limit(limit) if limit else collection.find(query))
    total = len(exoplanets)
    
    print(f"Found {total} exoplanets. Generating textures...")
    
    for i, exoplanet in enumerate(exoplanets, 1):
        planet_id = str(exoplanet['_id'])
        planet_name = exoplanet.get('name', 'Unknown')
        
        print(f"[{i}/{total}] Generating textures for {planet_name}...")
        
        try:
            high_res_img = generate_planet_texture(exoplanet)
            high_res_b64 = image_to_base64(high_res_img)
            
            low_res_img = generate_simple_texture(exoplanet)
            low_res_b64 = image_to_base64(low_res_img)
            
            update_data = {
                'texture_high_url': f"data:image/png;base64,{high_res_b64}",
                'texture_low_url': f"data:image/png;base64,{low_res_b64}",
                'texture_generated_at': datetime.utcnow()
            }
            
            collection.update_one(
                {'_id': exoplanet['_id']},
                {'$set': update_data}
            )
            
            print(f"  ✓ Stored textures for {planet_name} (high: {len(high_res_b64)} bytes, low: {len(low_res_b64)} bytes)")
        
        except Exception as e:
            print(f"  ✗ Error generating textures for {planet_name}: {e}")
    
    print(f"\n✓ Completed! Generated and stored textures for {total} exoplanets")
    client.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Generate exoplanet textures')
    parser.add_argument('--mode', choices=['local', 's3'], default='local',
                        help='Storage mode: local (Base64 in MongoDB) or s3 (upload to S3)')
    parser.add_argument('--limit', type=int, default=None,
                        help='Limit number of planets to process (for testing)')
    
    args = parser.parse_args()
    
    if args.mode == 's3':
        print("S3 mode not yet implemented. Use --mode local for now.")
        sys.exit(1)
    
    generate_and_store_textures(limit=args.limit, mode=args.mode)
