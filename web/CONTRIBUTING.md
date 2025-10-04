# Contributing to Exo Explorer

Thank you for your interest in contributing! This guide will help you understand the codebase and make meaningful contributions.

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Basic knowledge of React, Three.js, and TypeScript
- Familiarity with Next.js is helpful

### Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd exo-explorer/web

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## Code Architecture

Please read [ARCHITECTURE.md](./ARCHITECTURE.md) and [src/README.md](./src/README.md) to understand the modular structure.

### Key Principles

1. **Modularity**: Each module has a single responsibility
2. **Type Safety**: Everything is fully typed with TypeScript
3. **Clean Code**: Follow established patterns and conventions
4. **Documentation**: Document complex logic and public APIs

## Making Changes

### Before You Start

1. Check existing issues or create a new one
2. Discuss major changes before implementing
3. Keep changes focused and atomic

### Development Workflow

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Add types for all new code
   - Update documentation as needed

3. **Test your changes**
   - Manually test in the browser
   - Ensure no TypeScript errors
   - Check for console errors/warnings

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

   Use conventional commits:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `refactor:` - Code refactoring
   - `style:` - Code style changes (formatting)
   - `perf:` - Performance improvements
   - `test:` - Adding tests
   - `chore:` - Maintenance tasks

5. **Push and create a PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Code Style Guide

### TypeScript

```typescript
// ✅ Good: Explicit types
interface Props {
  title: string;
  count: number;
  onClose: () => void;
}

function MyComponent({ title, count, onClose }: Props) {
  // ...
}

// ❌ Bad: Implicit any
function MyComponent(props) {
  // ...
}
```

### Services

```typescript
// ✅ Good: Class-based service with clear lifecycle
export class MyService {
  private config: MyConfig;
  
  constructor(config: MyConfig) {
    this.config = config;
  }
  
  create(): MyResource {
    // Implementation
  }
  
  update(): void {
    // Implementation
  }
  
  dispose(): void {
    // Cleanup
  }
}

// ❌ Bad: Stateful service without cleanup
export class MyService {
  private state = {};
  create() { /* ... */ }
}
```

### Components

```typescript
// ✅ Good: Typed props, clear structure
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={`btn-${variant}`}>
      {label}
    </button>
  );
}

// ❌ Bad: Untyped, unclear
export function Button(props) {
  return <button onClick={props.onClick}>{props.label}</button>;
}
```

### Hooks

```typescript
// ✅ Good: Clear return type, proper cleanup
export function useMyHook(): { data: Data | null; loading: boolean } {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const service = new MyService();
    // ... fetch data
    
    return () => {
      service.dispose();
    };
  }, []);
  
  return { data, loading };
}
```

## Adding New Features

### New UI Component

1. Create component file:
   ```typescript
   // src/components/ui/MyComponent.tsx
   interface MyComponentProps {
     // props
   }
   
   export function MyComponent({ }: MyComponentProps) {
     return <div>...</div>;
   }
   ```

2. Export from index:
   ```typescript
   // src/components/index.ts
   export { MyComponent } from './ui/MyComponent';
   ```

3. Use in views:
   ```typescript
   import { MyComponent } from '@/components';
   ```

### New Service

1. Create service file:
   ```typescript
   // src/services/my.service.ts
   export class MyService {
     create() { }
     update() { }
     dispose() { }
   }
   ```

2. Add types:
   ```typescript
   // src/types/scene.types.ts
   export interface MyConfig {
     // config
   }
   ```

3. Add constants:
   ```typescript
   // src/constants/scene.constants.ts
   export const MY_CONFIG: MyConfig = { };
   ```

4. Export from index:
   ```typescript
   // src/services/index.ts
   export { MyService } from './my.service';
   ```

5. Use in hooks:
   ```typescript
   // src/hooks/useThreeScene.ts
   const myService = new MyService();
   ```

### New Hook

1. Create hook file:
   ```typescript
   // src/hooks/useMyHook.ts
   export function useMyHook() {
     // implementation
   }
   ```

2. Export from index:
   ```typescript
   // src/hooks/index.ts
   export { useMyHook } from './useMyHook';
   ```

## Common Tasks

### Updating Scene Configuration

Edit `src/constants/scene.constants.ts`:

```typescript
export const SCENE_CONFIG = {
  camera: {
    fov: 45, // Change field of view
    // ...
  },
  // ...
};
```

### Adding a New Exoplanet Property

1. Update type:
   ```typescript
   // src/types/scene.types.ts
   export interface ExoplanetConfig {
     count: number;
     radius: number;
     color?: number; // New property
   }
   ```

2. Update constant:
   ```typescript
   // src/constants/scene.constants.ts
   export const EXOPLANET_CONFIG = {
     count: 10000,
     radius: 5000000,
     color: 0xffffff, // New property
   };
   ```

3. Update service:
   ```typescript
   // src/services/exoplanets.service.ts
   this.material = new THREE.MeshLambertMaterial({
     color: this.config.color,
   });
   ```

### Adding UI to the Scene

1. Create component:
   ```typescript
   // src/components/layout/SearchBar.tsx
   export function SearchBar() {
     return <input type="search" placeholder="Search exoplanets..." />;
   }
   ```

2. Add to SceneView:
   ```typescript
   // src/views/SceneView.tsx
   import { SearchBar } from '@/components';
   
   // In JSX:
   <div className="fixed inset-0 pointer-events-none">
     <SearchBar />
   </div>
   ```

## Performance Guidelines

1. **Avoid unnecessary re-renders**
   ```typescript
   // Use memo for expensive components
   export const ExpensiveComponent = memo(function ExpensiveComponent() {
     // ...
   });
   ```

2. **Dispose Three.js objects**
   ```typescript
   geometry.dispose();
   material.dispose();
   texture.dispose();
   ```

3. **Use LOD for distant objects**
   ```typescript
   const lod = new THREE.LOD();
   lod.addLevel(highDetail, 1000);
   lod.addLevel(lowDetail, 10000);
   ```

4. **Optimize animations**
   ```typescript
   // Don't update every frame if not needed
   if (frameCount % 60 === 0) {
     // Update once per second
   }
   ```

## Debugging Tips

### Check TypeScript Errors
```bash
npm run build
```

### Enable Three.js Debugging
```typescript
renderer.debug.checkShaderErrors = true;
```

### Log Service Lifecycle
```typescript
console.log('Service initialized', service);
useEffect(() => {
  return () => console.log('Service disposed', service);
}, []);
```

### Monitor Performance
```typescript
const stats = new Stats();
document.body.appendChild(stats.dom);
```

## Questions?

- Check [ARCHITECTURE.md](./ARCHITECTURE.md) for architecture details
- Check [src/README.md](./src/README.md) for code structure
- Open an issue for bugs or feature requests
- Start a discussion for questions

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

Thank you for contributing! 🚀

