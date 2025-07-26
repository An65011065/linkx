// src/components/FlowModal.tsx
import React, { useState, useEffect } from "react";
import { Plus, X, Check, RefreshCw } from "lucide-react";
import { useCalendarData, CalendarEvent, AuthUser } from "./CalendarDataProvider";

interface Task {
    id: string;
    title: string;
    completed: boolean;
    createdAt: number;
    dueDate: "yesterday" | "today" | "tomorrow";
}

const FlowModal: React.FC<{
    onClose: () => void;
}> = ({ onClose }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [currentView, setCurrentView] = useState<
        "yesterday" | "today" | "tomorrow"
    >("today");
    const { user, calendarEvents, isLoading: isLoadingEvents, error, loadCalendarEvents } = useCalendarData();
    const [selectedTime, setSelectedTime] = useState("");
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        loadTasks();
    }, []);

    // Debug logging for FlowModal data
    useEffect(() => {
        console.log('🔥 FlowModal data update:', {
            user: user ? user.email : 'none',
            userHasAccessToken: user ? !!user.accessToken : false,
            calendarEventsCount: calendarEvents.length,
            isLoadingEvents,
            currentView
        });
    }, [user, calendarEvents, isLoadingEvents, currentView]);

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

    const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const input = e.target.value;
        const currentValue = selectedTime;

        if (input.length < currentValue.length) {
            setSelectedTime("");
            return;
        }

        if (
            input.toLowerCase().includes("a") &&
            !currentValue.includes("AM") &&
            !currentValue.includes("PM")
        ) {
            const timeOnly = currentValue.replace(/[AP]M/g, "").trim();
            setSelectedTime(`${timeOnly} AM`.trim());
            return;
        }

        if (
            input.toLowerCase().includes("p") &&
            !currentValue.includes("AM") &&
            !currentValue.includes("PM")
        ) {
            const timeOnly = currentValue.replace(/[AP]M/g, "").trim();
            setSelectedTime(`${timeOnly} PM`.trim());
            return;
        }

        if (
            (input.toLowerCase().includes("a") ||
                input.toLowerCase().includes("p")) &&
            (currentValue.includes("AM") || currentValue.includes("PM"))
        ) {
            const timeOnly = currentValue.replace(/[AP]M/g, "").trim();
            const newPeriod = input.toLowerCase().includes("p") ? "PM" : "AM";
            setSelectedTime(`${timeOnly} ${newPeriod}`.trim());
            return;
        }

        const digits = input.replace(/[^\d]/g, "");

        if (digits === "") {
            setSelectedTime("");
            return;
        }

        let formattedTime = "";

        if (digits.length === 1) {
            formattedTime = digits;
        } else if (digits.length === 2) {
            formattedTime = digits;
        } else if (digits.length === 3) {
            formattedTime = `${digits[0]}:${digits.slice(1)}`;
        } else if (digits.length >= 4) {
            formattedTime = `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
        }

        setSelectedTime(formattedTime);
    };

    const saveTasks = async (updatedTasks: Task[]) => {
        try {
            await chrome.storage.local.set({
                flowTasks: JSON.stringify(updatedTasks),
            });
        } catch (error) {
            console.error("Error saving tasks:", error);
        }
    };

    const addTask = async () => {
        if (!newTaskTitle.trim()) return;

        if (user?.accessToken && currentView !== "yesterday") {
            try {
                await createCalendarEvent(newTaskTitle.trim());
                setNewTaskTitle("");
                setSelectedTime("");
                await loadCalendarEvents(true); // Force refresh to get newly created event
            } catch (error) {
                console.error("❌ Failed to create calendar event:", error);
                await createLocalTask();
            }
        } else {
            await createLocalTask();
        }
    };

    const createCalendarEvent = async (title: string) => {
        if (!user?.accessToken) throw new Error("No access token");

        const now = new Date();
        const eventDate = new Date();

        if (currentView === "tomorrow") {
            eventDate.setDate(now.getDate() + 1);
        }

        const timeToUse = selectedTime || "9:00 AM";
        const timeMatch = timeToUse.match(/^(\d{1,2}):?(\d{0,2})\s*(AM|PM)?$/i);

        let hours = 9;
        let minutes = 0;

        if (timeMatch) {
            hours = parseInt(timeMatch[1]) || 9;
            minutes = parseInt(timeMatch[2]) || 0;
            const period =
                timeMatch[3]?.toUpperCase() || (hours < 8 ? "PM" : "AM");

            if (period === "PM" && hours !== 12) {
                hours += 12;
            } else if (period === "AM" && hours === 12) {
                hours = 0;
            }
        }

        eventDate.setHours(hours, minutes, 0, 0);

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
        setSelectedTime("");
        await saveTasks(updatedTasks);
    };

    const toggleTask = async (taskId: string) => {
        const updatedTasks = tasks.map((task) =>
            task.id === taskId ? { ...task, completed: !task.completed } : task,
        );
        setTasks(updatedTasks);
        await saveTasks(updatedTasks);
    };

    const toggleCalendarEvent = async (eventId: string) => {
        try {
            const result = await chrome.storage.local.get([
                "calendarEventStates",
            ]);
            const eventStates = result.calendarEventStates
                ? JSON.parse(result.calendarEventStates)
                : {};

            // Toggle the event state
            eventStates[eventId] = !eventStates[eventId];

            await chrome.storage.local.set({
                calendarEventStates: JSON.stringify(eventStates),
            });

            // Refresh calendar events to reflect the change
            await loadCalendarEvents(true); // Force refresh after state change
        } catch (error) {
            console.error("Error storing event state:", error);
        }
    };

    const deleteTask = async (
        taskId: string,
        isCalendarEvent: boolean = false,
    ) => {
        if (isCalendarEvent && user?.accessToken) {
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
                
                // Clean up event state
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

                // Refresh calendar events
                await loadCalendarEvents(true); // Force refresh after deletion
            } catch (error) {
                console.error("❌ Error deleting calendar event:", error);
                return;
            }
        } else {
            const updatedTasks = tasks.filter((task) => task.id !== taskId);
            setTasks(updatedTasks);
            await saveTasks(updatedTasks);
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

    const formatEventTime = (date: Date) => {
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    // Check if an event has passed
    const isEventPast = (eventStart: Date) => {
        return eventStart < new Date();
    };

    const getItemsToDisplay = () => {
        if (user && currentView !== "yesterday") {
            const now = new Date();
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);

            console.log('🔥 FlowModal filtering calendar events:', {
                totalEvents: calendarEvents.length,
                currentView,
                todayStr: now.toDateString(),
                tomorrowStr: tomorrow.toDateString(),
                yesterdayStr: yesterday.toDateString()
            });

            const filteredEvents = calendarEvents.filter((event) => {
                const eventDateStr = event.start.toDateString();
                console.log('🔥 Checking event:', event.title, 'date:', eventDateStr);
                
                if (currentView === "today") {
                    const matches = eventDateStr === now.toDateString();
                    console.log('🔥 Today match:', matches);
                    return matches;
                } else if (currentView === "tomorrow") {
                    const matches = eventDateStr === tomorrow.toDateString();
                    console.log('🔥 Tomorrow match:', matches);
                    return matches;
                } else if (currentView === "yesterday") {
                    const matches = eventDateStr === yesterday.toDateString();
                    console.log('🔥 Yesterday match:', matches);
                    return matches;
                }
                return false;
            });

            console.log('🔥 Filtered events for', currentView, ':', filteredEvents.length);
            return filteredEvents;
        } else {
            const tasks = getTasksForView();
            console.log('🔥 Using local tasks:', tasks.length);
            return tasks;
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        e.stopPropagation();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        setNewTaskTitle(e.target.value);
    };

    const handleAddKeyPress = (e: React.KeyboardEvent) => {
        e.stopPropagation();
        if (e.key === "Enter") {
            addTask();
        }
    };

    const currentTasks = getItemsToDisplay();

    // Get today's tasks/events for minimized view
    const getTodayItems = () => {
        if (user) {
            const now = new Date();
            return calendarEvents.filter(
                (event) => event.start.toDateString() === now.toDateString(),
            );
        } else {
            return tasks.filter((task) => task.dueDate === "today");
        }
    };

    const todayItems = getTodayItems();

    return (
        <div className="flow-container" onKeyDown={handleKeyDown}>
            <div
                className="flow-header"
                onClick={() => setIsMinimized(!isMinimized)}
            >
                <div className="flow-header-left">
                    <h1 className="flow-title">What's next</h1>
                    {isMinimized && todayItems.length > 0 && (
                        <div className="flow-header-preview">
                            {todayItems.slice(0, 4).map((item, index) => (
                                <span key={item.id} className="preview-item">
                                    {user
                                        ? formatEventTime(
                                              (item as CalendarEvent).start,
                                          )
                                        : "•"}{" "}
                                    {item.title}
                                    {index <
                                        Math.min(todayItems.length, 4) - 1 &&
                                        ", "}
                                </span>
                            ))}
                            {todayItems.length > 4 && (
                                <span className="more-items">
                                    +{todayItems.length - 4} more
                                </span>
                            )}
                        </div>
                    )}
                </div>
                <div className="flow-header-right">
                    <button
                        className="flow-minimize-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMinimized(!isMinimized);
                        }}
                        title={isMinimized ? "Expand" : "Minimize"}
                    >
                        {isMinimized ? "↕" : "−"}
                    </button>
                    <button
                        className="flow-close-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                    >
                        <X size={12} />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <div className="flow-main-container">
                    <div className="flow-view-selector">
                        <button
                            className={`view-btn ${
                                currentView === "yesterday" ? "active" : ""
                            }`}
                            onClick={() => setCurrentView("yesterday")}
                        >
                            Yesterday
                        </button>
                        <button
                            className={`view-btn ${
                                currentView === "today" ? "active" : ""
                            }`}
                            onClick={() => setCurrentView("today")}
                        >
                            Today
                        </button>
                        <button
                            className={`view-btn ${
                                currentView === "tomorrow" ? "active" : ""
                            }`}
                            onClick={() => setCurrentView("tomorrow")}
                        >
                            Tomorrow
                        </button>
                    </div>

                    {isLoadingEvents && (
                        <div className="flow-loading">
                            <RefreshCw size={14} className="spinning" />
                            <span>Loading events...</span>
                        </div>
                    )}

                    {!isLoadingEvents && currentTasks.length === 0 && (
                        <div className="flow-empty">
                            <p>
                                {error ? `Calendar error: ${error}` :
                                    user && currentView !== "yesterday" 
                                        ? `No events on your Google Calendar for ${currentView}`
                                        : `No tasks for ${currentView}`}
                            </p>
                            {error && (
                                <button
                                    onClick={() => loadCalendarEvents(true)}
                                    className="flow-retry-btn"
                                    style={{
                                        marginTop: '8px',
                                        padding: '4px 8px',
                                        fontSize: '11px',
                                        background: 'rgba(218, 165, 32, 0.15)',
                                        border: 'none',
                                        borderRadius: '4px',
                                        color: 'rgba(160, 82, 45, 0.8)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Retry
                                </button>
                            )}
                        </div>
                    )}

                    {!isLoadingEvents &&
                        currentTasks.map((item) => (
                            <div
                                key={item.id}
                                className={`flow-item ${
                                    (item as Task).completed ||
                                    (item as CalendarEvent).completed
                                        ? "completed"
                                        : ""
                                }`}
                            >
                                {user && currentView !== "yesterday" ? (
                                    // Calendar Event
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
                                                (item as CalendarEvent).start,
                                            )}
                                        </div>
                                        <span
                                            className={`task-title ${
                                                (item as CalendarEvent)
                                                    .completed
                                                    ? "completed"
                                                    : ""
                                            } ${isEventPast((item as CalendarEvent).start) ? "opacity-60" : ""}`}
                                            style={{
                                                textDecoration: isEventPast((item as CalendarEvent).start) ? "line-through" : "none"
                                            }}
                                        >
                                            {item.title}
                                        </span>
                                        <button
                                            className="task-delete-btn"
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
                                            onClick={() => toggleTask(item.id)}
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

                    <div className="flow-add">
                        <Plus size={12} className="flow-add-icon" />
                        <input
                            type="text"
                            placeholder={`Add ${
                                user && currentView !== "yesterday"
                                    ? "event"
                                    : "task"
                            } for ${currentView}...`}
                            value={newTaskTitle}
                            onChange={handleInputChange}
                            onKeyPress={handleAddKeyPress}
                            className="flow-add-input"
                            autoFocus
                        />
                        {user && currentView !== "yesterday" && (
                            <input
                                type="text"
                                value={selectedTime}
                                onChange={handleTimeInputChange}
                                onKeyPress={handleAddKeyPress}
                                placeholder="9:00 AM"
                                className="flow-time-input"
                                maxLength={8}
                            />
                        )}
                    </div>
                </div>
            )}

            <style>{`
            .flow-container {
                position: fixed;
                top: 60px;
                right: 20px;
                z-index: 10000000;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
                width: 320px;
                pointer-events: auto;
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
                margin-bottom: 2px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .flow-header:hover {
                background: rgba(255, 251, 235, 1);
            }

            .flow-header-left {
                flex: 1;
                min-width: 0;
            }

            .flow-title {
                margin: 0;
                font-size: 14px;
                font-weight: 600;
                color: rgba(101, 67, 33, 0.95);
            }

            .flow-header-preview {
                margin-top: 4px;
                font-size: 11px;
                color: rgba(160, 82, 45, 0.7);
                line-height: 1.3;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .preview-item {
                display: inline;
            }

            .more-items {
                color: rgba(160, 82, 45, 0.5);
                font-style: italic;
            }

            .flow-header-right {
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .flow-minimize-btn,
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
                font-size: 12px;
                font-weight: bold;
            }

            .flow-minimize-btn:hover,
            .flow-close-btn:hover {
                background: rgba(218, 165, 32, 0.25);
                color: rgba(160, 82, 45, 1);
                transform: scale(1.1);
            }

            .flow-main-container {
                background: rgba(255, 251, 235, 0.98);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(205, 133, 63, 0.35);
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(160, 82, 45, 0.15);
                max-height: 400px;
                overflow-y: auto;
            }

            .flow-view-selector {
                display: flex;
                background: rgba(218, 165, 32, 0.08);
                border-bottom: 1px solid rgba(205, 133, 63, 0.1);
                padding: 8px;
                gap: 4px;
            }

            .view-btn {
                flex: 1;
                padding: 6px 12px;
                border: none;
                border-radius: 6px;
                background: transparent;
                color: rgba(160, 82, 45, 0.7);
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .view-btn:hover {
                background: rgba(218, 165, 32, 0.15);
                color: rgba(160, 82, 45, 0.9);
            }

            .view-btn.active {
                background: rgba(218, 165, 32, 0.25);
                color: rgba(101, 67, 33, 0.95);
                box-shadow: 0 2px 4px rgba(160, 82, 45, 0.1);
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

            .spinning {
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .flow-empty {
                text-align: center;
                padding: 20px;
                color: rgba(160, 82, 45, 0.5);
                font-size: 13px;
                font-style: italic;
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

            .check-icon {
                opacity: 0;
                transition: opacity 0.2s ease;
            }

            .flow-item.completed .task-check .check-icon {
                opacity: 1;
                color: rgba(34, 197, 94, 0.9);
            }

            .flow-item.completed .task-check {
                background: rgba(34, 197, 94, 0.1);
                border-color: rgba(34, 197, 94, 0.5);
            }

            .event-time {
                font-size: 11px;
                color: rgba(160, 82, 45, 0.8);
                font-weight: 600;
                min-width: 60px;
                flex-shrink: 0;
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

            .flow-add-input:focus {
                outline: none;
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
                outline: none;
            }

            .flow-time-input::placeholder {
                color: rgba(160, 82, 45, 0.5);
            }
        `}</style>
        </div>
    );
};

export default FlowModal;