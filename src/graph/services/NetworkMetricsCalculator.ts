// NetworkMetricsCalculator.ts - Network metrics calculation service
import type { NetworkNode } from "../types/network.types";
interface NetworkMetrics {
    pageRank: number;
    betweenness: number;
    degree: number;
    closeness: number;
}

interface NetworkNodeWithId extends NetworkNode {
    id: string;
}

interface NetworkLinkWithIds {
    source: string | NetworkNodeWithId;
    target: string | NetworkNodeWithId;
    tabId: number;
    frequency: number;
}

export class NetworkMetricsCalculator {
    private nodes: NetworkNodeWithId[];
    private links: NetworkLinkWithIds[];
    private adjacencyMatrix: Map<string, Set<string>>;
    private metrics: Map<string, NetworkMetrics>;

    constructor(nodes: NetworkNodeWithId[], links: NetworkLinkWithIds[]) {
        this.nodes = nodes;
        this.links = links;
        this.adjacencyMatrix = new Map();
        this.metrics = new Map();
        this.buildAdjacencyMatrix();
        this.calculateAllMetrics();
    }

    private buildAdjacencyMatrix(): void {
        // Initialize empty sets for each node
        this.nodes.forEach((node) => {
            this.adjacencyMatrix.set(node.id, new Set());
        });

        // Add connections
        this.links.forEach((link) => {
            const sourceId =
                typeof link.source === "string" ? link.source : link.source.id;
            const targetId =
                typeof link.target === "string" ? link.target : link.target.id;

            // Add both directions since we treat the graph as undirected for metrics
            this.adjacencyMatrix.get(sourceId)?.add(targetId);
            this.adjacencyMatrix.get(targetId)?.add(sourceId);
        });
    }

    private calculatePageRank(
        dampingFactor: number = 0.85,
        iterations: number = 20,
    ): void {
        const n = this.nodes.length;
        let pageRanks = new Map<string, number>();

        // Initialize PageRank scores
        this.nodes.forEach((node) => {
            pageRanks.set(node.id, 1 / n);
        });

        // Iterate to converge
        for (let i = 0; i < iterations; i++) {
            const newPageRanks = new Map<string, number>();

            this.nodes.forEach((node) => {
                let sum = 0;
                // Get nodes that point to current node
                this.nodes.forEach((otherNode) => {
                    if (this.adjacencyMatrix.get(otherNode.id)?.has(node.id)) {
                        const outDegree =
                            this.adjacencyMatrix.get(otherNode.id)?.size || 0;
                        sum += (pageRanks.get(otherNode.id) || 0) / outDegree;
                    }
                });

                const newPR = (1 - dampingFactor) / n + dampingFactor * sum;
                newPageRanks.set(node.id, newPR);
            });

            pageRanks = newPageRanks;
        }

        // Store PageRank scores
        this.nodes.forEach((node) => {
            const metrics = this.metrics.get(node.id) || {
                pageRank: 0,
                betweenness: 0,
                degree: 0,
                closeness: 0,
            };
            metrics.pageRank = pageRanks.get(node.id) || 0;
            this.metrics.set(node.id, metrics);
        });
    }

    private calculateBetweenness(): void {
        const betweenness = new Map<string, number>();
        this.nodes.forEach((node) => betweenness.set(node.id, 0));

        // For each pair of nodes
        for (let s of this.nodes) {
            // Run BFS from node s
            const queue: string[] = [s.id];
            const dist = new Map<string, number>();
            const paths = new Map<string, string[][]>();
            const visited = new Set<string>();

            dist.set(s.id, 0);
            paths.set(s.id, [[s.id]]);

            while (queue.length > 0) {
                const v = queue.shift()!;
                visited.add(v);

                // For each neighbor of v
                this.adjacencyMatrix.get(v)?.forEach((w) => {
                    // Path discovery
                    if (!dist.has(w)) {
                        dist.set(w, (dist.get(v) || 0) + 1);
                        queue.push(w);
                    }

                    // Path counting
                    if ((dist.get(w) || 0) === (dist.get(v) || 0) + 1) {
                        const wPaths = paths.get(w) || [];
                        const vPaths = paths.get(v) || [];
                        vPaths.forEach((vPath) => {
                            wPaths.push([...vPath, w]);
                        });
                        paths.set(w, wPaths);
                    }
                });
            }

            // Calculate betweenness contribution
            this.nodes.forEach((t) => {
                if (t.id !== s.id) {
                    const tPaths = paths.get(t.id) || [];
                    tPaths.forEach((path) => {
                        path.slice(1, -1).forEach((v) => {
                            betweenness.set(
                                v,
                                (betweenness.get(v) || 0) + 1 / tPaths.length,
                            );
                        });
                    });
                }
            });
        }

        // Store betweenness scores
        this.nodes.forEach((node) => {
            const metrics = this.metrics.get(node.id) || {
                pageRank: 0,
                betweenness: 0,
                degree: 0,
                closeness: 0,
            };
            metrics.betweenness = betweenness.get(node.id) || 0;
            this.metrics.set(node.id, metrics);
        });
    }

    private calculateDegree(): void {
        this.nodes.forEach((node) => {
            const degree = this.adjacencyMatrix.get(node.id)?.size || 0;
            const metrics = this.metrics.get(node.id) || {
                pageRank: 0,
                betweenness: 0,
                degree: 0,
                closeness: 0,
            };
            metrics.degree = degree;
            this.metrics.set(node.id, metrics);
        });
    }

    private calculateCloseness(): void {
        this.nodes.forEach((node) => {
            const distances = new Map<string, number>();
            const queue: [string, number][] = [[node.id, 0]];
            const visited = new Set<string>([node.id]);

            while (queue.length > 0) {
                const [current, distance] = queue.shift()!;
                distances.set(current, distance);

                this.adjacencyMatrix.get(current)?.forEach((neighbor) => {
                    if (!visited.has(neighbor)) {
                        visited.add(neighbor);
                        queue.push([neighbor, distance + 1]);
                    }
                });
            }

            let totalDistance = 0;
            distances.forEach((distance) => {
                totalDistance += distance;
            });

            const closeness =
                distances.size > 1 ? (distances.size - 1) / totalDistance : 0;
            const metrics = this.metrics.get(node.id) || {
                pageRank: 0,
                betweenness: 0,
                degree: 0,
                closeness: 0,
            };
            metrics.closeness = closeness;
            this.metrics.set(node.id, metrics);
        });
    }

    private calculateAllMetrics(): void {
        this.calculatePageRank();
        this.calculateBetweenness();
        this.calculateDegree();
        this.calculateCloseness();
    }

    public getMetrics(nodeId: string): NetworkMetrics {
        return (
            this.metrics.get(nodeId) || {
                pageRank: 0,
                betweenness: 0,
                degree: 0,
                closeness: 0,
            }
        );
    }

    public getAllMetrics(): Map<string, NetworkMetrics> {
        return this.metrics;
    }
}
