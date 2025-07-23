import type { NetworkNode, NetworkLink } from "../../../types/network.types";
import type {
    SimulationNode,
    SimulationLink,
    Position,
    TimelineConfig,
    SessionData,
    TimelineAxisConfig,
} from "./layout.types";

// Base component props that many components share
export interface BaseComponentProps {
    className?: string;
    style?: React.CSSProperties;
    testId?: string;
}

// Common graph state props
export interface GraphStateProps {
    isDarkMode: boolean;
    isStandalone: boolean;
    viewOrientation: "vertical" | "horizontal";
    dimensions: { width: number; height: number };
}

// Selection and highlighting state
export interface SelectionState {
    selectedNode: string | null;
    pathNodes: Set<string>;
    pathLinks: Set<string>;
    searchResults: Set<string>;
    pathOrder: Map<string, number>;
}

// Evolution mode state
export interface EvolutionState {
    isEvolutionMode: boolean;
    isPlaying: boolean;
    currentTimestamp: number;
    evolutionSpeed: number;
    visibleNodes: Set<string>;
    visibleLinks: Set<string>;
}

// Main GraphVisualization component props
export interface GraphVisualizationProps extends BaseComponentProps {
    timeRange?: { start: number; end: number };
    maxNodesPerRow?: number;
    totalNodes?: number;
    showControls?: boolean;
    orientation?: "vertical" | "horizontal";
    isStandalone?: boolean;
    searchTerm?: string;
    onSearchResults?: (count: number) => void;
}

// GraphCanvas props
export interface GraphCanvasProps extends BaseComponentProps, GraphStateProps {
    nodes: NetworkNode[];
    links: NetworkLink[];
    maxNodesPerRow: number;

    // State
    selectedNode: string | null;
    pathNodes: Set<string>;
    pathLinks: Set<string>;
    searchResults: Set<string>;
    pathOrder: Map<string, number>;
    isEvolutionMode: boolean;
    visibleNodes: Set<string>;
    visibleLinks: Set<string>;

    // Event handlers
    onNodeClick?: (nodeId: string) => void;
    onNodeDoubleClick?: (nodeId: string) => void;
    onNodeHover?: (event: MouseEvent, node: SimulationNode) => void;
    onNodeLeave?: () => void;
    onCanvasClick?: () => void;
}

// NetworkRenderer props
export interface NetworkRendererProps
    extends BaseComponentProps,
        GraphStateProps {
    svgGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
    nodes: SimulationNode[];
    links: SimulationLink[];

    // Selection & highlighting state
    selectedNode: string | null;
    pathNodes: Set<string>;
    pathLinks: Set<string>;
    searchResults: Set<string>;
    pathOrder: Map<string, number>;

    // Evolution mode state
    isEvolutionMode: boolean;
    visibleNodes: Set<string>;
    visibleLinks: Set<string>;

    // Event handlers
    onNodeClick?: (nodeId: string) => void;
    onNodeDoubleClick?: (nodeId: string) => void;
    onNodeHover?: (event: MouseEvent, node: SimulationNode) => void;
    onNodeLeave?: () => void;
    onNodeDrag?: (node: SimulationNode, x: number, y: number) => void;
}

// TimelineAxis props
export interface TimelineAxisProps extends BaseComponentProps, GraphStateProps {
    svgGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
    timelineConfig: TimelineConfig;
    sessions: SessionData[];
    axisConfig: TimelineAxisConfig;
    showSessionSeparators?: boolean;
}

// Control components props
export interface SearchPanelProps extends BaseComponentProps, GraphStateProps {
    searchTerm: string;
    searchResults: Set<string>;
    isSearchFocused: boolean;
    onSearchChange: (value: string) => void;
    onSearchFocus: (focused: boolean) => void;
    onSearchClear: () => void;
}

export interface EvolutionPlayerProps
    extends BaseComponentProps,
        GraphStateProps {
    isEvolutionMode: boolean;
    isPlaying: boolean;
    evolutionSpeed: number;
    currentTimestamp: number;
    visibleNodes: Set<string>;
    visibleLinks: Set<string>;
    onPlay: () => void;
    onPause: () => void;
    onReset: () => void;
    onSpeedChange: (speed: number) => void;
    onExit: () => void;
}

export interface ActionButtonsProps
    extends BaseComponentProps,
        GraphStateProps {
    isEvolutionMode: boolean;
    onToggleTheme: () => void;
    onToggleEvolution: () => void;
    onToggleOrientation: () => void;
    onExpand: () => void;
    onDelete: () => void;
}

export interface ViewControlsProps extends BaseComponentProps, GraphStateProps {
    viewOrientation: "vertical" | "horizontal";
    onOrientationChange: (orientation: "vertical" | "horizontal") => void;
}

export interface InfoDisplayProps extends BaseComponentProps, GraphStateProps {
    selectedNode: string | null;
    searchResults: Set<string>;
    pathNodes: Set<string>;
    pathLinks: Set<string>;
    searchTerm: string;
    isEvolutionMode: boolean;
    visibleNodes: Set<string>;
    visibleLinks: Set<string>;
    currentTimestamp: number;
    onClearPath: () => void;
}

// UI component props
export interface LoadingStateProps extends BaseComponentProps, GraphStateProps {
    message?: string;
}

export interface EmptyStateProps extends BaseComponentProps, GraphStateProps {
    hasTimeRangeButNoData: boolean;
    availableHourBrackets: Array<{
        label: string;
        start: number;
        end: number;
        count: number;
    }>;
    onTimeRangeSelect?: (start: number, end: number) => void;
}

export interface ErrorStateProps extends BaseComponentProps, GraphStateProps {
    error: string;
    onRetry: () => void;
}

export interface ModalProps extends BaseComponentProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: "sm" | "md" | "lg" | "xl";
    closeOnOverlayClick?: boolean;
    closeOnEscape?: boolean;
}

export interface DeleteConfirmationProps
    extends BaseComponentProps,
        GraphStateProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export interface TooltipProps extends BaseComponentProps, GraphStateProps {
    node: SimulationNode;
    position: Position;
    visible: boolean;
}

// Generic event handler types for components
export interface GraphEventHandlers {
    onNodeClick?: (nodeId: string) => void;
    onNodeDoubleClick?: (nodeId: string) => void;
    onNodeHover?: (event: MouseEvent, node: SimulationNode) => void;
    onNodeLeave?: () => void;
    onCanvasClick?: () => void;
    onSearch?: (searchTerm: string) => void;
    onPathTrace?: (nodeId: string) => void;
    onPathClear?: () => void;
}
