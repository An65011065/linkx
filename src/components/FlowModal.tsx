import React, { useState, useEffect } from "react";
import { Plus, X, Check, Calendar, LogOut, RefreshCw } from "lucide-react";

interface Task {
    id: string;
    title: string;
    completed: boolean;
    createdAt: number;
    dueDate: "yesterday" | "today" | "tomorrow";
}

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    location?: string;
    description?: string;
    attendees?: string[];
    completed?: boolean;
}

interface AuthUser {
    id: string;
    email: string;
    name: string;
    picture?: string;
    accessToken: string;
}

interface AuthMessage {
    type: string;
    success?: boolean;
    user?: AuthUser;
    error?: string;
}

interface FlowMessage {
    type: string;
    user?: AuthUser;
}

interface FlowContainerProps {
    isVisible: boolean;
    onClose: () => void;
}

interface LoginScreenProps {
    onGoogleLogin: () => Promise<void>;
    onContinueWithoutSignin: () => void;
    isLoading?: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
    onGoogleLogin,
    onContinueWithoutSignin,
    isLoading = false,
}) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
        setSelectedOption("google");
        try {
            await onGoogleLogin();
        } catch (error) {
            setSelectedOption(null);
            console.error("Login failed:", error);
        }
    };

    const handleContinueWithout = () => {
        setSelectedOption("continue");
        onContinueWithoutSignin();
    };

    return (
        <div className="flow-login-modal">
            <div className="flow-login-header">
                <div className="flow-login-icon">
                    <Calendar size={24} />
                </div>
                <h1 className="flow-login-title">Welcome to Flow</h1>
                <p className="flow-login-subtitle">
                    Sync your calendar or start organizing tasks
                </p>
            </div>

            <div className="flow-login-options">
                <button
                    className={`flow-login-option ${
                        selectedOption === "google" ? "loading" : ""
                    }`}
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                >
                    <div className="option-icon-wrapper">
                        <div className="option-icon google">
                            <Calendar size={18} />
                        </div>
                    </div>
                    <div className="option-content">
                        <h3 className="option-title">
                            Connect Google Calendar
                        </h3>
                        <p className="option-description">
                            Sync your events and create calendar-aware tasks
                        </p>
                    </div>
                    <div className="option-arrow">
                        {selectedOption === "google" ? (
                            <div className="loading-spinner" />
                        ) : (
                            <div>→</div>
                        )}
                    </div>
                </button>

                <button
                    className={`flow-login-option ${
                        selectedOption === "continue" ? "loading" : ""
                    }`}
                    onClick={handleContinueWithout}
                    disabled={isLoading}
                >
                    <div className="option-icon-wrapper">
                        <div className="option-icon simple">
                            <Calendar size={18} />
                        </div>
                    </div>
                    <div className="option-content">
                        <h3 className="option-title">
                            Continue Without Syncing
                        </h3>
                        <p className="option-description">
                            Use Flow for local task management only
                        </p>
                    </div>
                    <div className="option-arrow">
                        {selectedOption === "continue" ? (
                            <div className="loading-spinner" />
                        ) : (
                            <div>→</div>
                        )}
                    </div>
                </button>
            </div>

            <div className="flow-login-footer">
                <p className="privacy-note">
                    Your data is stored securely and never shared
                </p>
            </div>

            <style jsx>{`
                .flow-login-modal {
                    position: fixed;
                    top: 60px;
                    right: 20px;
                    width: 420px;
                    max-width: 90vw;
                    background: rgba(255, 251, 235, 0.98);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(205, 133, 63, 0.9);
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 24px 48px rgba(160, 82, 45, 0.15);
                    animation: slideUp 0.4s ease-out;
                    z-index: 10000000;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
                        system-ui, sans-serif;
                    pointer-events: auto;
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                .flow-login-header {
                    text-align: center;
                    padding: 32px 24px 24px;
                    background: rgba(218, 165, 32, 0.08);
                    border-bottom: 1px solid rgba(205, 133, 63, 0.25);
                }

                .flow-login-icon {
                    width: 48px;
                    height: 48px;
                    background: rgba(218, 165, 32, 0.25);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: rgba(160, 82, 45, 0.85);
                    margin: 0 auto 16px;
                }

                .flow-login-title {
                    margin: 0 0 8px;
                    font-size: 24px;
                    font-weight: 700;
                    color: rgba(101, 67, 33, 0.95);
                }

                .flow-login-subtitle {
                    margin: 0;
                    font-size: 15px;
                    color: rgba(160, 82, 45, 0.7);
                    font-weight: 500;
                }

                .flow-login-options {
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .flow-login-option {
                    display: flex;
                    align-items: flex-start;
                    gap: 16px;
                    padding: 20px;
                    background: rgba(255, 248, 220, 0.6);
                    border: 1.5px solid rgba(205, 133, 63, 0.2);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: left;
                    width: 100%;
                }

                .flow-login-option:hover {
                    border-color: rgba(205, 133, 63, 0.35);
                    background: rgba(255, 248, 220, 0.8);
                    transform: translateY(-1px);
                    box-shadow: 0 8px 16px rgba(160, 82, 45, 0.1);
                }

                .option-icon-wrapper {
                    flex-shrink: 0;
                }

                .option-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(218, 165, 32, 0.2);
                    color: rgba(160, 82, 45, 0.85);
                }

                .option-content {
                    flex: 1;
                    min-width: 0;
                }

                .option-title {
                    margin: 0 0 4px;
                    font-size: 16px;
                    font-weight: 600;
                    color: rgba(101, 67, 33, 0.95);
                }

                .option-description {
                    margin: 0;
                    font-size: 14px;
                    color: rgba(160, 82, 45, 0.7);
                    line-height: 1.4;
                }

                .option-arrow {
                    flex-shrink: 0;
                    color: rgba(160, 82, 45, 0.6);
                    margin-top: 2px;
                }

                .loading-spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(218, 165, 32, 0.25);
                    border-top: 2px solid rgba(160, 82, 45, 0.85);
                    border-radius: 50%;
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

                .flow-login-footer {
                    padding: 16px 24px 24px;
                    text-align: center;
                    background: rgba(218, 165, 32, 0.15);
                    border-top: 1px solid rgba(205, 133, 63, 0.25);
                }

                .privacy-note {
                    margin: 0;
                    font-size: 12px;
                    color: rgba(160, 82, 45, 0.7);
                    font-weight: 500;
                }
            `}</style>
        </div>
    );
};

const FlowModal: React.FC<{
    user: AuthUser | null;
    onClose: () => void;
    onSignOut: () => void;
}> = ({ user, onClose, onSignOut }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [currentView, setCurrentView] = useState<
        "yesterday" | "today" | "tomorrow"
    >("today");
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);
    const [selectedTime, setSelectedTime] = useState("");

    useEffect(() => {
        loadTasks();
        if (user) {
            loadCalendarEvents();
        }
    }, [user]);

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
            const startOfYesterday = new Date(now);
            startOfYesterday.setDate(now.getDate() - 1);
            startOfYesterday.setHours(0, 0, 0, 0);
            const endOfTomorrow = new Date(now);
            endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
            endOfTomorrow.setHours(23, 59, 59, 999);

            const url =
                `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
                new URLSearchParams({
                    timeMin: startOfYesterday.toISOString(),
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
                    completed: eventStates[item.id] || false,
                })) || [];

            setCalendarEvents(events);
        } catch (error) {
            console.error("Failed to load calendar events:", error);
            setCalendarEvents([]);
        } finally {
            setIsLoadingEvents(false);
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
                await loadCalendarEvents();
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
        let eventDate = new Date();

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
        const updatedEvents = calendarEvents.map((event) =>
            event.id === eventId
                ? { ...event, completed: !event.completed }
                : event,
        );

        setCalendarEvents(updatedEvents);

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
                setCalendarEvents((prev) =>
                    prev.filter((event) => event.id !== taskId),
                );

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

    const getItemsToDisplay = () => {
        if (user && currentView !== "yesterday") {
            const now = new Date();
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);

            return calendarEvents.filter((event) => {
                if (currentView === "today") {
                    return event.start.toDateString() === now.toDateString();
                } else if (currentView === "tomorrow") {
                    return (
                        event.start.toDateString() === tomorrow.toDateString()
                    );
                } else if (currentView === "yesterday") {
                    return (
                        event.start.toDateString() === yesterday.toDateString()
                    );
                }
                return false;
            });
        } else {
            return getTasksForView();
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

    return (
        <div className="flow-container" onKeyDown={handleKeyDown}>
            <div className="flow-header">
                <div className="flow-header-left">
                    <h1 className="flow-title">What's next</h1>
                </div>
                <div className="flow-header-right">
                    <button
                        className="flow-action-btn"
                        onClick={onSignOut}
                        title="Sign out"
                    >
                        <LogOut size={12} />
                    </button>
                    <button className="flow-close-btn" onClick={onClose}>
                        <X size={12} />
                    </button>
                </div>
            </div>

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
                            No{" "}
                            {user && currentView !== "yesterday"
                                ? "events"
                                : "tasks"}{" "}
                            for {currentView}
                        </p>
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
                                            (item as CalendarEvent).completed
                                                ? "completed"
                                                : ""
                                        }`}
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
                }

                .flow-title {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 600;
                    color: rgba(101, 67, 33, 0.95);
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

const FlowContainer: React.FC<FlowContainerProps> = ({
    isVisible,
    onClose,
}) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [showLoginScreen, setShowLoginScreen] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const messageListener = (
            message: FlowMessage,
            sender: chrome.runtime.MessageSender,
            sendResponse: (response?: any) => void,
        ) => {
            console.log("🔔 FlowContainer received message:", message.type);

            switch (message.type) {
                case "AUTH_STATE_CHANGED":
                    if (message.user) {
                        setUser(message.user);
                        setShowLoginScreen(false);
                    } else {
                        setUser(null);
                        setShowLoginScreen(true);
                    }
                    sendResponse({ success: true });
                    break;
                default:
                    break;
            }
        };

        if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.onMessage.addListener(messageListener);
            checkInitialAuthState();

            return () => {
                chrome.runtime.onMessage.removeListener(messageListener);
            };
        }
    }, []);

    const checkInitialAuthState = async () => {
        try {
            if (typeof chrome !== "undefined" && chrome.runtime) {
                const response = await chrome.runtime.sendMessage({
                    type: "CHECK_AUTH_STATE",
                });

                if (response && response.user) {
                    setUser(response.user);
                    setShowLoginScreen(false);
                }
            }
        } catch (error) {
            console.log("🔍 No existing auth state found");
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);

        try {
            console.log("🔐 Starting Google authentication...");

            if (typeof chrome !== "undefined" && chrome.runtime) {
                const response: AuthMessage = await chrome.runtime.sendMessage({
                    type: "GOOGLE_AUTH",
                });

                if (response.success && response.user) {
                    console.log(
                        "✅ Authentication successful:",
                        response.user.email,
                    );
                    setUser(response.user);
                    setShowLoginScreen(false);
                } else {
                    console.error("❌ Authentication failed:", response.error);
                }
            } else {
                console.error("❌ Chrome runtime not available");
            }
        } catch (error) {
            console.error("❌ Authentication error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleContinueWithoutSignin = () => {
        console.log("👤 Continuing without Google Calendar sync");
        setShowLoginScreen(false);
    };

    const handleSignOut = async () => {
        console.log("🚪 Signing out...");

        try {
            if (typeof chrome !== "undefined" && chrome.runtime) {
                await chrome.runtime.sendMessage({ type: "SIGN_OUT" });
            }

            setUser(null);
            setShowLoginScreen(true);
        } catch (error) {
            console.error("❌ Sign out error:", error);
        }
    };

    if (!isVisible) {
        return null;
    }

    return (
        <>
            {showLoginScreen ? (
                <LoginScreen
                    onGoogleLogin={handleGoogleLogin}
                    onContinueWithoutSignin={handleContinueWithoutSignin}
                    isLoading={isLoading}
                />
            ) : (
                <FlowModal
                    user={user}
                    onClose={onClose}
                    onSignOut={handleSignOut}
                />
            )}
        </>
    );
};

export default FlowContainer;
