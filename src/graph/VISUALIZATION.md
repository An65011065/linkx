# Graph Visualization Effects and Mechanics

This document explains the intricate mechanics behind the graph visualization system, including its centering behavior, force simulations, and visual emergence effects.

## Table of Contents

- [Initial Loading and Setup](#initial-loading-and-setup)
- [Force System](#force-system)
- [Visual Elements](#visual-elements)
- [Animation Phases](#animation-phases)
- [Performance Optimizations](#performance-optimizations)
- [Technical Implementation](#technical-implementation)

## Initial Loading and Setup

### Loading State

- Displays "Loading browsing data..." centered in the viewport
- Uses Nunito font with fade-in animation
- Occupies full browser window dimensions

### Initial Node Positioning

- All nodes start in a tight 100×100 pixel cluster at screen center
- Each node gets random offset: ±50px in both X and Y directions
- Creates controlled initial chaos for organic expansion

### Viewport Management

```typescript
centerX = window.innerWidth / 2;
centerY = window.innerHeight / 2;
```

- Continuously tracks viewport dimensions
- Recalculates center point on window resize
- Maintains proper centering during browser resizing

## Force System

### Core Forces

#### 1. Center Force

- Constant gentle pull toward screen center
- Strength: 0.1 (10% of maximum)
- Never turns off, prevents network drift
- Adapts to window resizing

#### 2. Repulsion Force

- Pushes nodes apart to prevent overlapping
- Strength: -500 (negative for repulsion)
- Maximum effect distance: 250 pixels
- Gradually activates over 500ms

#### 3. Link Attraction

- Pulls connected nodes together
- Optimal distance: 100 pixels
- Strength: 0.6 (60% of maximum)
- Activates after 250ms delay

#### 4. Collision Detection

```typescript
radius = Math.max(15, Math.min(30, visitCount * 3 + entropy * 2)) + 10;
```

- Prevents node overlap
- Base radius: 15-30 pixels
- Additional 10px buffer zone
- Scales with visit count and URL complexity

#### 5. Cluster Force

- Groups nodes from same browser tab
- Strength: 0.15 (15% of maximum)
- Only affects clusters of 3+ nodes
- Activates after 1000ms

### Force Balancing

#### Strength Calculation

```typescript
const progress = (currentTime - startTime) / duration;
const easeOutProgress = 1 - Math.pow(1 - progress, 3);
return targetStrength * easeOutProgress;
```

- Uses cubic ease-out curve
- Smooth force activation
- Prevents sudden movements

#### Force Timing

1. Collision (0ms): Immediate spacing
2. Repulsion (0-500ms): Gradual separation
3. Links (250-750ms): Structure formation
4. Clusters (1000-1500ms): Group organization

## Visual Elements

### Nodes

- Circle radius: 8-20 pixels
- Color based on tab ID
- Red border (3px) for multiple visits
- Opacity: 90% active, 60% inactive

### Labels

- Font: Nunito Regular, 11px
- Position: 16px below node
- Fade in: 800ms delay, 400ms duration
- Shows formatted URL

### Links

- Straight lines with arrowheads
- Width: 1-8 pixels based on frequency
- Opacity: 60%
- Fade in: 200ms delay, 300ms duration

### Cluster Boundaries

- Dashed lines: 3px dashes, 2px gaps
- Active clusters: Blue (30% opacity)
- Inactive clusters: Gray (20% opacity)
- 25px padding from nodes

### Time Labels

- Position: 30px above cluster center
- Yellow highlight background
- 12px bold font
- Shows session duration

## Animation Phases

### Phase 1: Initial Burst (0-500ms)

- Nodes appear at center
- Collision and repulsion begin
- Rapid initial expansion

### Phase 2: Structure Formation (500-1500ms)

- Links become visible
- Connection forces activate
- Network topology emerges

### Phase 3: Organization (1500-2500ms)

- Cluster forces engage
- Labels fade in
- Groups become distinct

### Phase 4: Refinement (2500-3500ms)

- Final position settling
- Cluster boundaries appear
- Time labels show

### Phase 5: Interaction Ready (3500ms+)

- Full interactivity enabled
- Reduced simulation frequency
- Smooth dragging response

## Performance Optimizations

### Hardware Acceleration

```css
.nodes,
.links,
.clusters {
    transform-origin: center center;
    backface-visibility: hidden;
    perspective: 1000px;
    transform: translateZ(0);
}
```

- GPU acceleration for smooth animations
- Reduced CPU load
- Better mobile performance

### Simulation Efficiency

- Tick rate reduction after settling
- Velocity damping: 0.4
- Alpha decay: 0.01
- Force calculation optimization

### Visual Performance

- Will-change hints for GPU
- Efficient CSS transitions
- Proper z-indexing layers

## Technical Implementation

### Force Simulation Setup

```typescript
const simulation = d3
    .forceSimulation(nodes)
    .alphaDecay(0.01)
    .velocityDecay(0.4)
    .alpha(0.7);
```

### Force Updates

```typescript
simulation
    .force("charge", d3.forceManyBody().strength(repulsionStrength))
    .force("link", d3.forceLink(links).strength(linkStrength))
    .force("center", d3.forceCenter(centerX, centerY).strength(0.1))
    .force("collision", d3.forceCollide().radius(radius))
    .force("cluster", forceCluster(clusterStrength));
```

### Visual Element Updates

```typescript
function updateVisualElements(elapsed) {
    // Update positions
    nodes.attr("transform", (d) => `translate(${d.x},${d.y})`);

    // Update opacities based on timing
    links.style("opacity", elapsed > 200 ? fadeIn(elapsed - 200) : 0);
    labels.style("opacity", elapsed > 800 ? fadeIn(elapsed - 800) : 0);
    clusters.style("opacity", elapsed > 1500 ? fadeIn(elapsed - 1500) : 0);
}
```

### Window Resize Handling

```typescript
function updateDimensions() {
    const { width, height } = container.getBoundingClientRect();
    simulation
        .force("center", d3.forceCenter(width / 2, height / 2))
        .alpha(0.3)
        .restart();
}
```

This visualization system creates an organic, living representation of browsing history that's both beautiful and functional. The careful orchestration of forces and animations helps users understand the structure of their web navigation patterns while maintaining smooth performance.
