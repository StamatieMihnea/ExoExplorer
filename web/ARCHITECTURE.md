# Exo Explorer - Architecture Documentation

## Overview

This document describes the modular architecture of the Exo Explorer application, a 3D space visualization tool built with Next.js, Three.js, and 3D Tiles.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Main page entry point
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
│
├── views/                 # High-level view components
│   └── SceneView.tsx     # Main 3D scene view with UI overlay
│
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   │   ├── GlassCard.tsx
│   │   └── GlassButton.tsx
│   └── layout/           # Layout components
│       ├── Header.tsx
│       ├── InfoPanel.tsx
│       ├── StatsCard.tsx
│       └── ActionButtons.tsx
│
├── hooks/                 # Custom React hooks
│   └── useThreeScene.ts  # Main scene management hook
│
├── services/              # Business logic services
│   ├── scene.service.ts      # Scene, camera, lighting setup
│   ├── tiles.service.ts      # 3D Tiles (Earth) management
│   ├── exoplanets.service.ts # Exoplanet generation
│   └── camera.service.ts     # Camera controls & animation
│
├── utils/                 # Utility functions
│   ├── math.utils.ts     # Mathematical helpers
│   └── texture.utils.ts  # Texture optimization
│
├── types/                 # TypeScript type definitions
│   └── scene.types.ts    # Scene-related types
│
└── constants/             # Application constants
    └── scene.constants.ts # Scene configuration values
```

## Architecture Principles

### 1. Separation of Concerns

Each module has a single, well-defined responsibility:

- **Services**: Handle complex business logic and Three.js object lifecycle
- **Hooks**: Manage React state and side effects
- **Components**: Handle presentation and user interaction
- **Utils**: Provide pure, reusable functions
- **Types**: Define contracts and interfaces
- **Constants**: Centralize configuration values

### 2. Dependency Flow

```
Components/Views
    ↓
  Hooks
    ↓
 Services
    ↓
  Utils
```

Higher-level modules depend on lower-level ones, never the reverse.

### 3. Type Safety

All modules are fully typed with TypeScript, ensuring:
- Compile-time error detection
- Better IDE support and autocomplete
- Self-documenting code

## Key Modules

### Services Layer

#### SceneService
Handles basic Three.js scene setup:
- Scene creation with fog
- Camera initialization
- Lighting configuration
- Renderer setup
- Window resize handling

#### TilesService
Manages the 3D Tiles renderer for Earth visualization:
- DRACO loader configuration
- Cesium Ion authentication
- LOD (Level of Detail) settings
- Texture optimization
- Tiles update and rotation

#### ExoplanetsService
Generates and manages exoplanet objects:
- LOD mesh generation
- Random positioning on spheres
- Material creation
- Resource disposal

#### CameraService
Controls camera behavior:
- FlyControls setup
- Mouse input handling (right-click only navigation)
- Camera animations (smooth transitions)
- "Return to Earth" functionality

### Hooks Layer

#### useThreeScene
Main hook that orchestrates all services:
- Initializes all services
- Manages Three.js lifecycle
- Handles animation loop
- Provides cleanup on unmount
- Exposes `returnToEarth` callback

### Components Layer

#### UI Components
- **GlassCard**: Glassmorphic container with blur effect
- **GlassButton**: Stylized button with multiple variants

#### Layout Components
- **Header**: App branding and navigation buttons
- **InfoPanel**: User instructions
- **StatsCard**: Statistics display
- **ActionButtons**: Action controls (Return to Earth, etc.)

### Views Layer

#### SceneView
Combines the 3D scene with UI overlay:
- Uses `useThreeScene` hook for scene management
- Arranges UI components
- Manages pointer events (UI vs. 3D interaction)

## Configuration

All configuration is centralized in `constants/scene.constants.ts`:

- Camera settings (FOV, near/far planes, position)
- Fog configuration
- Lighting setup
- Renderer options
- Tiles configuration (Cesium Ion, LOD settings)
- Exoplanet generation parameters
- Animation settings
- Control settings

This makes it easy to adjust behavior without touching code logic.

## Utilities

### math.utils
- `getRandomPointOnSphere`: Generate random positions on sphere surfaces
- `lerpCamera`: Smooth camera interpolation
- `isCameraAtTarget`: Check animation completion

### texture.utils
- `fixTextures`: Apply texture optimizations to prevent glitching

## Type Definitions

All types are defined in `types/scene.types.ts`:

- `SceneConfig`: Complete scene configuration
- `CameraConfig`: Camera parameters
- `TilesConfig`: 3D Tiles settings
- `ExoplanetConfig`: Exoplanet generation settings
- `CameraAnimation`: Animation state
- `SceneRefs`: References to Three.js objects

## Adding New Features

### Adding a New UI Component

1. Create component in `components/ui/` or `components/layout/`
2. Export from `components/index.ts`
3. Import and use in `views/SceneView.tsx`

### Adding a New Service

1. Create service class in `services/`
2. Export from `services/index.ts`
3. Initialize in `hooks/useThreeScene.ts`
4. Add configuration to `constants/scene.constants.ts`
5. Add types to `types/scene.types.ts`

### Adding Animation/Interaction

1. Add method to appropriate service (usually `CameraService`)
2. Expose through `useThreeScene` hook
3. Connect to UI component via callback prop

## Testing Strategy

While no tests are currently implemented, the modular architecture enables:

- **Unit tests** for services and utils (pure logic)
- **Integration tests** for hooks
- **Component tests** for UI components
- **E2E tests** for complete user flows

## Performance Considerations

- **LOD (Level of Detail)**: Exoplanets use LOD to render appropriate detail based on distance
- **Texture Optimization**: Anisotropic filtering and proper mipmapping
- **Frame-based Updates**: Some operations (texture fixes) happen periodically, not every frame
- **Object Pooling**: Geometries are reused across multiple exoplanets

## Future Improvements

1. **State Management**: Add Zustand or Redux for complex app state
2. **Data Layer**: Fetch real exoplanet data from NASA API
3. **Routing**: Add pages for search, favorites, individual exoplanets
4. **Persistence**: Save user favorites and settings
5. **Accessibility**: Add keyboard navigation and screen reader support
6. **Performance Monitoring**: Add FPS counter and performance metrics
7. **Testing**: Implement comprehensive test suite

## Development Guidelines

1. **Always type everything** - No implicit `any` types
2. **Keep services stateless** - State should live in hooks/React
3. **Single Responsibility** - Each module does one thing well
4. **Consistent naming** - Services end in `.service.ts`, utils in `.utils.ts`
5. **Export through index files** - Makes imports cleaner
6. **Document complex logic** - Add comments for non-obvious code
7. **Clean up resources** - Always dispose of Three.js objects

## Dependencies

### Core
- **Next.js 15**: React framework
- **React 19**: UI library
- **Three.js**: 3D graphics library
- **TypeScript**: Type safety

### 3D Rendering
- **3d-tiles-renderer**: Cesium 3D Tiles support
- **three/examples/jsm**: Additional Three.js modules (FlyControls, DRACO)

### Styling
- **Tailwind CSS 4**: Utility-first CSS framework

## License

[Your License Here]

