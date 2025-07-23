import { useRef, useCallback, useEffect } from "react";
import type { SimulationNode } from "../types/layout.types";
import { getTooltipTitle, getTooltipSubtitle } from "../utils/urlFormatting";
import { formatTime } from "../utils/timeFormatting";
import { TOOLTIP_CONSTANTS } from "../utils/constants";

interface UseTooltipReturn {
    showTooltip: (event: MouseEvent, node: SimulationNode) => void;
    hideTooltip: () => void;
    moveTooltip: (event: MouseEvent) => void;
}

/**
 * Hook for managing tooltip functionality
 * Extracted from your original tooltip logic
 */
export const useTooltip = (isDarkMode: boolean): UseTooltipReturn => {
    const tooltipRef = useRef<HTMLDivElement | null>(null);

    // Create tooltip element on mount
    useEffect(() => {
        if (!tooltipRef.current) {
            const tooltip = document.createElement("div");
            tooltip.style.display = "none";
            tooltip.style.position = "fixed";
            tooltip.style.zIndex = "10000";
            tooltip.style.pointerEvents = "none";
            tooltip.style.maxWidth = `${TOOLTIP_CONSTANTS.MAX_WIDTH}px`;
            document.body.appendChild(tooltip);
            tooltipRef.current = tooltip;
        }

        return () => {
            if (tooltipRef.current) {
                document.body.removeChild(tooltipRef.current);
                tooltipRef.current = null;
            }
        };
    }, []);

    const showTooltip = useCallback(
        (event: MouseEvent, node: SimulationNode) => {
            if (!tooltipRef.current) return;

            const tooltip = tooltipRef.current;
            const timeSpent = node.activeTime
                ? formatTime(node.activeTime)
                : "0s";

            // Format created date
            const createdDate = node.timestamp || node.visitTimestamp;
            const formattedTime = createdDate
                ? new Date(createdDate).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                  })
                : "Unknown";

            const titleDisplay = getTooltipTitle(node);
            const subtitleDisplay = getTooltipSubtitle(node);

            // Generate random metrics (as in original code)
            const pageRank = (Math.random() * 0.3).toFixed(3);
            const betweenness = (Math.random() * 0.4).toFixed(3);
            const degree = Math.floor(Math.random() * 5) + 1;
            const closeness = (Math.random() * 0.6).toFixed(3);

            tooltip.innerHTML = `
            <div style="font-weight: 600; color: ${
                isDarkMode
                    ? "rgba(243, 244, 246, 0.9)"
                    : "rgba(120, 53, 15, 0.9)"
            }; margin-bottom: 4px;">${titleDisplay}</div>
            ${
                subtitleDisplay
                    ? `<div style="font-size: 12px; color: ${
                          isDarkMode
                              ? "rgba(156, 163, 175, 0.8)"
                              : "rgba(184, 134, 11, 0.8)"
                      }; margin-bottom: 4px;">${subtitleDisplay}</div>`
                    : ""
            }
            <div style="font-size: 12px; color: ${
                isDarkMode
                    ? "rgba(156, 163, 175, 0.7)"
                    : "rgba(184, 134, 11, 0.7)"
            }; margin-bottom: 4px;">Time: ${formattedTime}</div>
            <div style="font-size: 12px; color: ${
                isDarkMode
                    ? "rgba(156, 163, 175, 0.7)"
                    : "rgba(184, 134, 11, 0.7)"
            }; margin-bottom: 8px;">Time spent: ${timeSpent}</div>
            <div style="border-top: 1px solid ${
                isDarkMode ? "rgba(75, 85, 99, 0.5)" : "rgba(255, 183, 77, 0.2)"
            }; padding-top: 8px; font-size: 11px; color: ${
                isDarkMode
                    ? "rgba(156, 163, 175, 0.6)"
                    : "rgba(184, 134, 11, 0.6)"
            };">
                <div>PageRank: ${(parseFloat(pageRank) * 100).toFixed(1)}%</div>
                <div>Betweenness: ${(parseFloat(betweenness) * 100).toFixed(
                    1,
                )}%</div>
                <div>Degree: ${degree}</div>
                <div>Closeness: ${(parseFloat(closeness) * 100).toFixed(
                    1,
                )}%</div>
            </div>
        `;

            // Apply tooltip styling
            tooltip.style.background = isDarkMode
                ? "rgba(31, 41, 55, 0.95)"
                : "rgba(255, 251, 235, 0.95)";
            tooltip.style.backdropFilter = "blur(20px)";
            tooltip.style.border = isDarkMode
                ? "1px solid rgba(75, 85, 99, 0.5)"
                : "1px solid rgba(255, 183, 77, 0.3)";
            tooltip.style.borderRadius = "12px";
            tooltip.style.padding = "12px";
            tooltip.style.boxShadow = isDarkMode
                ? "0 10px 25px rgba(0, 0, 0, 0.3)"
                : "0 10px 25px rgba(0, 0, 0, 0.1)";
            tooltip.style.fontFamily =
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
            tooltip.style.fontSize = "13px";
            tooltip.style.lineHeight = "1.4";

            // Position tooltip
            let left = event.clientX + TOOLTIP_CONSTANTS.OFFSET.X;
            let top = event.clientY + TOOLTIP_CONSTANTS.OFFSET.Y;

            // Show tooltip to measure its size
            tooltip.style.display = "block";
            tooltip.style.opacity = "0";

            const tooltipRect = tooltip.getBoundingClientRect();

            // Adjust position if tooltip would go off screen
            if (left + tooltipRect.width > window.innerWidth) {
                left =
                    event.clientX -
                    tooltipRect.width -
                    TOOLTIP_CONSTANTS.OFFSET.X;
            }
            if (top + tooltipRect.height > window.innerHeight) {
                top =
                    event.clientY -
                    tooltipRect.height -
                    TOOLTIP_CONSTANTS.OFFSET.Y;
            }

            tooltip.style.left = `${left}px`;
            tooltip.style.top = `${top}px`;
            tooltip.style.opacity = "1";
            tooltip.style.transition = "opacity 0.2s ease";
        },
        [isDarkMode],
    );

    const hideTooltip = useCallback(() => {
        if (tooltipRef.current) {
            tooltipRef.current.style.opacity = "0";
            setTimeout(() => {
                if (tooltipRef.current) {
                    tooltipRef.current.style.display = "none";
                }
            }, 200);
        }
    }, []);

    const moveTooltip = useCallback((event: MouseEvent) => {
        if (
            tooltipRef.current &&
            tooltipRef.current.style.display === "block"
        ) {
            let left = event.clientX + TOOLTIP_CONSTANTS.OFFSET.X;
            let top = event.clientY + TOOLTIP_CONSTANTS.OFFSET.Y;

            const tooltipRect = tooltipRef.current.getBoundingClientRect();

            if (left + tooltipRect.width > window.innerWidth) {
                left =
                    event.clientX -
                    tooltipRect.width -
                    TOOLTIP_CONSTANTS.OFFSET.X;
            }
            if (top + tooltipRect.height > window.innerHeight) {
                top =
                    event.clientY -
                    tooltipRect.height -
                    TOOLTIP_CONSTANTS.OFFSET.Y;
            }

            tooltipRef.current.style.left = `${left}px`;
            tooltipRef.current.style.top = `${top}px`;
        }
    }, []);

    return {
        showTooltip,
        hideTooltip,
        moveTooltip,
    };
};
