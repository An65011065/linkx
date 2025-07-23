import type { LayoutConfig, InteractionConfig } from "../types/layout.types";

// Layout constants - extracted from your original code
export const LAYOUT_CONSTANTS = {
    // Margins and spacing
    MARGINS: {
        LEFT: 100,
        RIGHT: 100,
        TOP: 100,
        BOTTOM: 100,
    },

    // Node and session spacing - improved to prevent overlapping
    SESSION_SPACING: 150, // Increased from 120
    NODE_SPACING: 80, // Increased from 60

    // Node visual properties
    NODE_RADIUS: 16,
    NODE_ICON_SIZE: 32,
    NODE_SELECTION_RING_RADIUS: 20,
    NODE_INTERACTION_AREA: 40,

    // Link properties
    LINK_SPACING: 8,
    LINK_STROKE_WIDTH: 2,
    ARROW_SIZE: {
        WIDTH: 4,
        HEIGHT: 4,
        REF_X: 5,
        REF_Y: 0,
    },

    // Session grouping
    SESSION_GAP_THRESHOLD: 60 * 60 * 1000, // 1 hour in milliseconds

    // Timeline
    TIMELINE_AXIS_OFFSET: 60,
    TIMELINE_TICK_SIZE: 10,
    TIMELINE_LABEL_OFFSET: 15,

    // Layout grid for horizontal positioning
    TIME_SLOT_WIDTH: 40,
    ROW_HEIGHT: 100,
    MAX_COLLISION_SEARCH_DISTANCE: 200,
    POSITION_GRID_SIZE: 20, // for collision detection
} as const;

// Default layout configuration
export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
    orientation: "vertical",
    maxNodesPerRow: 6,
    sessionSpacing: LAYOUT_CONSTANTS.SESSION_SPACING,
    nodeSpacing: LAYOUT_CONSTANTS.NODE_SPACING,
    sessionGapThreshold: LAYOUT_CONSTANTS.SESSION_GAP_THRESHOLD,
    margins: {
        top: LAYOUT_CONSTANTS.MARGINS.TOP,
        right: LAYOUT_CONSTANTS.MARGINS.RIGHT,
        bottom: LAYOUT_CONSTANTS.MARGINS.BOTTOM,
        left: LAYOUT_CONSTANTS.MARGINS.LEFT,
    },
};

// Zoom and pan constants
export const ZOOM_CONSTANTS = {
    MIN_SCALE: 0.1,
    MAX_SCALE: 10,
    DEFAULT_SCALE: 0.7,
    STANDALONE_SCALE: 0.8,
    INITIAL_TRANSLATE_X: 100,
    INITIAL_TRANSLATE_Y: 0,
    STANDALONE_TRANSLATE_X: 50,
    STANDALONE_TRANSLATE_Y: 120,
    ZOOM_SENSITIVITY: 1,
    PAN_SENSITIVITY: 1,
} as const;

// Evolution mode constants
export const EVOLUTION_CONSTANTS = {
    SPEEDS: [0.5, 1, 2, 4] as const,
    DEFAULT_SPEED: 1,
    STEP_INTERVAL: 1000, // milliseconds between steps
} as const;

// Search constants
export const SEARCH_CONSTANTS = {
    MIN_SEARCH_LENGTH: 1,
    DEBOUNCE_DELAY: 300, // milliseconds
    MAX_RESULTS_DISPLAY: 100,
    HIGHLIGHT_OPACITY: {
        MATCHED: 1,
        UNMATCHED: 0.15,
    },
} as const;

// Tooltip constants
export const TOOLTIP_CONSTANTS = {
    OFFSET: {
        X: 10,
        Y: 10,
    },
    SHOW_DELAY: 500, // milliseconds
    HIDE_DELAY: 200,
    MAX_WIDTH: 320, // pixels
    Z_INDEX: 10000,
} as const;

// URL and content formatting constants
export const URL_CONSTANTS = {
    NEW_TAB_URLS: [
        "chrome://newtab",
        "about:newtab",
        "edge://newtab",
        "moz-extension://",
    ] as const,

    GOOGLE_SEARCH_PATHS: ["/search"] as const,
    GOOGLE_DOMAINS: ["google.com", "google.co.uk", "google.ca"] as const,

    TITLE_MAX_LENGTH: 30,
    URL_SEGMENT_MAX_LENGTH: 25,
    SEARCH_QUERY_MAX_LENGTH: 30,

    // File extensions to remove from URL segments
    REMOVE_EXTENSIONS: [
        ".html",
        ".htm",
        ".php",
        ".asp",
        ".jsp",
        ".aspx",
        ".cfm",
        ".cgi",
        ".pl",
        ".py",
    ] as const,

    FAVICON_SERVICE: "https://www.google.com/s2/favicons",
    FAVICON_SIZE: 64,
} as const;

// Time formatting constants
export const TIME_CONSTANTS = {
    MILLISECONDS_PER_SECOND: 1000,
    MILLISECONDS_PER_MINUTE: 60 * 1000,
    MILLISECONDS_PER_HOUR: 60 * 60 * 1000,
    MILLISECONDS_PER_DAY: 24 * 60 * 60 * 1000,

    // Timeline marker intervals
    MARKER_INTERVALS: {
        FIFTEEN_MINUTES: 15 * 60 * 1000,
        THIRTY_MINUTES: 30 * 60 * 1000,
        ONE_HOUR: 60 * 60 * 1000,
        TWO_HOURS: 2 * 60 * 60 * 1000,
    },

    // Timeline display thresholds
    DISPLAY_THRESHOLDS: {
        TWO_HOURS: 2 * 60 * 60 * 1000,
        SIX_HOURS: 6 * 60 * 60 * 1000,
        TWELVE_HOURS: 12 * 60 * 60 * 1000,
        ONE_DAY: 24 * 60 * 60 * 1000,
    },

    MAX_TIMELINE_MARKERS: 12,
} as const;

// Interaction configuration
export const DEFAULT_INTERACTION_CONFIG: InteractionConfig = {
    enableNodeDragging: true,
    enableZoomPan: true,
    enableSelection: true,
    enableTooltips: true,
    enableKeyboardShortcuts: true,
    enableDoubleClickZoom: false, // Disabled in original code
    enableWheelZoom: true,
    enableTouchGestures: true,
    dragThreshold: 5, // pixels
    clickThreshold: 200, // milliseconds
    doubleClickThreshold: 300, // milliseconds
    tooltipDelay: TOOLTIP_CONSTANTS.SHOW_DELAY,
    zoomSensitivity: ZOOM_CONSTANTS.ZOOM_SENSITIVITY,
    panSensitivity: ZOOM_CONSTANTS.PAN_SENSITIVITY,
};

// CSS class name constants
export const CSS_CLASSES = {
    // Main groups
    MAIN_GROUP: "main-group",
    LINKS_GROUP: "links",
    NODES_GROUP: "nodes",
    TIMELINE_GROUP: "timeline-indicators",

    // Node classes
    NODE_GROUP: "node-group",
    SEQUENCE_NUMBER: "sequence-number",

    // State classes
    SELECTED: "selected",
    HIGHLIGHTED: "highlighted",
    ACTIVE: "active",
    INACTIVE: "inactive",
    DRAGGING: "dragging",

    // Interaction classes
    CLICKABLE: "clickable",
    DRAGGABLE: "draggable",
    HOVERABLE: "hoverable",
} as const;

// Error messages
export const ERROR_MESSAGES = {
    INVALID_NODE_DATA: "Invalid node data provided",
    INVALID_LINK_DATA: "Invalid link data provided",
    LAYOUT_CALCULATION_FAILED: "Failed to calculate layout positions",
    DIMENSION_CALCULATION_FAILED: "Failed to calculate component dimensions",
    ZOOM_OPERATION_FAILED: "Zoom operation failed",
    SEARCH_OPERATION_FAILED: "Search operation failed",
    PATH_TRACE_FAILED: "Path tracing operation failed",
    DATA_DELETION_FAILED: "Failed to delete browsing data",
    TIMELINE_RENDERING_FAILED: "Timeline rendering failed",
} as const;

// Performance constants
export const PERFORMANCE_CONSTANTS = {
    MAX_NODES_FOR_ANIMATION: 100,
    MAX_LINKS_FOR_ANIMATION: 200,
    RENDER_BATCH_SIZE: 50,
    DEBOUNCE_RESIZE: 100, // milliseconds
    DEBOUNCE_SEARCH: 300, // milliseconds
    RAF_THROTTLE: 16, // ~60fps
} as const;

// Browser compatibility constants
export const BROWSER_CONSTANTS = {
    SUPPORTED_STORAGE_TYPES: ["chrome.storage.local"] as const,
    FALLBACK_STORAGE_KEY: "graph-visualization-data",
    SUPPORTED_IMAGE_FORMATS: [
        "png",
        "jpg",
        "jpeg",
        "gif",
        "svg",
        "webp",
    ] as const,
} as const;
