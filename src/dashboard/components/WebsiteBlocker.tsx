import React, { useState, useEffect } from "react";
import { websiteBlocker } from "../../data/websiteBlocker";
import type { BlockedSite } from "../../shared/types/common.types";

const WebsiteBlocker: React.FC = () => {
    const [domain, setDomain] = useState("");
    const [hours, setHours] = useState(1);
    const [blockedSites, setBlockedSites] = useState<BlockedSite[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        loadBlockedSites();
        // Refresh list every minute to update remaining time
        const interval = setInterval(loadBlockedSites, 60000);
        return () => clearInterval(interval);
    }, []);

    const loadBlockedSites = async () => {
        try {
            const sites = await websiteBlocker.getBlockedSites();
            setBlockedSites(sites);
        } catch (err) {
            console.error("Error loading blocked sites:", err);
        }
    };

    const handleBlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            // Basic domain validation
            if (!domain.includes(".")) {
                setError("Please enter a valid domain (e.g., facebook.com)");
                return;
            }

            // Remove any protocol or path
            const cleanDomain = domain
                .replace(/^(https?:\/\/)?(www\.)?/, "")
                .split("/")[0];

            await websiteBlocker.blockWebsite(cleanDomain, hours);
            await loadBlockedSites();
            setSuccess(`Successfully blocked ${cleanDomain}`);
            setDomain("");
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to block website",
            );
        }
    };

    const handleUnblock = async (domain: string) => {
        try {
            await websiteBlocker.unblockWebsite(domain);
            await loadBlockedSites();
            setSuccess(`Successfully unblocked ${domain}`);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to unblock website",
            );
        }
    };

    const getRemainingTime = (endTime: number): string => {
        const remaining = endTime - Date.now();
        if (remaining <= 0) return "Expired";

        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor(
            (remaining % (1000 * 60 * 60)) / (1000 * 60),
        );

        return `${hours}h ${minutes}m`;
    };

    return (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Website Blocker</h2>

            {/* Block Form */}
            <form onSubmit={handleBlock} className="mb-6">
                <div className="flex gap-4 mb-4">
                    <div className="flex-grow">
                        <input
                            type="text"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            placeholder="Enter domain (e.g., facebook.com)"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="w-32">
                        <input
                            type="number"
                            value={hours}
                            onChange={(e) =>
                                setHours(
                                    Math.max(1, parseInt(e.target.value) || 1),
                                )
                            }
                            min="1"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Block
                    </button>
                </div>
            </form>

            {/* Error/Success Messages */}
            {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
                    {success}
                </div>
            )}

            {/* Blocked Sites List */}
            <div>
                <h3 className="text-xl font-semibold mb-3">
                    Currently Blocked Sites
                </h3>
                {blockedSites.length === 0 ? (
                    <p className="text-gray-500">
                        No websites are currently blocked
                    </p>
                ) : (
                    <div className="space-y-3">
                        {blockedSites.map((site) => (
                            <div
                                key={site.domain}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                            >
                                <div>
                                    <div className="font-medium">
                                        {site.domain}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Time remaining:{" "}
                                        {getRemainingTime(site.endTime)}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleUnblock(site.domain)}
                                    className="px-4 py-2 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    Unblock
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WebsiteBlocker;
