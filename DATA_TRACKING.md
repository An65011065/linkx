# Real-Time Browser Data Tracking

This document explains how the extension now tracks real browsing data instead of using mock data.

## Architecture Overview

The data tracking system consists of:

1. **Background Script** (`src/background.ts`) - Listens to Chrome APIs and tracks user activity
2. **Data Service** (`src/shared/services/dataService.ts`) - Manages data storage and retrieval
3. **Type Definitions** (`src/shared/types/common.types.ts`) - TypeScript interfaces
4. **React Hooks** (`src/shared/services/useExtensionData.ts`) - Provides data to components

## Chrome APIs Used

### Tab Lifecycle Tracking

-   `chrome.tabs.onCreated` → Start new TabSession
-   `chrome.tabs.onRemoved` → End TabSession
-   `chrome.tabs.onUpdated` → New UrlVisit when URL changes

### Active Time Tracking

-   `chrome.tabs.onActivated` → Mark tab as active
-   `chrome.windows.onFocusChanged` → Track window focus
-   `chrome.idle.onStateChanged` → Pause tracking when idle

### Navigation Context

-   `chrome.webNavigation.onBeforeNavigate` → Capture navigation source
-   `chrome.webNavigation.onCompleted` → Finalize URL visit

## Data Structure

```typescript
interface UrlVisit {
    id: string;
    url: string;
    domain: string;
    title?: string;
    startTime: number; // timestamp (ms)
    endTime?: number; // timestamp (ms)
    duration: number; // milliseconds
    tabId: number;
    windowId: number;
    isActive: boolean; // was tab focused
    navigationSource: {
        type:
            | "typed"
            | "link"
            | "reload"
            | "back_forward"
            | "auto_bookmark"
            | "generated";
        sourceUrl?: string;
        sourceTabId?: number;
    };
    category: "work" | "social" | "other";
    categoryConfidence?: number; // 0-1
}

interface TabSession {
    tabId: number;
    windowId: number;
    openedAt: number;
    closedAt?: number;
    totalActiveTime: number;
    urlVisits: UrlVisit[];
    displayNumber?: number; // For UI display
}

interface BrowsingSession {
    date: string; // 'YYYY-MM-DD'
    startTime: number;
    endTime: number;
    totalActiveTime: number;
    tabSessions: TabSession[];
    stats: {
        totalUrls: number;
        uniqueDomains: number;
        workTime: number;
        socialTime: number;
        otherTime: number;
    };
}
```

## Category Classification

URLs are automatically categorized as:

-   **Work**: GitHub, Google Docs, Slack, Stack Overflow, AWS, etc.
-   **Social**: YouTube, Netflix, Facebook, Twitter, Reddit, etc.
-   **Other**: Everything else

Classification is based on domain patterns and URL keywords with confidence scores.

## Real-Time Tracking

The background script maintains:

-   `currentActiveTab` - Currently focused tab with start time
-   `currentUrlVisits` - Map of active URL visits per tab
-   `isUserIdle` - Whether user is idle (30+ seconds)

Active time is only recorded when:

1. Tab is focused AND
2. Window has focus AND
3. User is not idle

## Data Storage

All data is stored in `chrome.storage.local` with keys like `session_2024-01-15`.

Sessions are automatically created daily and stats are calculated in real-time.

## Component Integration

Components use React hooks to access real data:

```typescript
// For stats display
const { stats, totalActiveTime, loading, error } = useStatsData();

// For timeline visualization
const { timeline, loading, error } = useTimelineData();
```

Data refreshes automatically every second to show real-time updates.

## Permissions Required

The manifest includes:

-   `tabs` - Tab lifecycle and info
-   `storage` - Data persistence
-   `activeTab` - Current tab access
-   `webNavigation` - Navigation events
-   `idle` - Idle state detection
-   `windows` - Window focus events
