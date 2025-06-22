// ClusterVisualization.tsx - Cluster visualization component

import * as d3 from "d3";
import type { SimNetworkNode } from "./GraphVisualization";
import "../styles/components.css";

interface ClusterVisualizationOptions {
    container: d3.Selection<SVGGElement, unknown, null, undefined>;
    nodes: SimNetworkNode[];
    width: number;
    height: number;
}

interface Cluster {
    tabId: number;
    nodes: SimNetworkNode[];
    totalTime: number;
    hull: [number, number][];
    isActive: boolean;
}

const HULL_PADDING = 25; // 25 pixels outward expansion
const LABEL_OFFSET = 30; // 30 pixels above cluster center

class ClusterVisualization {
    private container: d3.Selection<SVGGElement, unknown, null, undefined>;
    private nodes: SimNetworkNode[];
    private width: number;
    private height: number;
    private clusters: Cluster[] = [];

    constructor(options: ClusterVisualizationOptions) {
        this.container = options.container;
        this.nodes = options.nodes;
        this.width = options.width;
        this.height = options.height;
        this.initialize();
    }

    private initialize() {
        // Group nodes by tabId
        const clusters = d3.group(this.nodes, (d) => d.tabId);

        // Create cluster data
        this.clusters = Array.from(clusters)
            .map(([tabId, nodes]) => {
                const totalTime = nodes.reduce(
                    (sum, node) => sum + node.timeSpent,
                    0,
                );
                const isActive = nodes.some((node) => node.isActive);
                return {
                    tabId,
                    nodes,
                    totalTime,
                    hull: this.calculateHull(nodes),
                    isActive,
                };
            })
            .filter((cluster) => cluster.nodes.length >= 3); // Only show clusters with 3+ nodes

        // Clear previous clusters
        this.container.selectAll(".cluster-group").remove();

        // Create cluster groups
        const clusterGroups = this.container
            .selectAll(".cluster-group")
            .data(this.clusters)
            .join("g")
            .attr("class", "cluster-group");

        // Add cluster hulls
        clusterGroups.each((cluster, i, groups) => {
            const group = d3.select(groups[i]);

            // Create hull path with expanded boundary
            const hullPath = group
                .append("path")
                .attr("class", "cluster-hull")
                .attr("d", `M${cluster.hull.join("L")}Z`)
                .style(
                    "fill",
                    cluster.isActive
                        ? "rgba(0, 123, 255, 0.05)"
                        : "rgba(128, 128, 128, 0.03)",
                )
                .style(
                    "stroke",
                    cluster.isActive
                        ? "rgba(0, 123, 255, 0.3)"
                        : "rgba(128, 128, 128, 0.2)",
                )
                .style("stroke-width", cluster.isActive ? 1.5 : 1)
                .style("stroke-dasharray", "3,2");

            // Add time label
            const centroid = d3.polygonCentroid(cluster.hull);
            const timeLabel = this.formatTime(cluster.totalTime);

            // Add background rectangle
            const labelGroup = group
                .append("g")
                .attr("class", "cluster-time-label")
                .attr(
                    "transform",
                    `translate(${centroid[0]},${centroid[1] - LABEL_OFFSET})`,
                );

            // Add yellow highlight background
            labelGroup
                .append("rect")
                .attr("x", -25)
                .attr("y", -8)
                .attr("width", 50)
                .attr("height", 16)
                .attr("rx", 3)
                .attr("ry", 3)
                .style("fill", "rgba(255, 255, 0, 0.6)")
                .style("stroke", "none");

            // Add time text
            labelGroup
                .append("text")
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .style("font-size", "12px")
                .style("font-weight", "bold")
                .style("fill", "#2d3436")
                .text(timeLabel);
        });
    }

    private calculateHull(nodes: SimNetworkNode[]): [number, number][] {
        if (nodes.length < 3) return [];

        // Get node positions
        const points = nodes.map(
            (d) => [d.x || 0, d.y || 0] as [number, number],
        );

        // Calculate the convex hull
        const hull = d3.polygonHull(points);
        if (!hull) return [];

        // Expand the hull outward
        return this.expandHull(hull, HULL_PADDING);
    }

    private expandHull(
        hull: [number, number][],
        padding: number,
    ): [number, number][] {
        const centroid = d3.polygonCentroid(hull);
        return hull.map((point) => {
            const dx = point[0] - centroid[0];
            const dy = point[1] - centroid[1];
            const distance = Math.sqrt(dx * dx + dy * dy);
            const scale = (distance + padding) / distance;
            return [centroid[0] + dx * scale, centroid[1] + dy * scale];
        });
    }

    private formatTime(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        if (minutes < 1) return `${seconds}s`;
        return `${minutes}m`;
    }

    public update() {
        // Update cluster hulls and labels when nodes move
        this.clusters = this.clusters.map((cluster) => ({
            ...cluster,
            hull: this.calculateHull(cluster.nodes),
        }));

        this.container.selectAll(".cluster-group").each((d, i, groups) => {
            const group = d3.select(groups[i]);
            const cluster = this.clusters[i];

            // Update hull path
            group
                .select(".cluster-hull")
                .attr("d", `M${cluster.hull.join("L")}Z`);

            // Update time label position
            const centroid = d3.polygonCentroid(cluster.hull);
            group
                .select(".cluster-time-label")
                .attr(
                    "transform",
                    `translate(${centroid[0]},${centroid[1] - LABEL_OFFSET})`,
                );
        });
    }
}

export default ClusterVisualization;
