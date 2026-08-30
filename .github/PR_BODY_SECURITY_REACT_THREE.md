## Summary

- remove unused `@react-spring/three`, `@react-three/drei`, `@react-three/fiber`, and `three` runtime dependencies
- remove the unreferenced legacy `Avatar3D.tsx` component that was the only source file still importing that stack
- refresh the pnpm lockfile

## Validation

- `pnpm install --frozen-lockfile` ✅
- `pnpm exec tsc --noEmit` ✅

## Scope

No Practice/session behavior, scoring, auth, database, or UI changes. This is dependency and dead-code cleanup only.
