# Source Code Structure

This directory contains the modular, maintainable source code for Exo Explorer.

## Quick Start

```typescript
// Import services
import { SceneService, TilesService, CameraService } from '@/services';

// Import hooks
import { useThreeScene } from '@/hooks';

// Import components
import { Header, StatsCard, GlassButton } from '@/components';

// Import utilities
import { getRandomPointOnSphere, fixTextures } from '@/utils';
```

## Directory Overview

### `/app` - Next.js App Router
- `page.tsx` - Main entry point
- `layout.tsx` - Root layout with metadata
- `globals.css` - Global styles and Tailwind directives

### `/views` - View Components
High-level components that combine multiple features:
- `SceneView.tsx` - Main 3D scene with UI overlay

### `/components` - UI Components
Reusable, presentational components organized by type:

**UI Components** (`/ui`)
- `GlassCard.tsx` - Glassmorphic card container
- `GlassButton.tsx` - Stylized button with variants

**Layout Components** (`/layout`)
- `Header.tsx` - App header with branding
- `InfoPanel.tsx` - Navigation instructions
- `StatsCard.tsx` - Statistics display
- `ActionButtons.tsx` - Action controls

### `/hooks` - Custom React Hooks
- `useThreeScene.ts` - Orchestrates scene setup and lifecycle

### `/services` - Business Logic
Encapsulated, reusable services for complex operations:

- `scene.service.ts` - Scene, camera, renderer setup
- `tiles.service.ts` - 3D Tiles (Earth) management
- `exoplanets.service.ts` - Exoplanet generation
- `camera.service.ts` - Camera controls and animations

**Service Pattern:**
```typescript
class MyService {
  constructor(config) { }
  create() { }
  update() { }
  dispose() { }
}
```

### `/utils` - Utility Functions
Pure functions for common operations:

- `math.utils.ts` - Math helpers (sphere positioning, lerping)
- `texture.utils.ts` - Texture optimization

### `/types` - TypeScript Definitions
- `scene.types.ts` - All scene-related type definitions

### `/constants` - Configuration
- `scene.constants.ts` - Centralized configuration values

## Module Boundaries

### Services
- ✅ Can import: utils, types, constants, Three.js
- ❌ Cannot import: hooks, components, views

### Hooks
- ✅ Can import: services, utils, types, constants, React
- ❌ Cannot import: views

### Components
- ✅ Can import: hooks, types, React
- ⚠️ Sparingly import: utils (prefer through hooks)
- ❌ Cannot import: services directly

### Views
- ✅ Can import: components, hooks, types
- ❌ Cannot import: services directly

## Adding New Features

### New UI Component
1. Create in `components/ui/` or `components/layout/`
2. Export from `components/index.ts`
3. Use in views

Example:
```typescript
// components/ui/MyButton.tsx
export function MyButton({ onClick }) {
  return <button onClick={onClick}>Click me</button>;
}

// components/index.ts
export { MyButton } from './ui/MyButton';

// views/SceneView.tsx
import { MyButton } from '@/components';
```

### New Service
1. Create service class in `services/`
2. Define types in `types/`
3. Add constants in `constants/`
4. Export from `services/index.ts`
5. Use in `useThreeScene` hook

Example:
```typescript
// services/particles.service.ts
export class ParticlesService {
  create() { /* ... */ }
  update() { /* ... */ }
  dispose() { /* ... */ }
}

// hooks/useThreeScene.ts
const particlesService = new ParticlesService();
const particles = particlesService.create();
```

### New Hook
1. Create hook in `hooks/`
2. Export from `hooks/index.ts`
3. Use in components/views

Example:
```typescript
// hooks/useExoplanetData.ts
export function useExoplanetData(id: string) {
  const [data, setData] = useState(null);
  // ... fetch logic
  return data;
}

// hooks/index.ts
export { useExoplanetData } from './useExoplanetData';
```

## Best Practices

### 1. Type Everything
```typescript
// ❌ Bad
function calculate(a, b) {
  return a + b;
}

// ✅ Good
function calculate(a: number, b: number): number {
  return a + b;
}
```

### 2. Extract Constants
```typescript
// ❌ Bad
camera.position.set(0, 0, 50000000);

// ✅ Good
import { SCENE_CONFIG } from '@/constants/scene.constants';
camera.position.copy(SCENE_CONFIG.camera.initialPosition);
```

### 3. Clean Up Resources
```typescript
// ✅ Good
useEffect(() => {
  const service = new MyService();
  const resource = service.create();
  
  return () => {
    service.dispose();
  };
}, []);
```

### 4. Single Responsibility
```typescript
// ❌ Bad - does too much
class SceneManager {
  createScene() { }
  createCamera() { }
  createExoplanets() { }
  handleInput() { }
}

// ✅ Good - focused services
class SceneService { createScene() { } }
class CameraService { handleInput() { } }
class ExoplanetsService { createExoplanets() { } }
```

### 5. Use Index Exports
```typescript
// ❌ Bad
import { SceneService } from '@/services/scene.service';
import { TilesService } from '@/services/tiles.service';
import { CameraService } from '@/services/camera.service';

// ✅ Good
import { SceneService, TilesService, CameraService } from '@/services';
```

## Testing Locations

When tests are added:

- Service tests: `__tests__/services/`
- Hook tests: `__tests__/hooks/`
- Component tests: `__tests__/components/`
- Util tests: `__tests__/utils/`

## File Naming Conventions

- Components: `PascalCase.tsx` (e.g., `GlassCard.tsx`)
- Services: `kebab-case.service.ts` (e.g., `scene.service.ts`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useThreeScene.ts`)
- Utils: `kebab-case.utils.ts` (e.g., `math.utils.ts`)
- Types: `kebab-case.types.ts` (e.g., `scene.types.ts`)
- Constants: `kebab-case.constants.ts` (e.g., `scene.constants.ts`)

## Performance Tips

1. **Memoize expensive calculations** with `useMemo`
2. **Debounce event handlers** for resize, scroll
3. **Use refs for values that don't need re-renders**
4. **Dispose Three.js objects** to prevent memory leaks
5. **Use LOD** for distant objects

## Debugging

```typescript
// Enable Three.js debug mode
renderer.debug.checkShaderErrors = true;

// Log service lifecycle
console.log('Service created:', service);
console.log('Service disposing:', service);

// Monitor frame rate
const stats = new Stats();
document.body.appendChild(stats.dom);
```

## Resources

- [Three.js Documentation](https://threejs.org/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Hooks Guide](https://react.dev/reference/react)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [3D Tiles Renderer](https://github.com/NASA-AMMOS/3DTilesRendererJS)

