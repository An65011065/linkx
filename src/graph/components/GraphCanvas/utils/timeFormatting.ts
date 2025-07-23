import { TIME_CONSTANTS } from "./constants";

/**
 * Format milliseconds into human-readable time string
 * Extracted from your original formatTime function
 */
export const formatTime = (milliseconds: number): string => {
    const hours = Math.floor(
        milliseconds / TIME_CONSTANTS.MILLISECONDS_PER_HOUR,
    );
    const minutes = Math.floor(
        (milliseconds % TIME_CONSTANTS.MILLISECONDS_PER_HOUR) /
            TIME_CONSTANTS.MILLISECONDS_PER_MINUTE,
    );
    const seconds = Math.floor(
        (milliseconds % TIME_CONSTANTS.MILLISECONDS_PER_MINUTE) /
            TIME_CONSTANTS.MILLISECONDS_PER_SECOND,
    );

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
};

/**
 * Format timestamp to locale time string
 */
export const formatTimestamp = (
    timestamp: number,
    options: Intl.DateTimeFormatOptions = {},
): string => {
    const defaultOptions: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        ...options,
    };

    return new Date(timestamp).toLocaleTimeString("en-US", defaultOptions);
};

/**
 * Format timestamp to locale date string
 */
export const formatDate = (
    timestamp: number,
    options: Intl.DateTimeFormatOptions = {},
): string => {
    const defaultOptions: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        year: "numeric",
        ...options,
    };

    return new Date(timestamp).toLocaleDateString("en-US", defaultOptions);
};

/**
 * Format timestamp to combined date and time
 */
export const formatDateTime = (
    timestamp: number,
    dateOptions: Intl.DateTimeFormatOptions = {},
    timeOptions: Intl.DateTimeFormatOptions = {},
): string => {
    const date = formatDate(timestamp, dateOptions);
    const time = formatTimestamp(timestamp, timeOptions);
    return `${date} at ${time}`;
};

/**
 * Get relative time string (e.g., "2 hours ago", "just now")
 */
export const getRelativeTime = (
    timestamp: number,
    now: number = Date.now(),
): string => {
    const diff = now - timestamp;

    if (diff < TIME_CONSTANTS.MILLISECONDS_PER_MINUTE) {
        return "just now";
    }

    if (diff < TIME_CONSTANTS.MILLISECONDS_PER_HOUR) {
        const minutes = Math.floor(
            diff / TIME_CONSTANTS.MILLISECONDS_PER_MINUTE,
        );
        return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    }

    if (diff < TIME_CONSTANTS.MILLISECONDS_PER_DAY) {
        const hours = Math.floor(diff / TIME_CONSTANTS.MILLISECONDS_PER_HOUR);
        return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }

    const days = Math.floor(diff / TIME_CONSTANTS.MILLISECONDS_PER_DAY);
    return `${days} day${days === 1 ? "" : "s"} ago`;
};

/**
 * Determine appropriate timeline marker interval based on time range
 */
export const getTimelineMarkerInterval = (timeRangeMs: number): number => {
    if (timeRangeMs <= TIME_CONSTANTS.DISPLAY_THRESHOLDS.TWO_HOURS) {
        return TIME_CONSTANTS.MARKER_INTERVALS.FIFTEEN_MINUTES;
    } else if (timeRangeMs <= TIME_CONSTANTS.DISPLAY_THRESHOLDS.SIX_HOURS) {
        return TIME_CONSTANTS.MARKER_INTERVALS.THIRTY_MINUTES;
    } else if (timeRangeMs <= TIME_CONSTANTS.DISPLAY_THRESHOLDS.TWELVE_HOURS) {
        return TIME_CONSTANTS.MARKER_INTERVALS.ONE_HOUR;
    } else {
        return TIME_CONSTANTS.MARKER_INTERVALS.TWO_HOURS;
    }
};

/**
 * Generate timeline markers for a given time range
 * Fixed to align with actual data timestamps instead of rounded intervals
 */
export const generateTimelineMarkers = (
    startTime: number,
    endTime: number,
    maxMarkers: number = TIME_CONSTANTS.MAX_TIMELINE_MARKERS,
): Array<{ timestamp: number; label: string; isHour: boolean }> => {
    const timeRange = endTime - startTime;

    // If time range is very small (less than 1 hour), create markers based on data range
    if (timeRange < TIME_CONSTANTS.MILLISECONDS_PER_HOUR) {
        const step = timeRange / (maxMarkers - 1);
        const markers: Array<{
            timestamp: number;
            label: string;
            isHour: boolean;
        }> = [];

        for (let i = 0; i < maxMarkers; i++) {
            const timestamp = startTime + step * i;
            const date = new Date(timestamp);
            const isHour = date.getMinutes() === 0;

            const label = date.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            });

            markers.push({ timestamp, label, isHour });
        }

        return markers;
    }

    // For longer time ranges, use smart interval-based markers
    const interval = getTimelineMarkerInterval(timeRange);

    // Find the first marker time that's nicely aligned
    let firstMarkerTime: number;

    if (interval >= TIME_CONSTANTS.MARKER_INTERVALS.ONE_HOUR) {
        // Align to hour boundaries
        const startDate = new Date(startTime);
        startDate.setMinutes(0, 0, 0);
        firstMarkerTime = startDate.getTime();

        // If the aligned time is before our start time, move to next hour
        if (firstMarkerTime < startTime) {
            firstMarkerTime += TIME_CONSTANTS.MARKER_INTERVALS.ONE_HOUR;
        }
    } else {
        // For sub-hour intervals, align to appropriate minute boundaries
        const startDate = new Date(startTime);
        const minutes = startDate.getMinutes();
        const targetMinutes =
            Math.ceil(
                minutes / (interval / TIME_CONSTANTS.MILLISECONDS_PER_MINUTE),
            ) *
            (interval / TIME_CONSTANTS.MILLISECONDS_PER_MINUTE);

        startDate.setMinutes(targetMinutes, 0, 0);
        firstMarkerTime = startDate.getTime();

        if (firstMarkerTime < startTime) {
            firstMarkerTime += interval;
        }
    }

    const markers: Array<{
        timestamp: number;
        label: string;
        isHour: boolean;
    }> = [];

    // Generate markers at regular intervals from the aligned start time
    for (
        let timestamp = firstMarkerTime;
        timestamp <= endTime && markers.length < maxMarkers;
        timestamp += interval
    ) {
        const date = new Date(timestamp);
        const isHour = date.getMinutes() === 0;

        let label: string;
        if (interval >= TIME_CONSTANTS.MARKER_INTERVALS.ONE_HOUR) {
            // For hour+ intervals, show time without minutes
            label = date.toLocaleTimeString("en-US", {
                hour: "numeric",
                hour12: true,
            });
        } else {
            // For sub-hour intervals, show full time
            label = date.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            });
        }

        markers.push({ timestamp, label, isHour });
    }

    // If we don't have enough markers, add the end time as a marker
    if (markers.length < 2) {
        const endDate = new Date(endTime);
        const endLabel = endDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });

        markers.push({
            timestamp: endTime,
            label: endLabel,
            isHour: endDate.getMinutes() === 0,
        });
    }

    return markers;
};

/**
 * Format hour bracket label for display
 * Used in empty state when showing available time periods
 */
export const formatHourBracket = (startTime: number): string => {
    return new Date(startTime).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        hour12: true,
    });
};

/**
 * Get hour bracket for a timestamp (rounds to hour boundary)
 */
export const getHourBracket = (
    timestamp: number,
): { start: number; end: number } => {
    const date = new Date(timestamp);
    const hourStart = new Date(date);
    hourStart.setMinutes(0, 0, 0);

    const hourEnd = new Date(hourStart);
    hourEnd.setHours(hourStart.getHours() + 1);

    return {
        start: hourStart.getTime(),
        end: hourEnd.getTime(),
    };
};

/**
 * Group timestamps into hour brackets
 */
export const groupTimestampsIntoHourBrackets = (
    timestamps: number[],
): Array<{ label: string; start: number; end: number; count: number }> => {
    const hourBrackets = new Map<
        string,
        { start: number; end: number; count: number }
    >();

    timestamps.forEach((timestamp) => {
        const bracket = getHourBracket(timestamp);
        const label = formatHourBracket(bracket.start);

        const existing = hourBrackets.get(label);
        if (existing) {
            existing.count++;
            existing.start = Math.min(existing.start, bracket.start);
            existing.end = Math.max(existing.end, bracket.end);
        } else {
            hourBrackets.set(label, {
                start: bracket.start,
                end: bracket.end,
                count: 1,
            });
        }
    });

    return Array.from(hourBrackets.entries())
        .map(([label, data]) => ({ label, ...data }))
        .sort((a, b) => b.start - a.start); // Most recent first
};

/**
 * Check if a timestamp is within a time range
 */
export const isTimestampInRange = (
    timestamp: number,
    startTime: number,
    endTime: number,
): boolean => {
    return timestamp >= startTime && timestamp <= endTime;
};

/**
 * Get time range duration in human-readable format
 */
export const formatTimeRange = (startTime: number, endTime: number): string => {
    const duration = endTime - startTime;
    return formatTime(duration);
};

/**
 * Format session duration
 */
export const formatSessionDuration = (
    startTime: number,
    endTime: number,
): string => {
    const duration = endTime - startTime;

    if (duration < TIME_CONSTANTS.MILLISECONDS_PER_MINUTE) {
        return "< 1 minute";
    }

    const hours = Math.floor(duration / TIME_CONSTANTS.MILLISECONDS_PER_HOUR);
    const minutes = Math.floor(
        (duration % TIME_CONSTANTS.MILLISECONDS_PER_HOUR) /
            TIME_CONSTANTS.MILLISECONDS_PER_MINUTE,
    );

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
};

/**
 * Get time of day category (morning, afternoon, evening, night)
 */
export const getTimeOfDayCategory = (
    timestamp: number,
): "morning" | "afternoon" | "evening" | "night" => {
    const hour = new Date(timestamp).getHours();

    if (hour >= 6 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 21) return "evening";
    return "night";
};

/**
 * Check if timestamp is today
 */
export const isToday = (timestamp: number): boolean => {
    const today = new Date();
    const date = new Date(timestamp);

    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    );
};

/**
 * Check if timestamp is yesterday
 */
export const isYesterday = (timestamp: number): boolean => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = new Date(timestamp);

    return (
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear()
    );
};
