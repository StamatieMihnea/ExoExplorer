# Texture Quality Troubleshooting Guide

## Issue: Only Low-Quality Textures Rendering

If you're seeing only low-quality textures when moving the camera around, here's how to diagnose and fix the issue.

## Step 1: Check if Textures Have Been Generated

**Run the diagnostic script:**
```bash
cd /Users/mihnea/Desktop/exo-explorer/database
python check_textures.py
```

**Expected output if textures exist:**
```
📊 Total exoplanets in database: 1000
✅ Planets with high-res textures: 1000 (100.0%)
✅ Planets with low-res textures: 1000 (100.0%)

🔍 Sample planet with textures:
  Name: Proxima Centauri b
  High-res size: 45,234 bytes (44.2 KB)
  Low-res size: 1,234 bytes (1.2 KB)
```

**If you see "NO TEXTURES FOUND":**
You need to generate textures first!

```bash
# Test with 10 planets first
python generate_textures.py --mode local --limit 10

# Then generate for all
python generate_textures.py --mode local
```

## Step 2: Check Browser Console for Clues

Open your browser's Developer Tools (F12) and look for these messages:

### Good Signs ✅
```
Loaded high-res texture from URL for Proxima Centauri b
Loaded high-res texture from URL for TRAPPIST-1 b
📊 Texture Manager Stats:
  High-res: 45/150 (30.0%)
  Low-res: 15/300 (5.0%)
  Distance thresholds: High <24.0 LY, Low <32.0 LY
```

### Warning Signs ⚠️
```
High-res texture limit reached (150/150). Forcing cleanup...
Failed to load texture from data:image/png...: [Error]
Generated texture for Kepler-22 b (256x256)  // Fallback to procedural
```

### Bad Signs ❌
```
Texture request: Planet X at 15.0 LY → low-res
// Should be high-res at 15 LY!
```

## Step 3: Check Distance Thresholds

The texture quality depends on distance from camera:

| Distance | Texture Quality | Threshold |
|----------|----------------|-----------|
| < 24 light years | **High-res** (256-512px) | `HIGH_RES_DISTANCE` |
| 24-32 light years | **Low-res** (32-64px) | `LOW_RES_DISTANCE` |
| > 32 light years | **None** (not rendered) | Beyond cutoff |

**Current settings (updated):**
- High-res: < 600M scene units (24 light years)
- Low-res: < 800M scene units (32 light years)
- Max high-res textures in memory: 150
- Max low-res textures in memory: 300

## Step 4: Monitor Texture Usage in Real-Time

The console now logs texture stats every 5 seconds:

```
Performance: 60.0 FPS (16.67ms/frame) | Rendering: 142/1000 planets (14.2%)
📊 Texture Manager Stats:
  High-res: 87/150 (58.0%)
  Low-res: 42/300 (14.0%)
  Total cached: 129
  Distance thresholds: High <24.0 LY, Low <32.0 LY

Texture request: HD 40307 g at 14.3 LY → high-res (high: 87/150, low: 42/300)
```

**What to look for:**
- Are planets within 24 LY getting high-res?
- Is the high-res limit being hit (150/150)?
- Are textures loading from URLs or being generated?

## Step 5: Common Issues and Solutions

### Issue: "High-res texture limit reached"

**Cause:** Too many planets are close to camera

**Solutions:**
1. **Increase the limit** (already done - now 150 instead of 50)
2. **More aggressive cleanup**: The system now forces cleanup when limit is hit
3. **Move camera slower**: Rapid movement loads many textures quickly

### Issue: "Failed to load texture from URL"

**Cause:** Texture URLs are invalid or corrupted in database

**Solution:** Regenerate textures
```bash
python generate_textures.py --mode local
```

### Issue: Planets show low-res even when close

**Cause 1:** Distance threshold too small
- **Fixed:** Increased from 400M to 600M (16 LY → 24 LY)

**Cause 2:** Hitting texture limit too fast
- **Fixed:** Increased limit from 50 to 150 textures
- **Fixed:** Added aggressive cleanup when limit reached

**Cause 3:** No pre-generated textures in database
- **Solution:** Run `python generate_textures.py --mode local`

### Issue: Stuttering/frame drops when loading textures

**Cause:** Too many textures loading at once

**Solution:** The system already batches loading (10 at a time), but you can:
1. Reduce `maxVisiblePlanets` in `useThreeScene.ts` (currently 100)
2. Increase `TEXTURE_UPDATE_INTERVAL` (currently 120 frames = 2 seconds)

## Step 6: Adjust Settings (If Needed)

### For Better Quality (Slower):
Edit `src/services/texture-manager.service.ts`:

```typescript
private readonly HIGH_RES_DISTANCE = 800000000; // 32 LY instead of 24
private readonly MAX_HIGH_RES_TEXTURES = 200;   // 200 instead of 150
```

### For Better Performance (Lower Quality):
```typescript
private readonly HIGH_RES_DISTANCE = 400000000; // 16 LY instead of 24
private readonly MAX_HIGH_RES_TEXTURES = 100;   // 100 instead of 150
```

### For Slower Cameras:
Edit `src/hooks/useThreeScene.ts`:

```typescript
const TEXTURE_UPDATE_INTERVAL = 60; // Update every second (was 2 seconds)
```

## Step 7: Verify Camera Distance

To see how far you are from planets:

**Add this to console while the app is running:**
```javascript
// Get camera position
cameraRef.current.position.distanceTo(new THREE.Vector3(0,0,0))

// In light years
cameraRef.current.position.distanceTo(new THREE.Vector3(0,0,0)) / 25000000
```

Example:
- If you're 200M units from Earth: `200000000 / 25000000 = 8 LY`
- Nearest planets should be within 10-20 LY

## Step 8: Force High-Res for Testing

To temporarily force all textures to high-res (for testing):

Edit `src/services/texture-manager.service.ts`:

```typescript
// Temporarily change these lines
private readonly HIGH_RES_DISTANCE = 999999999; // Very large
private readonly LOW_RES_DISTANCE = 999999999;  // Very large
private readonly MAX_HIGH_RES_TEXTURES = 500;   // Very large
```

This will load high-res for everything (will be slower but confirms textures work).

## Expected Behavior After Fixes

1. **Close planets (<24 LY)**: High-res textures with detailed features
2. **Medium distance (24-32 LY)**: Low-res textures with basic colors
3. **Far planets (>32 LY)**: Not rendered (visibility culling)
4. **Console shows**: Texture loading messages and stats every 5 seconds
5. **Performance**: Smooth 60 FPS with no stuttering

## Quick Diagnostic Checklist

- [ ] MongoDB has pre-generated textures (`python check_textures.py`)
- [ ] Browser console shows "Loaded high-res texture from URL"
- [ ] High-res limit not being hit constantly (check stats)
- [ ] Distance thresholds are reasonable (24 LY for high-res)
- [ ] No errors in console about failed texture loading
- [ ] FPS is stable (check console every 5 seconds)

## Still Having Issues?

1. **Clear browser cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. **Restart dev server**: `npm run dev`
3. **Check MongoDB**: `mongosh` → `use exoplanet_explorer` → `db.exoplanets.findOne()`
4. **Regenerate textures**: `python generate_textures.py --mode local`
5. **Check console for errors**: Look for red error messages

## Contact Information

If you're still seeing issues after following this guide:
1. Share your browser console output (copy/paste)
2. Share output from `python check_textures.py`
3. Share your camera distance from planets
4. Note whether textures exist in database or not

