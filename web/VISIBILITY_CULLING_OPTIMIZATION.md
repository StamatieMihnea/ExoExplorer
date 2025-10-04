# Visibility Culling & Performance Optimization

## Overview

Implemented frustum culling and visibility management to significantly improve rendering performance by only rendering objects that are visible to the camera.

## Key Improvements

### 1. **Frustum Culling** 
- Objects outside the camera's view frustum are automatically hidden
- Three.js skips rendering objects with `visible = false`
- Reduces GPU workload by not drawing off-screen objects

### 2. **Distance-Based Culling**
- Planets beyond a maximum render distance (500M scene units) are culled
- Configurable threshold for different performance needs
- Reduces unnecessary computations for distant objects

### 3. **Optimized Texture Updates**
- Textures are ONLY updated for visible planets
- Limited to top 100 closest visible planets
- Sorted by distance (closest first) for better visual quality
- Reduces CPU time spent on texture generation

### 4. **Smart Click Handling**
- Raycasting only checks visible objects
- Significantly faster intersection tests
- Better user interaction performance

### 5. **Performance Monitoring**
- Real-time visibility statistics logged every 5 seconds
- Shows FPS, frame time, and rendering percentage
- Example: `Performance: 60.0 FPS (16.67ms/frame) | Rendering: 142/1000 planets (14.2%)`

## Implementation Details

### New Service: `VisibilityService`

```typescript
// Core methods:
- updateFrustum(camera): Updates the view frustum from camera
- isVisible(object, cameraPosition): Checks if object is visible
- updateVisibility(exoplanets, camera): Updates all objects' visibility
- getVisibleSortedByDistance(): Returns visible objects sorted by distance
```

### Integration in `useThreeScene`

1. **Initialization**: VisibilityService created with scene setup
2. **Animation Loop**:
   - Visibility updated every 30 frames (~0.5s at 60fps)
   - Texture updates only for visible planets every 120 frames
   - Statistics logged every 300 frames
3. **Cleanup**: Service properly disposed on unmount

## Performance Impact

### Before (All Objects Rendered)
- All exoplanets rendered every frame
- All exoplanets considered for texture updates
- Raycasting against all objects
- Lower FPS with large planet counts

### After (Visibility Culling)
- Only 10-30% of objects typically rendered (varies by camera view)
- Texture updates limited to visible planets only
- Raycasting only against visible objects
- Higher FPS, especially with 500+ planets

## Configuration

### Adjustable Parameters

In `src/hooks/useThreeScene.ts`:
```typescript
VISIBILITY_UPDATE_INTERVAL = 30  // How often to check visibility
TEXTURE_UPDATE_INTERVAL = 120    // How often to update textures
STATS_LOG_INTERVAL = 300         // How often to log stats
```

In `VisibilityService` constructor:
```typescript
maxRenderDistance = 500000000    // Maximum render distance in scene units
```

In texture update:
```typescript
maxVisiblePlanets = 100          // Max visible planets to update textures for
```

## Tuning for Different Scenarios

### High-End Systems
- Increase `maxVisiblePlanets` to 200
- Decrease `VISIBILITY_UPDATE_INTERVAL` to 15
- Increase `maxRenderDistance`

### Low-End Systems  
- Decrease `maxVisiblePlanets` to 50
- Increase `VISIBILITY_UPDATE_INTERVAL` to 60
- Decrease `maxRenderDistance` to 300000000

### Large Datasets (1000+ planets)
- Keep current settings
- Consider increasing `TEXTURE_UPDATE_INTERVAL` to 180

## Technical Notes

### Frustum Culling
- Uses Three.js `Frustum` class for accurate visibility tests
- Checks object bounding spheres for better accuracy with LOD objects
- Updates projection matrix from camera each check

### LOD Integration
- Visibility culling works seamlessly with Level-of-Detail system
- LOD distance calculations still apply to visible objects
- Hidden objects skip LOD calculations entirely

### Memory Efficiency
- Visibility cache prevents redundant calculations
- Geometries and materials remain in memory (not disposed)
- Only visibility flags are toggled

## Future Enhancements

1. **Occlusion Culling**: Hide planets behind Earth
2. **Spatial Partitioning**: Use octree/BVH for faster visibility queries
3. **Predictive Loading**: Pre-load textures for planets entering view
4. **Adaptive Quality**: Reduce planet detail based on view density
5. **GPU Instancing**: Batch render similar-sized planets

## Monitoring Performance

Check the browser console for real-time performance metrics:
```
Performance: 60.0 FPS (16.67ms/frame) | Rendering: 142/1000 planets (14.2%)
```

If FPS drops below 30:
1. Reduce `maxVisiblePlanets`
2. Increase update intervals
3. Check total planet count
4. Consider reducing LOD detail levels

## References

- Three.js Frustum: https://threejs.org/docs/#api/en/math/Frustum
- LOD Documentation: https://threejs.org/docs/#api/en/objects/LOD
- WebGL Best Practices: Minimize draw calls and state changes

