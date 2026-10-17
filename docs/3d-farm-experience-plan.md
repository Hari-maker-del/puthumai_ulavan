# Puthumai Ulavan — 3D Farm Experience Implementation Plan

## Goal
Give the existing React + TypeScript application a consistent, farm-inspired visual refresh and introduce an interactive 3D Indian farmland scene without replacing its current farming workflows.

## Included in this change
- Add React Three Fiber, Three.js, Drei, and Three.js type definitions.
- Create `src/components/farm/FarmWorld3D.tsx`: a responsive 3D scene with crop plots, field boundaries, village houses, palms, directional lighting, fog, and orbit controls.
- Place the scene on the public landing page and authenticated dashboard home.
- Apply a soft farm-green canvas to the authenticated dashboard shell while preserving the existing sidebar, topbar, responsive bottom navigation, offline banner, authentication guard, and routed page content.
- Keep all current dashboard cards, authenticated data bindings, route paths, and existing farm features in place.

## Architecture and performance
- Keep the 3D scene isolated in one React component so it can be optimized or replaced with scanned/photogrammetry assets later.
- Cap device pixel ratio at 1.5 and disable pan; users can rotate and zoom within bounded distances.
- Keep existing business data out of the scene for now: the current scene is a visual environment, not a claim that field geometry or crop health is connected to live farm records.
- Maintain all existing Supabase/auth/offline services unchanged.

## Validation checklist
1. Run `npm install` to resolve the new dependencies.
2. Run `npm run typecheck`, `npm run lint`, and `npm run build`.
3. Verify the landing page and `/dashboard` at mobile, tablet, and desktop widths.
4. Verify that dashboard cards, sidebar routes, onboarding redirects, sign-in persistence, offline mode, and realtime refresh still work.
5. Test WebGL fallback on devices where GPU/WebGL support is unavailable; consider a static image fallback before production rollout.

## Next realism phase
Replace the procedural placeholder geometry with optimized GLB assets for Tamil Nadu paddy plots, irrigation channels, farm paths, village homes, banana/coconut trees, and seasonal crop stages. Connect field selection to authenticated plot/crop records only after the data model supports a stable plot identifier and coordinates. Avoid fabricating crop-health or yield values.
