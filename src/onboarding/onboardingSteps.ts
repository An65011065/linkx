export interface OnboardingStep {
    id: string;
    title: string;
    content: string;
    component: string;
    showComponents: string[];
    position:
        | "stories"
        | "scrollable"
        | "shortcuts"
        | "blocker"
        | "notes"
        | "timers"
        | "templates"
        | "weekly-insights";
}

export const onboardingSteps: OnboardingStep[] = [
    {
        id: "stories",
        title: "Stories",
        content:
            'This is your daily data hub - home for all your productivity insights. Scroll to see more detailed analytics and click "Up Next" to access your todo list tracker.',
        component: "stories-component",
        showComponents: ["stories-component"],
        position: "stories",
    },
    {
        id: "scrollable",
        title: "Smart Bookmarks",
        content:
            "Intelligent bookmarks that adapt based on usage. Frequently accessed sites stay prominent while unused bookmarks gradually fade and disappear to reduce clutter.",
        component: "scrollable-component",
        showComponents: ["stories-component", "scrollable-component"],
        position: "scrollable",
    },
    {
        id: "shortcuts",
        title: "Consolidate Tabs",
        content:
            "Using the popup, you can consolidate scattered tabs into organized groups. Your consolidated tabs will always be stored here a click away for easy access.",
        component: "shortcuts-component",
        showComponents: [
            "stories-component",
            "scrollable-component",
            "shortcuts-component",
        ],
        position: "shortcuts",
    },
    {
        id: "blocker",
        title: "Locking In",
        content:
            "Distraction control center for maintaining focus. Block specific sites during work hours, set time limits, or create custom blocking schedules for different contexts.",
        component: "blocker-component",
        showComponents: [
            "stories-component",
            "scrollable-component",
            "shortcuts-component",
            "blocker-component",
        ],
        position: "blocker",
    },
    {
        id: "notes",
        title: "Site Notes",
        content:
            "Context-aware note-taking for web browsing. Quickly capture insights, save important quotes, or jot down ideas without switching tabs. Right-click to copy notes instantly.",
        component: "notes-component",
        showComponents: [
            "stories-component",
            "scrollable-component",
            "shortcuts-component",
            "blocker-component",
            "notes-component",
        ],
        position: "notes",
    },
    {
        id: "weekly-insights",
        title: "Weekly Insights",
        content:
            "Get comprehensive analytics on your productivity patterns, time spent on different sites, and weekly progress tracking to optimize your workflow.",
        component: "weekly-insights-component",
        showComponents: [
            "stories-component",
            "scrollable-component",
            "shortcuts-component",
            "blocker-component",
            "notes-component",
            "weekly-insights-component",
        ],
        position: "weekly-insights",
    },
    {
        id: "timers",
        title: "Timers",
        content:
            "Focus session timers and productivity trackers. Set pomodoro sessions, break reminders, or custom time blocks to maintain deep work cycles.",
        component: "timers-component",
        showComponents: [
            "stories-component",
            "scrollable-component",
            "shortcuts-component",
            "blocker-component",
            "notes-component",
            "weekly-insights-component",
            "timers-component",
        ],
        position: "timers",
    },
    {
        id: "templates",
        title: "Templates",
        content:
            "Smart tab collections for instant workflow switching. Each template opens all saved tabs at once - perfect for work setups, research sessions, or project contexts.",
        component: "templates-component",
        showComponents: [
            "stories-component",
            "scrollable-component",
            "shortcuts-component",
            "blocker-component",
            "notes-component",
            "weekly-insights-component",
            "timers-component",
            "templates-component",
        ],
        position: "templates",
    },
];

// Position configurations for instruction box placement
export const positionConfigs = {
    stories: {
        top: "460px",
        left: "48px",
        maxWidth: "400px",
    },
    templates: {
        top: "140px",
        right: "48px",
        maxWidth: "320px",
    },
    timers: {
        top: "220px",
        right: "48px",
        maxWidth: "320px",
    },
    "weekly-insights": {
        top: "320px",
        right: "48px",
        maxWidth: "320px",
    },
    scrollable: {
        top: "420px",
        left: "48px",
        maxWidth: "280px",
    },
    shortcuts: {
        top: "520px",
        left: "48px",
        maxWidth: "280px",
    },
    blocker: {
        top: "520px",
        left: "320px",
        maxWidth: "360px",
    },
    notes: {
        top: "520px",
        right: "48px",
        maxWidth: "360px",
    },
};

// Helper function to get position style for instruction box
export const getPositionStyle = (position: OnboardingStep["position"]) => {
    const config = positionConfigs[position];
    return {
        position: "absolute" as const,
        ...config,
        transform: "translateY(8px)",
        transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
    };
};

// Helper function to get visible position style (removes translateY)
export const getVisiblePositionStyle = (
    position: OnboardingStep["position"],
) => {
    const config = positionConfigs[position];
    return {
        position: "absolute" as const,
        ...config,
        transform: "translateY(0)",
        transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
    };
};
