import type { SimulationNode, SimulationLink, Position } from "./layout.types";

// Mouse and pointer event types
export interface GraphMouseEvent extends MouseEvent {
    node?: SimulationNode;
    link?: SimulationLink;
    position?: Position;
}

export interface GraphPointerEvent extends PointerEvent {
    node?: SimulationNode;
    link?: SimulationLink;
    position?: Position;
}

// Drag event types
export interface DragState {
    isDragging: boolean;
    draggedNode: SimulationNode | null;
    startPosition: Position;
    currentPosition: Position;
    deltaX: number;
    deltaY: number;
}

export interface DragEventHandlers {
    onDragStart?: (event: GraphMouseEvent, node: SimulationNode) => void;
    onDragMove?: (
        event: GraphMouseEvent,
        node: SimulationNode,
        delta: Position,
    ) => void;
    onDragEnd?: (event: GraphMouseEvent, node: SimulationNode) => void;
}

// Zoom and pan event types
export interface ZoomState {
    scale: number;
    translateX: number;
    translateY: number;
    minScale: number;
    maxScale: number;
    isZooming: boolean;
    isPanning: boolean;
}

export interface ZoomEventHandlers {
    onZoomStart?: (state: ZoomState) => void;
    onZoom?: (state: ZoomState) => void;
    onZoomEnd?: (state: ZoomState) => void;
    onPanStart?: (state: ZoomState) => void;
    onPan?: (state: ZoomState) => void;
    onPanEnd?: (state: ZoomState) => void;
}

// Node interaction event types
export interface NodeInteractionEvents {
    onNodeClick?: (nodeId: string, event: GraphMouseEvent) => void;
    onNodeDoubleClick?: (nodeId: string, event: GraphMouseEvent) => void;
    onNodeRightClick?: (nodeId: string, event: GraphMouseEvent) => void;
    onNodeMouseEnter?: (nodeId: string, event: GraphMouseEvent) => void;
    onNodeMouseLeave?: (nodeId: string, event: GraphMouseEvent) => void;
    onNodeMouseMove?: (nodeId: string, event: GraphMouseEvent) => void;
    onNodeFocus?: (nodeId: string) => void;
    onNodeBlur?: (nodeId: string) => void;
}

// Link interaction event types
export interface LinkInteractionEvents {
    onLinkClick?: (linkId: string, event: GraphMouseEvent) => void;
    onLinkDoubleClick?: (linkId: string, event: GraphMouseEvent) => void;
    onLinkMouseEnter?: (linkId: string, event: GraphMouseEvent) => void;
    onLinkMouseLeave?: (linkId: string, event: GraphMouseEvent) => void;
    onLinkMouseMove?: (linkId: string, event: GraphMouseEvent) => void;
}

// Canvas interaction event types
export interface CanvasInteractionEvents {
    onCanvasClick?: (event: GraphMouseEvent) => void;
    onCanvasDoubleClick?: (event: GraphMouseEvent) => void;
    onCanvasRightClick?: (event: GraphMouseEvent) => void;
    onCanvasMouseMove?: (event: GraphMouseEvent) => void;
}

// Keyboard interaction types
export interface KeyboardState {
    pressedKeys: Set<string>;
    shiftPressed: boolean;
    ctrlPressed: boolean;
    altPressed: boolean;
    metaPressed: boolean;
}

export interface KeyboardEventHandlers {
    onKeyDown?: (event: KeyboardEvent, state: KeyboardState) => void;
    onKeyUp?: (event: KeyboardEvent, state: KeyboardState) => void;
    onKeyPress?: (event: KeyboardEvent, state: KeyboardState) => void;
}

// Selection interaction types
export interface SelectionInteractionEvents {
    onSelectionStart?: (startPosition: Position) => void;
    onSelectionMove?: (currentPosition: Position, bounds: DOMRect) => void;
    onSelectionEnd?: (selectedNodes: string[], selectedLinks: string[]) => void;
    onSelectionClear?: () => void;
}

// Tooltip interaction types
export interface TooltipInteractionEvents {
    onTooltipShow?: (
        nodeId: string,
        position: Position,
        node: SimulationNode,
    ) => void;
    onTooltipHide?: () => void;
    onTooltipMove?: (position: Position) => void;
}

// Search interaction types
export interface SearchInteractionEvents {
    onSearchStart?: (searchTerm: string) => void;
    onSearchUpdate?: (searchTerm: string, results: string[]) => void;
    onSearchComplete?: (searchTerm: string, results: string[]) => void;
    onSearchClear?: () => void;
    onSearchResultClick?: (nodeId: string, searchTerm: string) => void;
}

// Path tracing interaction types
export interface PathTracingEvents {
    onPathTraceStart?: (targetNodeId: string) => void;
    onPathTraceUpdate?: (pathNodes: string[], pathLinks: string[]) => void;
    onPathTraceComplete?: (
        pathNodes: string[],
        pathLinks: string[],
        pathOrder: Map<string, number>,
    ) => void;
    onPathTraceClear?: () => void;
}

// Evolution mode interaction types
export interface EvolutionInteractionEvents {
    onEvolutionStart?: () => void;
    onEvolutionPlay?: () => void;
    onEvolutionPause?: () => void;
    onEvolutionStop?: () => void;
    onEvolutionReset?: () => void;
    onEvolutionSpeedChange?: (speed: number) => void;
    onEvolutionTimeUpdate?: (
        timestamp: number,
        visibleNodes: string[],
        visibleLinks: string[],
    ) => void;
}

// Combined interaction events interface
export interface GraphInteractionEvents
    extends NodeInteractionEvents,
        LinkInteractionEvents,
        CanvasInteractionEvents,
        SelectionInteractionEvents,
        TooltipInteractionEvents,
        SearchInteractionEvents,
        PathTracingEvents,
        EvolutionInteractionEvents {}

// Interaction configuration
export interface InteractionConfig {
    enableNodeDragging: boolean;
    enableZoomPan: boolean;
    enableSelection: boolean;
    enableTooltips: boolean;
    enableKeyboardShortcuts: boolean;
    enableDoubleClickZoom: boolean;
    enableWheelZoom: boolean;
    enableTouchGestures: boolean;
    dragThreshold: number; // pixels
    clickThreshold: number; // milliseconds
    doubleClickThreshold: number; // milliseconds
    tooltipDelay: number; // milliseconds
    zoomSensitivity: number;
    panSensitivity: number;
}

// Interaction state management
export interface InteractionState {
    dragState: DragState;
    zoomState: ZoomState;
    keyboardState: KeyboardState;
    isInteracting: boolean;
    lastInteractionTime: number;
    hoveredNode: string | null;
    hoveredLink: string | null;
    focusedNode: string | null;
}

// Gesture recognition types
export interface GestureState {
    isTouching: boolean;
    touchCount: number;
    initialDistance: number;
    currentDistance: number;
    initialAngle: number;
    currentAngle: number;
    pinchScale: number;
    rotationAngle: number;
}

export interface GestureEventHandlers {
    onPinchStart?: (state: GestureState) => void;
    onPinchMove?: (state: GestureState) => void;
    onPinchEnd?: (state: GestureState) => void;
    onRotateStart?: (state: GestureState) => void;
    onRotateMove?: (state: GestureState) => void;
    onRotateEnd?: (state: GestureState) => void;
}
