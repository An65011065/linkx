import React from "react";
import DataService from "../../data/dataService";
import Activity from "./Activity";

interface SessionStats {
    totalTime: number;
    workTime: number;
    socialTime: number;
    otherTime: number;
    uniqueUrls: number;
    domainStats?: {
        [domain: string]: {
            category: "work" | "social" | "other";
            time: number;
        };
    };
}

interface Visit {
    domain: string;
    url: string;
    startTime: number;
    endTime?: number;
    activeTime: number;
    category?: "work" | "social" | "other";
}

interface TabSession {
    urlVisits: Visit[];
}

interface StoryCardProps {
    currentSession: {
        stats: SessionStats;
        tabSessions: TabSession[];
    } | null;
    cardType:
        | "overview"
        | "domains"
        | "activity"
        | "focus"
        | "breaks"
        | "score";
    isAutoPlaying?: boolean;
    onToggleAutoPlay?: () => void;
    currentIndex?: number;
    totalCards?: number;
}

interface DomainStats {
    count: number;
    favicon: string;
}

interface FocusStreak {
    time: number;
    startTime: number;
    domains: Map<string, DomainStats>;
    urls: string[];
}

export const StoryCard: React.FC<StoryCardProps> = ({
    currentSession,
    cardType,
    isAutoPlaying,
    onToggleAutoPlay,
    currentIndex = 0,
    totalCards = 6,
}) => {
    if (!currentSession) return null;

    const stats = currentSession.stats;
    const productiveTime = stats.workTime + stats.otherTime;
    const leisureTime = stats.socialTime;
    const totalTime = stats.totalTime;

    const dataService = DataService.getInstance();

    const formatTimeOfDay = (timestamp: number): string => {
        return new Date(timestamp).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    const formatTime = (milliseconds: number): string => {
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor(
            (milliseconds % (1000 * 60 * 60)) / (1000 * 60),
        );

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    };

    const getTopDomains = () => {
        const domainTimes: Record<string, number> = {};
        currentSession.tabSessions.forEach((tab) => {
            tab.urlVisits.forEach((visit) => {
                domainTimes[visit.domain] =
                    (domainTimes[visit.domain] || 0) + visit.activeTime;
            });
        });

        return Object.entries(domainTimes)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 12)
            .map(([domain, time]) => ({ domain, time }));
    };

    const getLongestStreak = (): FocusStreak => {
        if (!currentSession)
            return {
                time: 0,
                startTime: 0,
                domains: new Map(),
                urls: [],
            };

        const allVisits = currentSession.tabSessions
            .flatMap((tab) => tab.urlVisits)
            .filter((visit) => visit.activeTime > 0)
            .sort((a, b) => a.startTime - b.startTime);

        if (allVisits.length === 0) {
            return {
                time: 0,
                startTime: 0,
                domains: new Map(),
                urls: [],
            };
        }

        const MAX_GAP_BETWEEN_SESSIONS = 10 * 60 * 1000;

        let longestStreak: FocusStreak = {
            time: 0,
            startTime: 0,
            domains: new Map(),
            urls: [],
        };
        let currentStreak: FocusStreak = {
            time: 0,
            startTime: 0,
            domains: new Map(),
            urls: [],
        };
        let lastVisitEnd = 0;

        allVisits.forEach((visit) => {
            const gapFromLastVisit = visit.startTime - lastVisitEnd;
            const visitEnd = visit.startTime + visit.activeTime;

            if (gapFromLastVisit <= MAX_GAP_BETWEEN_SESSIONS) {
                // Continue streak
                currentStreak.time += visit.activeTime;
                // Update domain count
                const domainCount = currentStreak.domains.get(visit.domain) || {
                    count: 0,
                    favicon: `https://www.google.com/s2/favicons?domain=${visit.domain}&sz=32`,
                };
                domainCount.count++;
                currentStreak.domains.set(visit.domain, domainCount);
                // Add URL
                currentStreak.urls.push(visit.url);
            } else {
                // Check if current streak is longest
                if (currentStreak.time > longestStreak.time) {
                    longestStreak = {
                        time: currentStreak.time,
                        startTime: currentStreak.startTime,
                        domains: new Map(currentStreak.domains),
                        urls: [...currentStreak.urls],
                    };
                }
                // Start new streak
                currentStreak = {
                    time: visit.activeTime,
                    startTime: visit.startTime,
                    domains: new Map([
                        [
                            visit.domain,
                            {
                                count: 1,
                                favicon: `https://www.google.com/s2/favicons?domain=${visit.domain}&sz=32`,
                            },
                        ],
                    ]),
                    urls: [visit.url],
                };
            }

            lastVisitEnd = visitEnd;
        });

        if (currentStreak.time > longestStreak.time) {
            longestStreak = {
                time: currentStreak.time,
                startTime: currentStreak.startTime,
                domains: new Map(currentStreak.domains),
                urls: [...currentStreak.urls],
            };
        }

        return longestStreak;
    };

    const getLongestBreak = () => {
        interface TimeRange {
            start: number;
            end: number;
        }

        // Get all visits and sort them by time
        const allVisits: TimeRange[] = currentSession.tabSessions
            .flatMap((tab: TabSession) => tab.urlVisits)
            .filter((visit: Visit) => visit.activeTime > 0)
            .map((visit: Visit) => ({
                start: visit.startTime,
                end: visit.endTime || visit.startTime + visit.activeTime,
            }))
            .sort((a: TimeRange, b: TimeRange) => a.start - b.start);

        if (allVisits.length === 0) {
            return { start: 0, end: 0, duration: 0 };
        }

        // Only look at the last 24 hours
        const now = Date.now();
        const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

        // Filter to last 24 hours
        const recentVisits: TimeRange[] = allVisits.filter(
            (visit) => visit.end > twentyFourHoursAgo && visit.start < now,
        );

        if (recentVisits.length === 0) {
            return { start: 0, end: 0, duration: 0 };
        }

        // Combine visits into sessions (if they're within 10 minutes of each other)
        const SAME_SESSION_GAP = 10 * 60 * 1000; // 10 minutes in milliseconds
        const sessions: TimeRange[] = [];
        let activeSession: TimeRange = { ...recentVisits[0] };

        for (let i = 1; i < recentVisits.length; i++) {
            const visit = recentVisits[i];
            // If this visit starts within 10 minutes of the last session ending,
            // extend the current session
            if (visit.start <= activeSession.end + SAME_SESSION_GAP) {
                activeSession.end = Math.max(activeSession.end, visit.end);
            } else {
                // Otherwise, save the current session and start a new one
                sessions.push(activeSession);
                activeSession = { ...visit };
            }
        }
        sessions.push(activeSession);

        // Find the longest break between sessions
        let longestBreak: TimeRange & { duration: number } = {
            start: 0,
            end: 0,
            duration: 0,
        };

        for (let i = 0; i < sessions.length - 1; i++) {
            const session = sessions[i];
            const nextSession = sessions[i + 1];
            const breakDuration = nextSession.start - session.end;

            // Only consider breaks longer than 10 minutes
            if (
                breakDuration > SAME_SESSION_GAP &&
                breakDuration > longestBreak.duration
            ) {
                longestBreak = {
                    start: session.end,
                    end: nextSession.start,
                    duration: breakDuration,
                };
            }
        }

        return longestBreak;
    };

    const calculateScore = () => {
        return dataService.calculateDigitalWellnessScore(currentSession);
    };

    const renderContent = () => {
        //   const score = calculateScore();

        switch (cardType) {
            case "overview":
                return (
                    <div className="h-full grid grid-cols-2 gap-6 p-12 relative">
                        <div className="flex flex-col justify-between">
                            <div>
                                <div className="text-3xl text-white mb-2">
                                    <strong className="font-extrabold text-blue-500">
                                        {formatTime(totalTime)}
                                    </strong>
                                </div>
                                <div className="text-xl text-white mb-2">
                                    across{" "}
                                    <strong className="text-3xl text-blue-500">
                                        {stats.uniqueUrls}
                                    </strong>{" "}
                                    websites today.
                                </div>
                                <div className="text-xl text-white"></div>
                            </div>
                            <div className="flex gap-8">
                                <div className="flex flex-col gap-2">
                                    <span className="text-3xl font-extrabold text-blue-500">
                                        {formatTime(productiveTime)}
                                    </span>
                                    <span className="text-xs text-gray-300 uppercase tracking-wider">
                                        PRODUCTIVE
                                    </span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <span className="text-3xl font-extrabold text-orange-500">
                                        {formatTime(leisureTime)}
                                    </span>
                                    <span className="text-xs text-gray-300 uppercase tracking-wider">
                                        LEISURE
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end items-start">
                            <div className="grid grid-cols-[repeat(4,min-content)] gap-1 justify-center w-fit">
                                {getTopDomains()
                                    .slice(0, 12)
                                    .map((item, index) => (
                                        <div
                                            key={index}
                                            className="flex flex-col items-center w-12 p-0.5 rounded-lg hover:bg-white/10 transition-all hover:-translate-y-0.5"
                                        >
                                            <img
                                                src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=32`}
                                                alt={item.domain}
                                                className="w-6 h-6 rounded-md shadow-md"
                                                onError={(e) => {
                                                    (
                                                        e.target as HTMLImageElement
                                                    ).style.display = "none";
                                                }}
                                            />
                                            <div className="text-xs text-blue-500 font-normal text-center">
                                                {formatTime(item.time)}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                        {onToggleAutoPlay && (
                            <button
                                onClick={onToggleAutoPlay}
                                className="absolute bottom-6 right-6 h-10 pl-3 pr-4 rounded-full flex items-center gap-3 bg-black/80 hover:bg-black/90 transition-colors shadow-lg backdrop-blur-sm border border-white/10"
                            >
                                <div className="w-6 h-6 flex items-center justify-center">
                                    {isAutoPlaying ? (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="white"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <rect
                                                x="6"
                                                y="4"
                                                width="4"
                                                height="16"
                                            ></rect>
                                            <rect
                                                x="14"
                                                y="4"
                                                width="4"
                                                height="16"
                                            ></rect>
                                        </svg>
                                    ) : (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="white"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                        </svg>
                                    )}
                                </div>
                                <div className="text-sm font-medium text-white">
                                    {currentIndex + 1}/{totalCards}
                                </div>
                            </button>
                        )}
                    </div>
                );

            case "activity": {
                return (
                    <div className="h-full grid grid-cols-2 gap-6 p-12 relative">
                        <div className="flex flex-col justify-between">
                            <div className="flex flex-col gap-2">
                                <div className="text-xs text-gray-300 uppercase tracking-wider">
                                    Longest Break
                                </div>
                                <div className="text-3xl font-extrabold text-green-500">
                                    {formatTime(getLongestBreak().duration)}
                                </div>
                                <div className="text-sm text-gray-300">
                                    {formatTimeOfDay(getLongestBreak().start)} -{" "}
                                    {formatTimeOfDay(getLongestBreak().end)}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end items-start">
                            <Activity />
                        </div>

                        {onToggleAutoPlay && (
                            <button
                                onClick={onToggleAutoPlay}
                                className="absolute bottom-6 right-6 h-10 pl-3 pr-4 rounded-full flex items-center gap-3 bg-black/80 hover:bg-black/90 transition-colors shadow-lg backdrop-blur-sm border border-white/10"
                            >
                                <div className="w-6 h-6 flex items-center justify-center">
                                    {isAutoPlaying ? (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="white"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <rect
                                                x="6"
                                                y="4"
                                                width="4"
                                                height="16"
                                            ></rect>
                                            <rect
                                                x="14"
                                                y="4"
                                                width="4"
                                                height="16"
                                            ></rect>
                                        </svg>
                                    ) : (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="white"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                        </svg>
                                    )}
                                </div>
                                <div className="text-sm font-medium text-white">
                                    {currentIndex + 1}/{totalCards}
                                </div>
                            </button>
                        )}
                    </div>
                );
            }

            case "focus": {
                const longestStreak = getLongestStreak();
                return (
                    <div className="h-full grid grid-cols-2 gap-6 p-12 relative">
                        <div className="flex flex-col justify-between">
                            <div></div>
                            <div className="flex flex-col gap-2">
                                <div className="text-xs text-gray-300 uppercase tracking-wider">
                                    Longest Focus Streak
                                </div>
                                <div className="text-3xl font-extrabold text-green-500">
                                    {formatTime(longestStreak.time)}
                                </div>
                                <div className="text-sm text-gray-400">
                                    {formatTimeOfDay(longestStreak.startTime)}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end items-start">
                            <div className="flex flex-col gap-2 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 w-fit">
                                <div className="text-xs text-gray-300 uppercase tracking-wider mb-2">
                                    Number of Links
                                </div>
                                <div className="grid grid-cols-[repeat(4,min-content)] gap-1 justify-center">
                                    {Array.from(longestStreak.domains.entries())
                                        .slice(0, 12)
                                        .map(([domain, data], index) => (
                                            <div
                                                key={index}
                                                className="flex flex-col items-center w-12 p-0.5 rounded-lg hover:bg-white/10 transition-all hover:-translate-y-0.5"
                                            >
                                                <img
                                                    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                                                    alt={domain}
                                                    className="w-6 h-6 rounded-md shadow-md"
                                                    onError={(e) => {
                                                        (
                                                            e.target as HTMLImageElement
                                                        ).style.display =
                                                            "none";
                                                    }}
                                                />
                                                <div className="text-xs text-white/90 font-normal text-center">
                                                    {data.count}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }

            case "score": {
                const getScoreColor = (score: number) => {
                    if (score >= 80) return "text-green-600";
                    if (score >= 70) return "text-green-500";
                    if (score >= 50) return "text-yellow-500";
                    return "text-red-500";
                };

                const productivityRatio =
                    (stats.workTime + stats.otherTime) / stats.totalTime;
                const longestStreakTime = getLongestStreak().time;
                const uniqueUrls = stats.uniqueUrls;
                const score = calculateScore();

                const getSuggestions = () => {
                    const suggestions = [];

                    // Add positive feedback first
                    if (productivityRatio >= 0.7) {
                        suggestions.push({
                            text: "Great productivity balance",
                            status: "green",
                            detail: `${Math.round(
                                productivityRatio * 100,
                            )}% of time spent productively`,
                        });
                    }

                    if (longestStreakTime >= 30 * 60 * 1000) {
                        suggestions.push({
                            text: "Good focus streaks",
                            status: "green",
                            detail: `Achieved ${formatTime(
                                longestStreakTime,
                            )} focus streak`,
                        });
                    }

                    if (uniqueUrls <= 300) {
                        suggestions.push({
                            text: "Good focus on key tasks",
                            status: "green",
                            detail: "Maintaining focused browsing patterns",
                        });
                    }

                    // Add improvement suggestions
                    if (productivityRatio < 0.7) {
                        suggestions.push({
                            text: "Increase productive time",
                            status: "red",
                            detail: `Currently at ${Math.round(
                                productivityRatio * 100,
                            )}% productive time`,
                        });
                    }

                    if (longestStreakTime < 30 * 60 * 1000) {
                        suggestions.push({
                            text: "Aim for longer focus streaks",
                            status:
                                longestStreakTime > 15 * 60 * 1000
                                    ? "yellow"
                                    : "red",
                            detail: "Target: 30+ minute sessions",
                        });
                    }

                    if (uniqueUrls > 300) {
                        suggestions.push({
                            text: "Reduce context switching",
                            status: uniqueUrls > 500 ? "red" : "yellow",
                            detail: `Visited ${uniqueUrls} unique URLs`,
                        });
                    }

                    if (suggestions.length === 0) {
                        suggestions.push({
                            text: "Keep up the great work!",
                            status: "green",
                            detail: "All metrics look good",
                        });
                    }

                    return suggestions;
                };

                return (
                    <div className="h-full grid grid-cols-2 gap-6 p-12">
                        <div className="flex flex-col justify-between">
                            <div></div>
                            <div className="flex flex-col items-start gap-2">
                                <div className="text-xs text-gray-300 uppercase tracking-wider">
                                    Wellness Score
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <div
                                        className={`text-6xl font-extrabold ${getScoreColor(
                                            score,
                                        )} drop-shadow-lg`}
                                    >
                                        {score}
                                    </div>
                                    <div className="text-2xl text-gray-300 font-semibold">
                                        / 100
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-start">
                            <h2 className="text-xl font-bold text-white mb-6">
                                Insights & Suggestions
                            </h2>
                            <div className="flex flex-col gap-4">
                                {getSuggestions().map((suggestion, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-3"
                                    >
                                        <div
                                            className={`w-3 h-3 rounded-full mt-1.5 ${
                                                suggestion.status === "green"
                                                    ? "bg-green-500"
                                                    : suggestion.status ===
                                                      "yellow"
                                                    ? "bg-yellow-500"
                                                    : "bg-red-500"
                                            }`}
                                        />
                                        <div>
                                            <div className="text-white text-sm">
                                                {suggestion.text}
                                            </div>
                                            <div className="font-medium text-gray-400">
                                                {suggestion.detail}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            }

            default:
                return null;
        }
    };

    return (
        <div className="bg-black rounded-2xl relative overflow-hidden backdrop-blur-xl border border-white/10 w-full h-full font-sans flex flex-col">
            {/* Blue gradient - top right */}
            <div
                className="absolute top-0 right-0 w-[300px] h-[300px] z-10 pointer-events-none"
                style={{
                    background:
                        "radial-gradient(circle, rgba(66, 133, 244, 0.4) 0%, rgba(255, 107, 71, 0.2) 50%, transparent 80%)",
                    filter: "blur(40px)",
                }}
            />
            {/* Orange gradient - bottom left */}
            <div
                className="absolute bottom-0 left-0 w-[200px] h-[200px] z-10 pointer-events-none"
                style={{
                    background:
                        "radial-gradient(circle, rgba(255, 107, 71, 0.3) 0%, transparent 70%)",
                    filter: "blur(30px)",
                }}
            />

            <div className="flex-1 relative z-20 text-white">
                {renderContent()}
            </div>
        </div>
    );
};
