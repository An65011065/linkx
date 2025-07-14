import React, { useState, useEffect } from "react";
import DataService from "../../data/dataService";
import type { BrowsingSession, TabSession, Task } from "../../data/dataService";
import type { UrlVisit } from "../../data/background";
import Activity from "./Activity";
import { freeTrial } from "../../main/MainTab";
import TodoList from "./TodoList";

// Secure blur component that can't be bypassed with CSS
const SecureBlur: React.FC<{
    children: React.ReactNode;
    isActive?: boolean;
}> = ({ children, isActive = true }) => {
    if (!isActive || !freeTrial) return <>{children}</>;

    return (
        <div
            className="relative select-none pointer-events-none"
            style={{ filter: "blur(15px)" }}
        >
            {/* Anti-inspect overlay */}
            <div className="absolute inset-0 z-50 bg-transparent" />
            {/* Content with multiple layers of security */}
            <div
                className="opacity-90"
                style={{
                    WebkitUserSelect: "none",
                    MozUserSelect: "none",
                    msUserSelect: "none",
                    userSelect: "none",
                    WebkitTouchCallout: "none",
                }}
            >
                {children}
            </div>
        </div>
    );
};

interface StoryCardProps {
    currentSession: BrowsingSession | null;
    cardType:
        | "overview"
        | "domains"
        | "activity"
        | "focus"
        | "breaks"
        | "score";
    isDarkMode?: boolean;
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

const getNextUpcomingTask = (tasks: Task[]): Task | null => {
    const now = new Date();
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

    // Helper function to convert time string to minutes
    const timeToMinutes = (timeStr: string): number => {
        // Handle formats like "4:15pm", "4pm", "4:15 PM", etc.
        const cleanTime = timeStr.toLowerCase().trim();
        const isPM = cleanTime.includes("pm");
        const isAM = cleanTime.includes("am");

        // Extract the time part (remove am/pm)
        const timeOnly = cleanTime.replace(/[ap]m/g, "").trim();

        let hours: number;
        let minutes: number = 0;

        if (timeOnly.includes(":")) {
            const [hoursStr, minutesStr] = timeOnly.split(":");
            hours = parseInt(hoursStr);
            minutes = parseInt(minutesStr);
        } else {
            hours = parseInt(timeOnly);
        }

        // Convert to 24-hour format
        if (isPM && hours !== 12) {
            hours += 12;
        } else if (isAM && hours === 12) {
            hours = 0;
        }

        return hours * 60 + minutes;
    };

    // Get active tasks with times that haven't passed yet
    const upcomingTasks = tasks
        .filter(
            (task) =>
                task.status === "active" &&
                task.time &&
                timeToMinutes(task.time) > currentTimeInMinutes,
        )
        .sort((a, b) => {
            const timeA = timeToMinutes(a.time!);
            const timeB = timeToMinutes(b.time!);
            return timeA - timeB;
        });

    // Return the earliest upcoming task, or null if none found
    return upcomingTasks.length > 0 ? upcomingTasks[0] : null;
};

export const StoryCard: React.FC<StoryCardProps> = ({
    currentSession,
    cardType,
    isDarkMode = false,
}) => {
    const [showTodoList, setShowTodoList] = useState(false);
    const [tasks, setTasks] = useState<Task[]>([]);
    const dataService = DataService.getInstance();

    // Load tasks on mount
    useEffect(() => {
        const loadTasks = async () => {
            const loadedTasks = await dataService.getTasks();
            // Filter out deleted tasks to match TodoList behavior
            const visibleTasks = loadedTasks.filter(
                (task) => task.status !== "deleted",
            );
            setTasks(visibleTasks);
        };
        loadTasks();
    }, []);

    if (!currentSession) return null;

    // If showing todo list and we're on the overview card, show the TodoList component
    if (showTodoList && cardType === "overview") {
        return (
            <div
                className={`rounded-2xl relative overflow-hidden w-full h-full font-sans flex flex-col ${
                    isDarkMode
                        ? "bg-black backdrop-blur-xl border border-white/10"
                        : "bg-white shadow-2xl border border-gray-200"
                }`}
            >
                <button
                    onClick={() => setShowTodoList(false)}
                    className={`absolute top-6 right-6 px-4 py-2 rounded-lg z-30 transition-all ${
                        isDarkMode
                            ? "bg-white/10 hover:bg-white/20 text-white"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                    }`}
                >
                    Back to Dashboards
                </button>
                <TodoList isDarkMode={isDarkMode} onTasksChange={setTasks} />
            </div>
        );
    }

    const stats = currentSession.stats;
    const productiveTime = stats.workTime + stats.otherTime;
    const leisureTime = stats.socialTime;
    const totalTime = stats.totalTime;

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
            .filter((visit: UrlVisit) => visit.activeTime > 0)
            .map((visit: UrlVisit) => ({
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

    const analyzeSleepPatterns = () => {
        if (!currentSession)
            return {
                lastActivityTime: 0,
                firstActivityTime: 0,
                estimatedSleepHours: 0,
                lateNightActivity: false,
            };

        const allVisits = currentSession.tabSessions
            .flatMap((tab) => tab.urlVisits)
            .filter((visit) => visit.activeTime > 0)
            .sort((a, b) => a.startTime - b.startTime);

        if (allVisits.length === 0) {
            return {
                lastActivityTime: 0,
                firstActivityTime: 0,
                estimatedSleepHours: 0,
                lateNightActivity: false,
            };
        }

        // Get last activity of previous day and first activity of today
        const today = new Date();
        const todayStart = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
        );

        // Find the visit with the latest END time (not latest start time)
        let lastActivityTime = 0;
        allVisits.forEach((visit) => {
            const visitEndTime =
                visit.endTime || visit.startTime + visit.activeTime;
            if (visitEndTime > lastActivityTime) {
                lastActivityTime = visitEndTime;
            }
        });

        // Find first activity time of today
        const todayVisits = allVisits.filter(
            (visit) => visit.startTime >= todayStart.getTime(),
        );
        const firstActivityTime =
            todayVisits.length > 0
                ? todayVisits[0].startTime
                : todayStart.getTime();

        // Calculate estimated sleep duration
        const lastActivityDate = new Date(lastActivityTime);
        // If last activity was today, estimate sleep based on typical bedtime
        let estimatedSleepHours = 0;
        if (lastActivityDate.getDate() === today.getDate()) {
            // If last activity was after midnight, assume they went to bed then
            const bedTime = Math.max(lastActivityTime, todayStart.getTime());
            estimatedSleepHours = Math.max(
                0,
                (firstActivityTime - bedTime) / (1000 * 60 * 60),
            );
        } else {
            // Cross-day calculation
            estimatedSleepHours = Math.max(
                0,
                (firstActivityTime - lastActivityTime) / (1000 * 60 * 60),
            );
        }

        // Check for late night activity (after midnight)
        const lateNightActivity = allVisits.some((visit) => {
            const visitDate = new Date(visit.startTime);
            const hour = visitDate.getHours();
            return hour >= 0 && hour < 5; // Activity between 12 AM and 5 AM
        });

        return {
            lastActivityTime,
            firstActivityTime,
            estimatedSleepHours: Math.min(estimatedSleepHours, 12), // Cap at 12 hours
            lateNightActivity,
        };
    };

    const calculateScore = () => {
        const baseScore =
            dataService.calculateDigitalWellnessScore(currentSession);
        const sleepData = analyzeSleepPatterns();
        let sleepBonus = 0;
        let sleepPenalty = 0;

        // Bonus for adequate sleep (5+ hours)
        if (sleepData.estimatedSleepHours >= 5) {
            const extraHours = sleepData.estimatedSleepHours - 5;
            sleepBonus = Math.min(extraHours * 2, 10); // 2 points per hour, max 10 points
        }

        // Heavy penalty for late night activity (past midnight)
        if (sleepData.lateNightActivity) {
            sleepPenalty = 15; // Heavy penalty for staying up past midnight
        }

        // Additional penalty for very short sleep (less than 5 hours)
        if (
            sleepData.estimatedSleepHours > 0 &&
            sleepData.estimatedSleepHours < 5
        ) {
            const missedHours = 5 - sleepData.estimatedSleepHours;
            sleepPenalty += missedHours * 3; // 3 points penalty per hour under 5
        }

        return Math.max(
            0,
            Math.min(100, baseScore + sleepBonus - sleepPenalty),
        );
    };

    const renderContent = () => {
        switch (cardType) {
            case "overview":
                return (
                    <div className="h-full grid grid-cols-2 gap-6 p-12 relative">
                        <div className="flex flex-col justify-between">
                            <div>
                                <div
                                    className={`${
                                        isDarkMode
                                            ? "text-6xl font-light mb-3 tracking-tight text-white"
                                            : "text-6xl font-extralight mb-3 tracking-tight text-black"
                                    }`}
                                >
                                    <strong
                                        className={`${
                                            isDarkMode
                                                ? "font-normal text-blue-400"
                                                : ""
                                        }`}
                                    >
                                        {formatTime(totalTime)}
                                    </strong>
                                </div>
                                <div
                                    className={`${
                                        isDarkMode
                                            ? "text-lg font-normal text-gray-300"
                                            : "text-lg font-light text-gray-600"
                                    }`}
                                >
                                    across{" "}
                                    <span
                                        className={`${
                                            isDarkMode
                                                ? "font-medium text-white"
                                                : "font-medium text-black"
                                        }`}
                                    >
                                        {stats.uniqueUrls}
                                    </span>{" "}
                                    websites today.
                                </div>
                            </div>
                            <div
                                className={`flex ${
                                    isDarkMode ? "gap-12" : "gap-12"
                                } items-baseline`}
                            >
                                <div>
                                    <div
                                        className={`${
                                            isDarkMode
                                                ? "text-3xl font-normal mb-1 text-blue-400"
                                                : "text-3xl font-light mb-1 text-black"
                                        }`}
                                    >
                                        {formatTime(productiveTime)}
                                    </div>
                                    <div
                                        className={`${
                                            isDarkMode
                                                ? "text-xs font-medium uppercase tracking-widest text-gray-400"
                                                : "text-xs font-medium uppercase tracking-widest text-gray-400"
                                        }`}
                                    >
                                        PRODUCTIVE
                                    </div>
                                </div>
                                <div>
                                    <div
                                        className={`${
                                            isDarkMode
                                                ? "text-3xl font-normal mb-1 text-orange-400"
                                                : "text-3xl font-light mb-1 text-black"
                                        }`}
                                    >
                                        {formatTime(leisureTime)}
                                    </div>
                                    <div
                                        className={`${
                                            isDarkMode
                                                ? "text-xs font-medium uppercase tracking-widest text-gray-400"
                                                : "text-xs font-medium uppercase tracking-widest text-gray-400"
                                        }`}
                                    >
                                        LEISURE
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end items-start">
                            <SecureBlur>
                                <div className="grid grid-cols-4 gap-1 justify-center w-fit">
                                    {getTopDomains()
                                        .slice(0, 12)
                                        .map((item, index) => (
                                            <div
                                                key={index}
                                                className={`${
                                                    isDarkMode
                                                        ? "flex flex-col items-center w-12 p-2 rounded-lg hover:bg-white/10 transition-all hover:-translate-y-0.5"
                                                        : "bg-white rounded-lg p-2 flex flex-col items-center gap-1 transition-all duration-200 hover:shadow-md cursor-pointer w-12"
                                                }`}
                                            >
                                                <img
                                                    src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=32`}
                                                    alt={item.domain}
                                                    className={`${
                                                        isDarkMode
                                                            ? "w-5 h-5 rounded opacity-80"
                                                            : "w-5 h-5 rounded opacity-80"
                                                    }`}
                                                    onError={(e) => {
                                                        (
                                                            e.target as HTMLImageElement
                                                        ).style.display =
                                                            "none";
                                                    }}
                                                />
                                                <div
                                                    className={`${
                                                        isDarkMode
                                                            ? "text-xs font-normal text-gray-300 text-center mt-1"
                                                            : "text-xs font-medium text-gray-700 text-center"
                                                    }`}
                                                >
                                                    {formatTime(item.time)}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </SecureBlur>
                        </div>
                        {/* Add the Up Next button with task preview */}
                        <button
                            onClick={() => setShowTodoList(true)}
                            className={`absolute bottom-6 right-6 px-4 py-2 rounded-lg transition-all ${
                                isDarkMode
                                    ? "bg-black/80 hover:bg-black/90 backdrop-blur-sm border border-white/10 text-white"
                                    : "bg-white border border-gray-200 hover:bg-gray-50 text-gray-800"
                            }`}
                        >
                            Up Next:{" "}
                            {(() => {
                                const nextTask = getNextUpcomingTask(tasks);
                                if (nextTask) {
                                    return `${nextTask.text} | ${nextTask.time}`;
                                }

                                // Fallback to any active task if no upcoming timed tasks
                                const activeTasks = tasks.filter(
                                    (t) => t.status === "active",
                                );
                                if (activeTasks.length > 0) {
                                    return activeTasks[0].text;
                                }

                                return "Plan your day";
                            })()}
                        </button>
                    </div>
                );

            case "activity": {
                return (
                    <div className="h-full grid grid-cols-2 gap-6 p-12 relative">
                        <div className="flex flex-col justify-between">
                            <div></div>
                            <div className="flex flex-col gap-2">
                                <div
                                    className={`${
                                        isDarkMode
                                            ? "text-xs font-medium uppercase tracking-widest text-gray-400"
                                            : "text-xs font-medium uppercase tracking-widest text-gray-400"
                                    }`}
                                >
                                    LONGEST BREAK
                                </div>

                                <div
                                    className={`${
                                        isDarkMode
                                            ? "text-5xl font-light mb-2 tracking-tight text-green-400"
                                            : "text-5xl font-extralight mb-2 tracking-tight text-green-500"
                                    }`}
                                >
                                    {formatTime(getLongestBreak().duration)}
                                </div>
                                <SecureBlur>
                                    <div
                                        className={`${
                                            isDarkMode
                                                ? "text-sm font-normal text-gray-300"
                                                : "text-sm font-light text-gray-600"
                                        }`}
                                    >
                                        {formatTimeOfDay(
                                            getLongestBreak().start,
                                        )}{" "}
                                        -{" "}
                                        {formatTimeOfDay(getLongestBreak().end)}
                                    </div>
                                </SecureBlur>
                            </div>
                        </div>
                        <div className="flex justify-end items-start">
                            <SecureBlur>
                                <Activity isDarkMode={isDarkMode} />
                            </SecureBlur>
                        </div>
                        {/* Remove autoplay button */}
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
                                <div
                                    className={`${
                                        isDarkMode
                                            ? "text-xs font-medium uppercase tracking-widest text-gray-400"
                                            : "text-xs font-medium uppercase tracking-widest text-gray-400"
                                    }`}
                                >
                                    LONGEST FOCUS STREAK
                                </div>
                                <SecureBlur>
                                    <div
                                        className={`${
                                            isDarkMode
                                                ? "text-5xl font-light mb-2 tracking-tight text-green-400"
                                                : "text-5xl font-extralight mb-2 tracking-tight text-green-500"
                                        }`}
                                    >
                                        {formatTime(longestStreak.time)}
                                    </div>
                                    <div
                                        className={`${
                                            isDarkMode
                                                ? "text-sm font-normal text-gray-300"
                                                : "text-sm font-light text-gray-600"
                                        }`}
                                    >
                                        {longestStreak.time > 0
                                            ? `${formatTimeOfDay(
                                                  longestStreak.startTime,
                                              )} - ${formatTimeOfDay(
                                                  longestStreak.startTime +
                                                      longestStreak.time,
                                              )}`
                                            : "No focus sessions today"}
                                    </div>
                                </SecureBlur>
                            </div>
                        </div>
                        <div className="flex justify-end items-start">
                            <div
                                className={`${
                                    isDarkMode
                                        ? "flex flex-col gap-2 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 w-fit"
                                        : "bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 w-fit"
                                }`}
                            >
                                <div
                                    className={`${
                                        isDarkMode
                                            ? "text-xs font-medium uppercase tracking-widest text-gray-400 mb-6"
                                            : "text-xs font-medium uppercase tracking-widest text-gray-400 mb-6"
                                    }`}
                                >
                                    NUMBER OF LINKS
                                </div>
                                <SecureBlur>
                                    <div className="grid grid-cols-4 gap-3 justify-center">
                                        {Array.from(
                                            longestStreak.domains.entries(),
                                        )
                                            .slice(0, 12)
                                            .map(([domain, data], index) => (
                                                <div
                                                    key={index}
                                                    className={`flex flex-col items-center w-12 p-1 rounded-lg transition-all ${
                                                        isDarkMode
                                                            ? "hover:bg-white/10 hover:-translate-y-0.5"
                                                            : "hover:bg-gray-50 hover:-translate-y-0.5"
                                                    }`}
                                                >
                                                    <img
                                                        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                                                        alt={domain}
                                                        className="w-6 h-6 rounded-md"
                                                        onError={(e) => {
                                                            (
                                                                e.target as HTMLImageElement
                                                            ).style.display =
                                                                "none";
                                                        }}
                                                    />
                                                    <div
                                                        className={`text-xs font-normal text-center mt-1 ${
                                                            isDarkMode
                                                                ? "text-gray-300"
                                                                : "text-gray-800"
                                                        }`}
                                                    >
                                                        {data.count}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </SecureBlur>
                            </div>
                        </div>
                        {/* Remove autoplay button */}
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
                    const goodSuggestions = [];
                    const mediumSuggestions = [];
                    const badSuggestions = [];
                    const sleepData = analyzeSleepPatterns();

                    // Productivity feedback
                    if (productivityRatio >= 0.7) {
                        goodSuggestions.push({
                            text: "Great productivity balance",
                            status: "green",
                            detail: `${Math.round(
                                productivityRatio * 100,
                            )}% of time spent productively`,
                        });
                    } else {
                        badSuggestions.push({
                            text: "Increase productive time",
                            status: "red",
                            detail: `Currently at ${Math.round(
                                productivityRatio * 100,
                            )}% productive time`,
                        });
                    }

                    // Focus streak feedback
                    if (longestStreakTime >= 30 * 60 * 1000) {
                        goodSuggestions.push({
                            text: "Good focus streaks",
                            status: "green",
                            detail: `Achieved ${formatTime(
                                longestStreakTime,
                            )} focus streak`,
                        });
                    } else if (longestStreakTime > 15 * 60 * 1000) {
                        mediumSuggestions.push({
                            text: "Aim for longer focus streaks",
                            status: "yellow",
                            detail: "Target: 30+ minute sessions",
                        });
                    } else {
                        badSuggestions.push({
                            text: "Aim for longer focus streaks",
                            status: "red",
                            detail: "Target: 30+ minute sessions",
                        });
                    }

                    // Context switching feedback
                    if (uniqueUrls <= 300) {
                        goodSuggestions.push({
                            text: "Good focus on key tasks",
                            status: "green",
                            detail: "Maintaining focused browsing patterns",
                        });
                    } else if (uniqueUrls <= 500) {
                        mediumSuggestions.push({
                            text: "Reduce context switching",
                            status: "yellow",
                            detail: `Visited ${uniqueUrls} unique URLs`,
                        });
                    } else {
                        badSuggestions.push({
                            text: "Reduce context switching",
                            status: "red",
                            detail: `Visited ${uniqueUrls} unique URLs`,
                        });
                    }

                    // Sleep duration feedback
                    if (sleepData.estimatedSleepHours >= 7) {
                        goodSuggestions.push({
                            text: "Excellent sleep duration",
                            status: "green",
                            detail: `Estimated ${sleepData.estimatedSleepHours.toFixed(
                                1,
                            )} hours of sleep`,
                        });
                    } else if (sleepData.estimatedSleepHours >= 5) {
                        if (sleepData.estimatedSleepHours >= 6) {
                            goodSuggestions.push({
                                text: "Adequate sleep duration",
                                status: "green",
                                detail: `Estimated ${sleepData.estimatedSleepHours.toFixed(
                                    1,
                                )} hours of sleep`,
                            });
                        } else {
                            mediumSuggestions.push({
                                text: "Consider more sleep",
                                status: "yellow",
                                detail: `${sleepData.estimatedSleepHours.toFixed(
                                    1,
                                )} hours estimated - aim for 7-9 hours`,
                            });
                        }
                    }

                    // Late night activity feedback
                    if (!sleepData.lateNightActivity) {
                        goodSuggestions.push({
                            text: "Good bedtime habits",
                            status: "green",
                            detail: "No late-night screen activity detected",
                        });
                    } else {
                        const lastActivityTime = new Date(
                            sleepData.lastActivityTime,
                        );
                        const lastActivityFormatted =
                            lastActivityTime.toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                            });
                        badSuggestions.push({
                            text: "Avoid late-night screen time",
                            status: "red",
                            detail: `You stayed up until ${lastActivityFormatted} - affects sleep quality`,
                        });
                    }

                    // Combine all suggestions in order: good, medium, bad
                    const allSuggestions = [
                        ...goodSuggestions,
                        ...mediumSuggestions,
                        ...badSuggestions,
                    ];

                    if (allSuggestions.length === 0) {
                        return [
                            {
                                text: "Keep up the great work!",
                                status: "green",
                                detail: "All metrics look good",
                            },
                        ];
                    }

                    return allSuggestions;
                };

                return (
                    <div className="h-full grid grid-cols-2 gap-6 p-12 relative">
                        <div className="flex flex-col justify-between">
                            <div></div>
                            <div className="flex flex-col items-start gap-2">
                                <div
                                    className={`${
                                        isDarkMode
                                            ? "text-xs font-medium uppercase tracking-widest text-gray-400"
                                            : "text-xs font-medium uppercase tracking-widest text-gray-400"
                                    }`}
                                >
                                    WELLNESS SCORE
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <div
                                        className={`${
                                            isDarkMode
                                                ? "text-6xl font-light tracking-tight drop-shadow-lg"
                                                : "text-6xl font-extralight tracking-tight"
                                        } ${getScoreColor(score)}`}
                                    >
                                        {Math.round(score)}
                                    </div>
                                    <div
                                        className={`${
                                            isDarkMode
                                                ? "text-2xl font-normal text-gray-300"
                                                : "text-2xl font-light text-gray-400"
                                        }`}
                                    >
                                        / 100
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-start">
                            <h2
                                className={`${
                                    isDarkMode
                                        ? "text-lg font-medium text-white mb-6"
                                        : "text-lg font-medium text-black mb-6"
                                }`}
                            >
                                Insights & Suggestions
                            </h2>
                            <SecureBlur>
                                <div className="flex flex-col gap-4">
                                    {getSuggestions().map(
                                        (suggestion, index) => (
                                            <div
                                                key={index}
                                                className="flex items-start gap-3"
                                            >
                                                <div
                                                    className={`w-3 h-3 rounded-full mt-1.5 ${
                                                        suggestion.status ===
                                                        "green"
                                                            ? "bg-green-500"
                                                            : suggestion.status ===
                                                              "yellow"
                                                            ? "bg-yellow-500"
                                                            : "bg-red-500"
                                                    }`}
                                                />
                                                <div>
                                                    <div
                                                        className={`text-sm font-medium ${
                                                            isDarkMode
                                                                ? "text-white"
                                                                : "text-black"
                                                        }`}
                                                    >
                                                        {suggestion.text}
                                                    </div>
                                                    <div
                                                        className={`text-xs ${
                                                            isDarkMode
                                                                ? "font-normal text-gray-300"
                                                                : "text-gray-600"
                                                        }`}
                                                    >
                                                        {suggestion.detail}
                                                    </div>
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </SecureBlur>
                        </div>
                    </div>
                );
            }

            default:
                return null;
        }
    };

    return (
        <div
            className={`rounded-2xl relative overflow-hidden w-full h-full font-sans flex flex-col ${
                isDarkMode
                    ? "bg-black backdrop-blur-xl border border-white/10"
                    : "bg-white shadow-2xl border border-gray-200"
            }`}
        >
            {isDarkMode && (
                <>
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
                </>
            )}
            <div
                className={`flex-1 relative z-20 ${
                    isDarkMode ? "text-white" : ""
                }`}
            >
                {renderContent()}
            </div>
        </div>
    );
};
