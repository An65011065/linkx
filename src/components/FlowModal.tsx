import React, { useState, useEffect } from "react";
import {
    Plus,
    X,
    Check,
    Calendar,
    MapPin,
    RefreshCw,
    LogOut,
    Minimize,
} from "lucide-react";

interface Task {
    id: string;
    title: string;
    completed: boolean;
    createdAt: number;
    completedAt?: number;
    dueDate: "today" | "tomorrow" | "later";
}

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    location?: string;
    description?: string;
    attendees?: string[];
    completed?: boolean; // Add completed state for calendar events too
}

interface AuthUser {
    id: string;
    email: string;
    name: string;
    picture?: string;
    accessToken: string;
}

interface FlowCascadeProps {
    isVisible: boolean;
    onClose: () => void;
    user: AuthUser | null;
    onSignOut: () => void;
}

const FlowModal: React.FC<FlowCascadeProps> = ({
    isVisible,
    onClose,
    user,
    onSignOut,
}) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [currentView, setCurrentView] = useState<
        "today" | "tomorrow" | "later"
    >("today");
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);
    const [selectedTime, setSelectedTime] = useState("9:00 AM");
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        if (isVisible) {
            loadTasks();
            if (user) {
                loadCalendarEvents();
            }
        }
    }, [isVisible, user]);

    const loadTasks = async () => {
        try {
            const result = await chrome.storage.local.get(["flowTasks"]);
            const savedTasks = result.flowTasks
                ? JSON.parse(result.flowTasks)
                : [];
            setTasks(savedTasks);
        } catch (error) {
            console.error("Error loading tasks:", error);
            setTasks([]);
        }
    };

    const loadCalendarEvents = async () => {
        if (!user?.accessToken) return;

        setIsLoadingEvents(true);
        try {
            const now = new Date();
            const startOfToday = new Date(now);
            startOfToday.setHours(0, 0, 0, 0);
            const endOfTomorrow = new Date(now);
            endOfTomorrow.setDate(endOfTomorrow.getDate() + 2);
            endOfTomorrow.setHours(23, 59, 59, 999);

            const url =
                `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
                new URLSearchParams({
                    timeMin: startOfToday.toISOString(),
                    timeMax: endOfTomorrow.toISOString(),
                    singleEvents: "true",
                    orderBy: "startTime",
                    maxResults: "50",
                });

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${user.accessToken}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok)
                throw new Error(`Calendar API error: ${response.status}`);

            const data = await response.json();

            // Load completion states from storage
            const result = await chrome.storage.local.get([
                "calendarEventStates",
            ]);
            const eventStates = result.calendarEventStates
                ? JSON.parse(result.calendarEventStates)
                : {};

            const events: CalendarEvent[] =
                data.items?.map((item: any) => ({
                    id: item.id,
                    title: item.summary || "No title",
                    start: new Date(item.start.dateTime || item.start.date),
                    end: new Date(item.end.dateTime || item.end.date),
                    location: item.location,
                    description: item.description,
                    attendees:
                        item.attendees?.map(
                            (attendee: any) => attendee.email,
                        ) || [],
                    completed: eventStates[item.id] || false, // Load completion state
                })) || [];

            setCalendarEvents(events);
        } catch (error) {
            console.error("Failed to load calendar events:", error);
            setCalendarEvents([]);
        } finally {
            setIsLoadingEvents(false);
        }
    };

    const addTask = async () => {
        if (!newTaskTitle.trim()) return;

        if (user?.accessToken && currentView !== "later") {
            // Create calendar event
            try {
                await createCalendarEvent(newTaskTitle.trim());
                setNewTaskTitle("");
                // Refresh calendar events to show the new event
                await loadCalendarEvents();
            } catch (error) {
                console.error("❌ Failed to create calendar event:", error);
                // Fallback to local task if calendar creation fails
                await createLocalTask();
            }
        } else {
            // Create local task
            await createLocalTask();
        }
    };

    const createLocalTask = async () => {
        const newTask: Task = {
            id: `task_${Date.now()}`,
            title: newTaskTitle.trim(),
            completed: false,
            createdAt: Date.now(),
            dueDate: currentView,
        };

        const updatedTasks = [newTask, ...tasks];
        setTasks(updatedTasks);
        setNewTaskTitle("");

        try {
            await chrome.storage.local.set({
                flowTasks: JSON.stringify(updatedTasks),
            });
        } catch (error) {
            console.error("Error saving task:", error);
        }
    };

    const createCalendarEvent = async (title: string) => {
        if (!user?.accessToken) throw new Error("No access token");

        // Calculate event date and time
        const now = new Date();
        let eventDate = new Date();

        if (currentView === "tomorrow") {
            eventDate.setDate(now.getDate() + 1);
        }

        // Parse selected time
        const timeMatch = selectedTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (!timeMatch) {
            throw new Error("Invalid time format");
        }

        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const period = timeMatch[3].toUpperCase();

        // Convert to 24-hour format
        if (period === "PM" && hours !== 12) {
            hours += 12;
        } else if (period === "AM" && hours === 12) {
            hours = 0;
        }

        eventDate.setHours(hours, minutes, 0, 0);

        // Create end time (1 hour duration)
        const endTime = new Date(eventDate);
        endTime.setHours(hours + 1, minutes, 0, 0);

        const eventData = {
            summary: title,
            description: `Task created from Flow`,
            start: {
                dateTime: eventDate.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            end: {
                dateTime: endTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
        };

        const response = await fetch(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${user.accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(eventData),
            },
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Calendar API error:", errorText);
            throw new Error(
                `Failed to create calendar event: ${response.status}`,
            );
        }

        const event = await response.json();
        console.log("✅ Calendar event created:", event.summary);
    };

    const deleteTask = async (
        taskId: string,
        isCalendarEvent: boolean = false,
    ) => {
        if (isCalendarEvent && user?.accessToken) {
            // Delete from Google Calendar
            try {
                const response = await fetch(
                    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${taskId}`,
                    {
                        method: "DELETE",
                        headers: {
                            Authorization: `Bearer ${user.accessToken}`,
                            "Content-Type": "application/json",
                        },
                    },
                );

                if (!response.ok) {
                    console.error(
                        "❌ Failed to delete calendar event:",
                        response.status,
                    );
                    throw new Error(
                        `Failed to delete calendar event: ${response.status}`,
                    );
                }

                console.log("✅ Calendar event deleted:", taskId);

                // Remove from local state
                setCalendarEvents((prev) =>
                    prev.filter((event) => event.id !== taskId),
                );

                // Also remove from stored states
                const result = await chrome.storage.local.get([
                    "calendarEventStates",
                ]);
                const eventStates = result.calendarEventStates
                    ? JSON.parse(result.calendarEventStates)
                    : {};
                delete eventStates[taskId];
                await chrome.storage.local.set({
                    calendarEventStates: JSON.stringify(eventStates),
                });
            } catch (error) {
                console.error("❌ Error deleting calendar event:", error);
                return;
            }
        } else {
            // Delete local task
            const updatedTasks = tasks.filter((task) => task.id !== taskId);
            setTasks(updatedTasks);

            try {
                await chrome.storage.local.set({
                    flowTasks: JSON.stringify(updatedTasks),
                });
            } catch (error) {
                console.error("Error deleting task:", error);
            }
        }
    };

    const toggleTask = async (taskId: string) => {
        // Toggle completion state for local tasks
        const updatedTasks = tasks.map((task) =>
            task.id === taskId
                ? {
                      ...task,
                      completed: !task.completed,
                      completedAt: !task.completed ? Date.now() : undefined,
                  }
                : task,
        );

        setTasks(updatedTasks);
        try {
            await chrome.storage.local.set({
                flowTasks: JSON.stringify(updatedTasks),
            });
        } catch (error) {
            console.error("Error updating task:", error);
        }
    };

    const toggleCalendarEvent = async (eventId: string) => {
        // Toggle completion state for calendar events (locally stored)
        const updatedEvents = calendarEvents.map((event) =>
            event.id === eventId
                ? { ...event, completed: !event.completed }
                : event,
        );

        setCalendarEvents(updatedEvents);

        // Store completion states locally
        try {
            const result = await chrome.storage.local.get([
                "calendarEventStates",
            ]);
            const eventStates = result.calendarEventStates
                ? JSON.parse(result.calendarEventStates)
                : {};

            const event = updatedEvents.find((e) => e.id === eventId);
            if (event) {
                eventStates[eventId] = event.completed;
            }

            await chrome.storage.local.set({
                calendarEventStates: JSON.stringify(eventStates),
            });
        } catch (error) {
            console.error("Error storing event state:", error);
        }
    };

    const getTasksForView = () => {
        return tasks
            .filter((task) => task.dueDate === currentView)
            .sort((a, b) => {
                if (a.completed === b.completed) {
                    return b.createdAt - a.createdAt;
                }
                return a.completed ? 1 : -1;
            });
    };

    const getCalendarEventsForView = () => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return calendarEvents.filter((event) => {
            if (currentView === "today") {
                return event.start.toDateString() === now.toDateString();
            } else if (currentView === "tomorrow") {
                return event.start.toDateString() === tomorrow.toDateString();
            }
            return false;
        });
    };

    const formatEventTime = (date: Date) => {
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    // Get all items to display
    const getItemsToDisplay = () => {
        if (user && currentView !== "later") {
            return getCalendarEventsForView();
        } else {
            return getTasksForView();
        }
    };

    // Get task counts - should include both tasks and calendar events
    const getTaskCounts = () => {
        if (user && currentView !== "later") {
            // For calendar events
            const currentEvents = getCalendarEventsForView();
            const completed = currentEvents.filter(
                (event) => event.completed,
            ).length;
            const total = currentEvents.length;
            const remaining = total - completed;
            return { completed, total, remaining };
        } else {
            // For local tasks
            const currentTasks = getTasksForView();
            const completed = currentTasks.filter(
                (task) => task.completed,
            ).length;
            const total = currentTasks.length;
            const remaining = total - completed;
            return { completed, total, remaining };
        }
    };

    const items = getItemsToDisplay();

    if (!isVisible) return null;

    return (
        <div className="flow-container">
            {isMinimized ? (
                // Minimized State
                <div
                    className="flow-minimized"
                    onClick={() => setIsMinimized(false)}
                >
                    <div className="minimized-icon">
                        <Calendar size={14} />
                    </div>
                    <span className="minimized-label">What's next</span>
                </div>
            ) : (
                // Full State
                <>
                    {/* Header - appears immediately */}
                    <div className="flow-header">
                        <div className="flow-header-left">
                            <h1 className="flow-title">What's next</h1>
                        </div>
                        <div className="flow-header-right">
                            <button
                                className="flow-action-btn"
                                onClick={onSignOut}
                                title={
                                    user ? "Sign out" : "Sign in with Google"
                                }
                            >
                                <LogOut size={12} />
                            </button>
                            <button
                                className="flow-action-btn"
                                onClick={() => setIsMinimized(true)}
                                title="Minimize"
                            >
                                <Minimize size={12} />
                            </button>
                            <button
                                className="flow-close-btn"
                                onClick={onClose}
                            >
                                <X size={12} />
                            </button>
                        </div>
                    </div>

                    {/* Main container - falls down */}
                    <div className="flow-main-container">
                        {/* Loading State */}
                        {isLoadingEvents && (
                            <div className="flow-loading">
                                <RefreshCw size={14} className="spinning" />
                                <span>Loading events...</span>
                            </div>
                        )}

                        {/* Items */}
                        {!isLoadingEvents &&
                            items.map((item, index) => (
                                <div
                                    key={item.id}
                                    className={`flow-item ${
                                        (item as Task).completed ||
                                        (item as CalendarEvent).completed
                                            ? "completed"
                                            : ""
                                    }`}
                                >
                                    {user && currentView !== "later" ? (
                                        // Calendar Event - simpler layout
                                        <>
                                            <button
                                                className="task-check"
                                                onClick={() =>
                                                    toggleCalendarEvent(item.id)
                                                }
                                            >
                                                <Check
                                                    size={10}
                                                    className="check-icon"
                                                />
                                            </button>
                                            <div className="event-time">
                                                {formatEventTime(
                                                    (item as CalendarEvent)
                                                        .start,
                                                )}
                                            </div>
                                            <span
                                                className={`event-title ${
                                                    (item as CalendarEvent)
                                                        .completed
                                                        ? "completed"
                                                        : ""
                                                }`}
                                            >
                                                {item.title}
                                            </span>
                                            <button
                                                className="event-delete-btn"
                                                onClick={() =>
                                                    deleteTask(item.id, true)
                                                }
                                                title="Delete event"
                                            >
                                                <X size={10} />
                                            </button>
                                        </>
                                    ) : (
                                        // Task
                                        <>
                                            <button
                                                className="task-check"
                                                onClick={() =>
                                                    toggleTask(item.id)
                                                }
                                            >
                                                <Check
                                                    size={10}
                                                    className="check-icon"
                                                />
                                            </button>
                                            <span
                                                className={`task-title ${
                                                    (item as Task).completed
                                                        ? "completed"
                                                        : ""
                                                }`}
                                            >
                                                {item.title}
                                            </span>
                                            <button
                                                className="task-delete-btn"
                                                onClick={() =>
                                                    deleteTask(item.id, false)
                                                }
                                                title="Delete task"
                                            >
                                                <X size={10} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            ))}

                        {/* Empty State */}
                        {!isLoadingEvents && items.length === 0 && (
                            <div className="flow-empty">
                                <p>
                                    No{" "}
                                    {user && currentView !== "later"
                                        ? "events"
                                        : "tasks"}{" "}
                                    for {currentView}
                                </p>
                            </div>
                        )}

                        {/* Add Task */}
                        <div className="flow-add">
                            <Plus size={12} className="flow-add-icon" />
                            <input
                                type="text"
                                placeholder={`Add ${
                                    user && currentView !== "later"
                                        ? "event"
                                        : "task"
                                } for ${currentView}...`}
                                value={newTaskTitle}
                                onChange={(e) =>
                                    setNewTaskTitle(e.target.value)
                                }
                                onKeyPress={(e) =>
                                    e.key === "Enter" && addTask()
                                }
                                className="flow-add-input"
                            />
                            {user && currentView !== "later" && (
                                <input
                                    type="text"
                                    value={selectedTime}
                                    onChange={(e) =>
                                        setSelectedTime(e.target.value)
                                    }
                                    placeholder="9:00 AM"
                                    className="flow-time-input"
                                />
                            )}
                        </div>
                    </div>

                    <style>{`
                * {
                    color: inherit !important;
                }

                .flow-container {
                    position: fixed;
                    top: 60px;
                    right: 20px;
                    z-index: 10000000;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
                        system-ui, sans-serif;
                    width: 320px;
                }

                .flow-header {
                    background: rgba(255, 251, 235, 0.98);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(205, 133, 63, 0.35);
                    border-radius: 12px;
                    padding: 12px 16px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    box-shadow: 0 8px 24px rgba(160, 82, 45, 0.15);
                    margin-bottom: 8px;
                }

                .flow-header-left {
                    display: flex;
                    align-items: center;
                }

                .flow-title {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 600;
                    color: rgba(101, 67, 33, 0.95);
                }

                .task-progress {
                    font-size: 11px;
                    color: rgba(160, 82, 45, 0.7);
                    font-weight: 500;
                    background: rgba(218, 165, 32, 0.15);
                    padding: 2px 6px;
                    border-radius: 6px;
                }

                .flow-header-right {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .flow-action-btn,
                .flow-close-btn {
                    width: 24px;
                    height: 24px;
                    background: rgba(218, 165, 32, 0.12);
                    border: none;
                    border-radius: 6px;
                    color: rgba(160, 82, 45, 0.75);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }

                .flow-action-btn:hover,
                .flow-close-btn:hover {
                    background: rgba(218, 165, 32, 0.25);
                    color: rgba(160, 82, 45, 1);
                    transform: scale(1.1);
                }

                .spinning {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    0% {
                        transform: rotate(0deg);
                    }
                    100% {
                        transform: rotate(360deg);
                    }
                }

                .flow-main-container {
                    background: rgba(255, 251, 235, 0.98);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(205, 133, 63, 0.35);
                    border-radius: 12px;
                    box-shadow: 0 8px 24px rgba(160, 82, 45, 0.15);
                    animation: dropDown 0.2s ease-out;
                    max-height: 400px;
                    overflow-y: auto;
                }

                @keyframes dropDown {
                    0% {
                        opacity: 0;
                        transform: translateY(-8px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .flow-loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 20px;
                    color: rgba(160, 82, 45, 0.7);
                    font-size: 13px;
                }

                .flow-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 16px;
                    border-bottom: 1px solid rgba(205, 133, 63, 0.1);
                    transition: background-color 0.2s ease;
                }

                .flow-item:hover {
                    background: rgba(218, 165, 32, 0.08);
                }

                .flow-item:last-of-type {
                    border-bottom: none;
                }

                /* Event Styles - simplified layout */
                .event-time {
                    font-size: 11px;
                    color: rgba(160, 82, 45, 0.8);
                    font-weight: 600;
                    min-width: 60px;
                    flex-shrink: 0;
                }

                .event-title {
                    flex: 1;
                    font-size: 13px;
                    font-weight: 500;
                    color: rgba(101, 67, 33, 0.95);
                    line-height: 1.4;
                    transition: all 0.3s ease;
                }

                .event-title.completed {
                    text-decoration: line-through;
                    color: rgba(160, 82, 45, 0.5);
                    animation: strikeThrough 0.3s ease-out;
                }

                .event-delete-btn {
                    width: 20px;
                    height: 20px;
                    background: rgba(239, 68, 68, 0.1);
                    border: none;
                    border-radius: 6px;
                    color: rgba(239, 68, 68, 0.7);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    opacity: 0;
                    flex-shrink: 0;
                }

                .flow-item:hover .event-delete-btn {
                    opacity: 1;
                }

                .event-delete-btn:hover {
                    background: rgba(239, 68, 68, 0.2);
                    color: rgba(239, 68, 68, 1);
                }

                /* Task Styles */
                .task-check {
                    width: 16px;
                    height: 16px;
                    background: none;
                    border: 1.5px solid rgba(205, 133, 63, 0.4);
                    border-radius: 4px;
                    color: rgba(160, 82, 45, 0.6);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    flex-shrink: 0;
                }

                .task-check:hover {
                    border-color: rgba(205, 133, 63, 0.6);
                    background: rgba(218, 165, 32, 0.1);
                }

                .flow-item.completed .task-check .check-icon {
                    opacity: 1;
                }

                .task-title {
                    flex: 1;
                    font-size: 13px;
                    color: rgba(101, 67, 33, 0.95);
                    font-weight: 500;
                    line-height: 1.4;
                    transition: all 0.3s ease;
                }

                .task-title.completed {
                    text-decoration: line-through;
                    color: rgba(160, 82, 45, 0.5);
                    animation: strikeThrough 0.3s ease-out;
                }

                @keyframes strikeThrough {
                    0% {
                        text-decoration: none;
                        color: rgba(101, 67, 33, 0.95);
                    }
                    100% {
                        text-decoration: line-through;
                        color: rgba(160, 82, 45, 0.5);
                    }
                }

                .task-delete-btn {
                    width: 20px;
                    height: 20px;
                    background: rgba(239, 68, 68, 0.1);
                    border: none;
                    border-radius: 6px;
                    color: rgba(239, 68, 68, 0.7);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    opacity: 0;
                    flex-shrink: 0;
                }

                .flow-item:hover .task-delete-btn {
                    opacity: 1;
                }

                .task-delete-btn:hover {
                    background: rgba(239, 68, 68, 0.2);
                    color: rgba(239, 68, 68, 1);
                }

                .flow-empty {
                    text-align: center;
                    padding: 20px;
                    color: rgba(160, 82, 45, 0.5);
                    font-size: 13px;
                    font-style: italic;
                }

                .flow-empty p {
                    margin: 0;
                }

                .flow-add {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 16px;
                    background: rgba(255, 248, 220, 0.6);
                    border-top: 1px solid rgba(205, 133, 63, 0.1);
                    transition: all 0.2s ease;
                }

                .flow-add:focus-within {
                    background: rgba(255, 248, 220, 0.8);
                }

                .flow-add-icon {
                    color: rgba(160, 82, 45, 0.6);
                    flex-shrink: 0;
                }

                .flow-add-input {
                    flex: 1;
                    border: none;
                    outline: none;
                    background: none;
                    font-size: 13px;
                    color: rgba(101, 67, 33, 1);
                    font-weight: 500;
                }

                .flow-add-input::placeholder {
                    color: rgba(160, 82, 45, 0.5);
                }

                .flow-time-input {
                    border: none;
                    outline: none;
                    background: rgba(218, 165, 32, 0.15);
                    color: rgba(101, 67, 33, 0.9);
                    font-size: 10px;
                    font-weight: 600;
                    padding: 4px 6px;
                    border-radius: 6px;
                    cursor: text;
                    transition: all 0.2s ease;
                    width: 60px;
                    font-family: inherit;
                    text-align: center;
                    flex-shrink: 0;
                }

                .flow-time-input:hover {
                    background: rgba(218, 165, 32, 0.25);
                }

                .flow-time-input:focus {
                    background: rgba(218, 165, 32, 0.25);
                }

                .flow-time-input::placeholder {
                    color: rgba(160, 82, 45, 0.5);
                }

                /* Scrollbar */
                .flow-main-container::-webkit-scrollbar {
                    width: 3px;
                }

                .flow-main-container::-webkit-scrollbar-track {
                    background: transparent;
                }

                .flow-main-container::-webkit-scrollbar-thumb {
                    background: rgba(205, 133, 63, 0.4);
                    border-radius: 2px;
                }

                .flow-main-container::-webkit-scrollbar-thumb:hover {
                    background: rgba(205, 133, 63, 0.6);
                }

                /* Minimized State */
                .flow-minimized {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(255, 251, 235, 0.98);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(205, 133, 63, 0.35);
                    border-radius: 20px;
                    padding: 8px 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 8px 24px rgba(160, 82, 45, 0.15);
                    width: fit-content;
                }

                .flow-minimized:hover {
                    transform: scale(1.02);
                    border-color: rgba(205, 133, 63, 0.5);
                    box-shadow: 0 12px 32px rgba(160, 82, 45, 0.2);
                }

                .minimized-icon {
                    color: rgba(160, 82, 45, 0.85);
                }

                .minimized-label {
                    color: rgba(101, 67, 33, 0.95);
                    font-size: 12px;
                    font-weight: 600;
                    white-space: nowrap;
                }
            `}</style>
                </>
            )}
        </div>
    );
};

export default FlowModal;
