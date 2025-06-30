// Common types used across the application

export interface StatCardProps {
    label: string;
    value: string;
    color: string;
    bgColor: string;
}

export interface TimeData {
    hours: number;
    minutes: number;
    seconds: number;
}

export interface CategoryColors {
    work: string;
    social: string;
    other: string;
}

export interface DashboardSection {
    id: string;
    title: string;
    component: React.ComponentType;
    enabled: boolean;
}

export interface ChartData {
    label: string;
    value: number;
    color: string;
    category?: string;
}

export interface MetricSummary {
    total: number;
    average: number;
    peak: number;
    trend: "up" | "down" | "stable";
}
export interface BlockedSite {
    domain: string;
    ruleId: number;
    startTime: number;
    endTime: number;
    timezone: string; // IANA timezone identifier (e.g., 'America/New_York')
    scheduledStartTime?: number; // UTC timestamp for when block should start
    scheduledEndTime?: number; // UTC timestamp for when block should end
}
