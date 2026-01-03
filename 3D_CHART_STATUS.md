# 3D Community Graph - Current Status

**Status:** Paused / Beta Implementation
**Last Updated:** 2026-01-03

## Overview

An experimental 3D force-directed graph visualization for the community referral network, built using `react-force-graph-3d` and Three.js.

## What Was Implemented

### New Components

1. **`CommunityViewToggle.tsx`**
   - Toggle button to switch between 2D and 3D views
   - Located at: `apps/web/src/components/CommunityViewToggle.tsx`
   - Simple state management for view switching

2. **`CommunityMobile.tsx`**
   - Full 3D force-directed graph implementation
   - Located at: `apps/web/src/components/CommunityMobile.tsx`
   - Features:
     - 3D sphere nodes with user profile images as textures
     - Floating text labels for each node
     - Color-coded by referral depth (6-color palette)
     - Expand/collapse functionality for branches
     - Click interactions to show user details
     - Animated particles along connection links
     - Top-down DAG (Directed Acyclic Graph) layout
     - Auto zoom-to-fit on interactions
     - WebGL detection and fallback UI

3. **`ErrorBoundary.tsx`**
   - React error boundary for catching 3D rendering errors
   - Located at: `apps/web/src/components/ErrorBoundary.tsx`

### Modified Files

1. **`apps/web/src/app/community/page.tsx`**
   - Now uses `CommunityViewToggle` instead of direct `ReferralNetworkGraph`
   - Allows users to switch between 2D and 3D views

2. **`apps/web/src/auth.ts` & `apps/web/src/auth.config.ts`**
   - Added user image to session data
   - Enables profile pictures to be shown in 3D nodes

3. **`apps/web/package.json`**
   - Added dependencies:
     - `three@^0.182.0`
     - `@types/three@^0.182.0`
     - `react-force-graph-3d@^1.29.0`

## Key Features

- **3D Visualization**: Uses WebGL and Three.js for hardware-accelerated 3D rendering
- **Profile Images**: User avatars rendered as spheres with texture mapping
- **Interactive Collapse/Expand**: Click nodes to show/hide their children
- **Depth-based Coloring**: Visual hierarchy through color coding
- **Responsive**: Adapts to container size with ResizeObserver
- **Animation**: Force simulation with configurable physics parameters
- **User Details Card**: Bottom overlay showing clicked user info

## Known Issues & Blockers

### 1. WebGL Requirement
- **Issue**: Requires GPU/WebGL support which is not available in containerized environments (e.g., Codespaces, Docker)
- **Impact**: 3D view shows fallback message in environments without GPU access
- **Workaround**: WebGL detection implemented with graceful fallback UI

### 2. Performance Concerns
- **Issue**: Large graphs (100+ nodes) may experience performance degradation
- **Status**: Not fully tested at scale
- **Mitigation**: Collapse functionality helps reduce visible nodes

### 3. Mobile Experience
- **Issue**: 3D navigation can be challenging on mobile devices (touch controls for rotate/pan/zoom)
- **Status**: Not optimized for mobile UX
- **Component Name**: Despite being named "CommunityMobile", it's actually not mobile-optimized

### 4. Loading Times
- **Issue**: Three.js and react-force-graph-3d add ~500KB to bundle size
- **Mitigation**: Dynamic import with SSR disabled (`next/dynamic`)

### 5. Incomplete Testing
- **Issue**: No automated tests written for 3D components
- **Status**: Manual testing only

### 6. Browser Compatibility
- **Issue**: Older browsers may not support WebGL 2
- **Mitigation**: WebGL detection with fallback to 2D view

## Technical Architecture

```
CommunityViewToggle (Parent)
├── Toggle Button (Switch between views)
├── ReferralNetworkGraph (2D View - ReactFlow)
└── CommunityMobile (3D View - Three.js)
    ├── ErrorBoundary (Error handling)
    ├── WebGL Detection (Feature check)
    ├── ForceGraph3D (react-force-graph-3d)
    │   ├── Node Rendering (Three.js Sphere + Sprite)
    │   ├── Link Rendering (Arrows + Particles)
    │   └── Force Simulation (d3-force-3d)
    └── User Card Overlay (Click details)
```

## Dependencies Added

```json
{
  "three": "^0.182.0",
  "@types/three": "^0.182.0",
  "react-force-graph-3d": "^1.29.0"
}
```

This also pulled in transitive dependencies:
- `d3-force-3d`
- `3d-force-graph`
- `ngraph.forcelayout`
- Various d3 utilities

## Recommendations for Future Work

### High Priority
1. **Performance Testing**: Test with networks of 500+ users
2. **Mobile Optimization**: Improve touch controls and UI for mobile devices
3. **Accessibility**: Add keyboard navigation and screen reader support
4. **Testing**: Write integration tests for 3D components

### Medium Priority
5. **Loading States**: Better UX during graph initialization
6. **Search/Filter**: Add ability to search for specific users in 3D view
7. **Export**: Allow users to export 3D visualization as image/video
8. **Customization**: User preferences for colors, node size, force strength

### Low Priority
9. **VR Support**: Explore WebXR for immersive viewing
10. **Animation Presets**: Different layout algorithms (radial, spiral, etc.)

## How to Continue Work

To resume development on the 3D chart:

1. **Test in production environment** with real GPU access
2. **Gather user feedback** on the Beta feature
3. **Monitor performance metrics** and WebGL availability rates
4. **Consider A/B testing** to compare 2D vs 3D engagement
5. **Iterate based on data** - may decide to simplify or remove

## Alternative Approaches Considered

1. **Canvas 2.5D**: Pseudo-3D using 2D canvas (rejected - less immersive)
2. **CSS 3D Transforms**: CSS-based 3D (rejected - performance issues)
3. **Pre-rendered Static**: Generate 3D visualization server-side (rejected - no interactivity)

## Cleanup Notes

- Files are reasonably organized
- No obvious technical debt introduced
- Dependencies are legitimate and maintained
- Code is documented with inline comments
- Error handling is comprehensive

## Decision Point

**Should we keep or remove the 3D feature?**

**Keep if:**
- Users love it in environments with GPU support
- Provides unique value over 2D view
- Performance is acceptable at scale

**Remove if:**
- Low adoption due to WebGL requirement
- Performance issues at scale
- Maintenance burden too high
- 2D view proves sufficient

**Current Recommendation:** Keep behind Beta toggle, gather data, decide in 2-4 weeks.
