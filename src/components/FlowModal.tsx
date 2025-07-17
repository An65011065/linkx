import React, { useState, useEffect } from "react";
import {
    Calendar,
    Plus,
    Check,
    X,
    ChevronLeft,
    ChevronRight,
    Clock,
    User,
    Settings,
    LogOut,
    CheckCircle2,
    Circle,
    Edit3,
    Trash2,
    Filter,
    Search,
    Zap,
} from "lucide-react";

interface Task {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    dueDate?: string;
    priority: "low" | "medium" | "high";
    category: "work" | "personal" | "other";
    createdAt: number;
    completedAt?: number;
}

interface GoogleCalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    description?: string;
    location?: string;
}

interface FlowModalProps {
    isVisible: boolean;
    onClose: () => void;
}

const FlowModal: React.FC<FlowModalProps> = ({ isVisible, onClose }) => {
    const [currentView, setCurrentView] = useState<"welcome" | "main">(
        "welcome",
    );
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>(
        [],
    );
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showAddTask, setShowAddTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskDescription, setNewTaskDescription] = useState("");
    const [newTaskPriority, setNewTaskPriority] = useState<
        "low" | "medium" | "high"
    >("medium");
    const [newTaskCategory, setNewTaskCategory] = useState<
        "work" | "personal" | "other"
    >("work");
    const [filter, setFilter] = useState<"all" | "pending" | "completed">(
        "all",
    );
    const [searchTerm, setSearchTerm] = useState("");
    const [editingTask, setEditingTask] = useState<string | null>(null);

    useEffect(() => {
        if (isVisible) {
            loadInitialData();
        }
    }, [isVisible]);

    const loadInitialData = async () => {
        try {
            // Check if user is already signed in
            const authResponse = await chrome.runtime.sendMessage({
                type: "GET_AUTH_STATE",
            });

            if (authResponse?.user) {
                setUser(authResponse.user);
                setIsSignedIn(true);
                setCurrentView("main");
                await loadUserData();
            } else {
                setCurrentView("welcome");
            }
        } catch (error) {
            console.error("Error loading initial data:", error);
            setCurrentView("welcome");
        }
    };

    const loadUserData = async () => {
        try {
            setLoading(true);

            // Load tasks from storage
            const tasksData = await chrome.storage.local.get(["flowTasks"]);
            if (tasksData.flowTasks) {
                setTasks(JSON.parse(tasksData.flowTasks));
            }

            // Load calendar events if signed in with Google
            if (isSignedIn) {
                const calendarResponse = await chrome.runtime.sendMessage({
                    type: "GET_CALENDAR_EVENTS",
                });

                if (calendarResponse?.success && calendarResponse.events) {
                    setCalendarEvents(calendarResponse.events);
                }
            }
        } catch (error) {
            console.error("Error loading user data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            setLoading(true);

            const response = await chrome.runtime.sendMessage({
                type: "FLOW_GOOGLE_SIGNIN",
            });

            if (response?.success && response.user) {
                setUser(response.user);
                setIsSignedIn(true);
                setCurrentView("main");
                await loadUserData();
            } else {
                throw new Error(response?.error || "Failed to sign in");
            }
        } catch (error) {
            console.error("Google sign in error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleContinueWithoutSignIn = () => {
        setIsSignedIn(false);
        setCurrentView("main");
        loadUserData();
    };

    const handleSignOut = async () => {
        try {
            setLoading(true);

            await chrome.runtime.sendMessage({
                type: "FLOW_SIGN_OUT",
            });

            setUser(null);
            setIsSignedIn(false);
            setCalendarEvents([]);
            setCurrentView("welcome");
        } catch (error) {
            console.error("Sign out error:", error);
        } finally {
            setLoading(false);
        }
    };

    const saveTasks = async (newTasks: Task[]) => {
        try {
            await chrome.storage.local.set({
                flowTasks: JSON.stringify(newTasks),
            });
            setTasks(newTasks);
        } catch (error) {
            console.error("Error saving tasks:", error);
        }
    };

    const addTask = async () => {
        if (!newTaskTitle.trim()) return;

        const newTask: Task = {
            id: `task_${Date.now()}`,
            title: newTaskTitle,
            description: newTaskDescription || undefined,
            completed: false,
            dueDate: selectedDate.toISOString().split("T")[0],
            priority: newTaskPriority,
            category: newTaskCategory,
            createdAt: Date.now(),
        };

        const updatedTasks = [...tasks, newTask];
        await saveTasks(updatedTasks);

        // Reset form
        setNewTaskTitle("");
        setNewTaskDescription("");
        setNewTaskPriority("medium");
        setNewTaskCategory("work");
        setShowAddTask(false);
    };

    const toggleTask = async (taskId: string) => {
        const updatedTasks = tasks.map((task) =>
            task.id === taskId
                ? {
                      ...task,
                      completed: !task.completed,
                      completedAt: !task.completed ? Date.now() : undefined,
                  }
                : task,
        );
        await saveTasks(updatedTasks);
    };

    const deleteTask = async (taskId: string) => {
        const updatedTasks = tasks.filter((task) => task.id !== taskId);
        await saveTasks(updatedTasks);
    };

    const updateTask = async (taskId: string, updates: Partial<Task>) => {
        const updatedTasks = tasks.map((task) =>
            task.id === taskId ? { ...task, ...updates } : task,
        );
        await saveTasks(updatedTasks);
        setEditingTask(null);
    };

    const getFilteredTasks = () => {
        let filtered = tasks;

        // Filter by completion status
        if (filter === "pending") {
            filtered = filtered.filter((task) => !task.completed);
        } else if (filter === "completed") {
            filtered = filtered.filter((task) => task.completed);
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(
                (task) =>
                    task.title
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    task.description
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()),
            );
        }

        // Filter by selected date
        const selectedDateStr = selectedDate.toISOString().split("T")[0];
        filtered = filtered.filter((task) => task.dueDate === selectedDateStr);

        return filtered;
    };

    const getTodayTasksCount = () => {
        const today = new Date().toISOString().split("T")[0];
        return tasks.filter((task) => task.dueDate === today && !task.completed)
            .length;
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high":
                return "rgba(239, 68, 68, 0.8)";
            case "medium":
                return "rgba(245, 158, 11, 0.8)";
            case "low":
                return "rgba(34, 197, 94, 0.8)";
            default:
                return "rgba(107, 114, 128, 0.8)";
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case "work":
                return "rgba(59, 130, 246, 0.8)";
            case "personal":
                return "rgba(139, 92, 246, 0.8)";
            case "other":
                return "rgba(107, 114, 128, 0.8)";
            default:
                return "rgba(107, 114, 128, 0.8)";
        }
    };

    const navigateDate = (direction: "prev" | "next") => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
        setSelectedDate(newDate);
    };

    if (!isVisible) return null;

    return (
        <div className="flow-modal">
            <div className="flow-modal-content">
                {/* Header */}
                <div className="flow-header">
                    <div className="flow-header-left">
                        <div className="flow-icon">
                            <Calendar size={20} />
                        </div>
                        <h1 className="flow-title">Lyncx Flow</h1>
                    </div>
                    <div className="flow-header-right">
                        {currentView === "main" && isSignedIn && user && (
                            <div className="flow-user-menu">
                                <div className="flow-user-avatar">
                                    {user.displayName?.[0] ||
                                        user.email?.[0] ||
                                        "U"}
                                </div>
                                <button
                                    className="flow-sign-out-btn"
                                    onClick={handleSignOut}
                                >
                                    <LogOut size={14} />
                                </button>
                            </div>
                        )}
                        <button className="flow-close-btn" onClick={onClose}>
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Welcome View */}
                {currentView === "welcome" && (
                    <div className="flow-welcome">
                        <div className="flow-welcome-content">
                            <div className="flow-welcome-icon">
                                <Calendar size={48} />
                            </div>
                            <h2 className="flow-welcome-title">
                                Welcome to Lyncx Flow
                            </h2>
                            <p className="flow-welcome-subtitle">
                                Your beautiful calendar and task management in
                                one place
                            </p>

                            <div className="flow-auth-options">
                                <button
                                    className="flow-google-signin-btn"
                                    onClick={handleGoogleSignIn}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <div className="flow-spinner" />
                                    ) : (
                                        <>
                                            <Zap size={16} />
                                            <span>Sign in with Google</span>
                                        </>
                                    )}
                                </button>
                                <p className="flow-google-description">
                                    Sync your calendar events and tasks across
                                    all devices
                                </p>

                                <button
                                    className="flow-continue-btn"
                                    onClick={handleContinueWithoutSignIn}
                                >
                                    Continue without signing in
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main View */}
                {currentView === "main" && (
                    <div className="flow-main">
                        {/* Date Navigation */}
                        <div className="flow-date-nav">
                            <button
                                className="flow-nav-btn"
                                onClick={() => navigateDate("prev")}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <div className="flow-date-display">
                                <span className="flow-date-text">
                                    {formatDate(selectedDate)}
                                </span>
                                <div className="flow-date-indicator">
                                    {getTodayTasksCount() > 0 && (
                                        <span className="flow-tasks-count">
                                            {getTodayTasksCount()} tasks
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                className="flow-nav-btn"
                                onClick={() => navigateDate("next")}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        {/* Filters and Search */}
                        <div className="flow-controls">
                            <div className="flow-search">
                                <Search size={14} />
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                />
                            </div>
                            <div className="flow-filters">
                                <button
                                    className={`flow-filter-btn ${
                                        filter === "all" ? "active" : ""
                                    }`}
                                    onClick={() => setFilter("all")}
                                >
                                    All
                                </button>
                                <button
                                    className={`flow-filter-btn ${
                                        filter === "pending" ? "active" : ""
                                    }`}
                                    onClick={() => setFilter("pending")}
                                >
                                    Pending
                                </button>
                                <button
                                    className={`flow-filter-btn ${
                                        filter === "completed" ? "active" : ""
                                    }`}
                                    onClick={() => setFilter("completed")}
                                >
                                    Done
                                </button>
                            </div>
                        </div>

                        {/* Calendar Events */}
                        {isSignedIn && calendarEvents.length > 0 && (
                            <div className="flow-calendar-events">
                                <h3 className="flow-section-title">
                                    Calendar Events
                                </h3>
                                <div className="flow-events-list">
                                    {calendarEvents.map((event) => (
                                        <div
                                            key={event.id}
                                            className="flow-event"
                                        >
                                            <div className="flow-event-time">
                                                <Clock size={12} />
                                                {new Date(
                                                    event.start,
                                                ).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </div>
                                            <div className="flow-event-details">
                                                <span className="flow-event-title">
                                                    {event.title}
                                                </span>
                                                {event.location && (
                                                    <span className="flow-event-location">
                                                        {event.location}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tasks */}
                        <div className="flow-tasks">
                            <div className="flow-tasks-header">
                                <h3 className="flow-section-title">Tasks</h3>
                                <button
                                    className="flow-add-task-btn"
                                    onClick={() => setShowAddTask(true)}
                                >
                                    <Plus size={14} />
                                </button>
                            </div>

                            {/* Add Task Form */}
                            {showAddTask && (
                                <div className="flow-add-task-form">
                                    <input
                                        type="text"
                                        placeholder="Task title..."
                                        value={newTaskTitle}
                                        onChange={(e) =>
                                            setNewTaskTitle(e.target.value)
                                        }
                                        className="flow-task-input"
                                        autoFocus
                                    />
                                    <textarea
                                        placeholder="Description (optional)..."
                                        value={newTaskDescription}
                                        onChange={(e) =>
                                            setNewTaskDescription(
                                                e.target.value,
                                            )
                                        }
                                        className="flow-task-textarea"
                                        rows={2}
                                    />
                                    <div className="flow-task-meta">
                                        <select
                                            value={newTaskPriority}
                                            onChange={(e) =>
                                                setNewTaskPriority(
                                                    e.target.value as
                                                        | "low"
                                                        | "medium"
                                                        | "high",
                                                )
                                            }
                                            className="flow-task-select"
                                        >
                                            <option value="low">
                                                Low Priority
                                            </option>
                                            <option value="medium">
                                                Medium Priority
                                            </option>
                                            <option value="high">
                                                High Priority
                                            </option>
                                        </select>
                                        <select
                                            value={newTaskCategory}
                                            onChange={(e) =>
                                                setNewTaskCategory(
                                                    e.target.value as
                                                        | "work"
                                                        | "personal"
                                                        | "other",
                                                )
                                            }
                                            className="flow-task-select"
                                        >
                                            <option value="work">Work</option>
                                            <option value="personal">
                                                Personal
                                            </option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="flow-task-actions">
                                        <button
                                            className="flow-task-cancel-btn"
                                            onClick={() =>
                                                setShowAddTask(false)
                                            }
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="flow-task-save-btn"
                                            onClick={addTask}
                                            disabled={!newTaskTitle.trim()}
                                        >
                                            Add Task
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Tasks List */}
                            <div className="flow-tasks-list">
                                {getFilteredTasks().map((task) => (
                                    <div
                                        key={task.id}
                                        className="flow-task-item"
                                    >
                                        <button
                                            className={`flow-task-checkbox ${
                                                task.completed
                                                    ? "completed"
                                                    : ""
                                            }`}
                                            onClick={() => toggleTask(task.id)}
                                        >
                                            {task.completed ? (
                                                <CheckCircle2 size={16} />
                                            ) : (
                                                <Circle size={16} />
                                            )}
                                        </button>

                                        <div className="flow-task-content">
                                            {editingTask === task.id ? (
                                                <div className="flow-task-edit">
                                                    <input
                                                        type="text"
                                                        value={task.title}
                                                        onChange={(e) =>
                                                            updateTask(
                                                                task.id,
                                                                {
                                                                    title: e
                                                                        .target
                                                                        .value,
                                                                },
                                                            )
                                                        }
                                                        className="flow-task-edit-input"
                                                        autoFocus
                                                    />
                                                </div>
                                            ) : (
                                                <>
                                                    <span
                                                        className={`flow-task-title ${
                                                            task.completed
                                                                ? "completed"
                                                                : ""
                                                        }`}
                                                    >
                                                        {task.title}
                                                    </span>
                                                    {task.description && (
                                                        <span className="flow-task-description">
                                                            {task.description}
                                                        </span>
                                                    )}
                                                    <div className="flow-task-tags">
                                                        <span
                                                            className="flow-task-priority"
                                                            style={{
                                                                backgroundColor:
                                                                    getPriorityColor(
                                                                        task.priority,
                                                                    ),
                                                            }}
                                                        >
                                                            {task.priority}
                                                        </span>
                                                        <span
                                                            className="flow-task-category"
                                                            style={{
                                                                backgroundColor:
                                                                    getCategoryColor(
                                                                        task.category,
                                                                    ),
                                                            }}
                                                        >
                                                            {task.category}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className="flow-task-actions">
                                            <button
                                                className="flow-task-edit-btn"
                                                onClick={() =>
                                                    setEditingTask(
                                                        editingTask === task.id
                                                            ? null
                                                            : task.id,
                                                    )
                                                }
                                            >
                                                <Edit3 size={12} />
                                            </button>
                                            <button
                                                className="flow-task-delete-btn"
                                                onClick={() =>
                                                    deleteTask(task.id)
                                                }
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {getFilteredTasks().length === 0 && (
                                    <div className="flow-empty-state">
                                        {searchTerm ? (
                                            <p>
                                                No tasks found matching "
                                                {searchTerm}"
                                            </p>
                                        ) : (
                                            <p>
                                                No tasks for this date. Add one
                                                above!
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .flow-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(8px);
                    z-index: 10000000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: flowFadeIn 0.3s ease-out;
                }

                .flow-modal-content {
                    width: 480px;
                    max-height: 90vh;
                    background: linear-gradient(135deg, rgba(240, 249, 255, 0.95) 0%, rgba(224, 242, 254, 0.95) 100%);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(59, 130, 246, 0.2);
                    border-radius: 20px;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
                    overflow: hidden;
                    animation: flowSlideUp 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
                    display: flex;
                    flex-direction: column;
                }

                .flow-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 20px 24px;
                    border-bottom: 1px solid rgba(59, 130, 246, 0.1);
                    background: rgba(255, 255, 255, 0.3);
                }

                .flow-header-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .flow-icon {
                    width: 40px;
                    height: 40px;
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(37, 99, 235, 0.8));
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }

                .flow-title {
                    font-size: 20px;
                    font-weight: 600;
                    color: rgba(30, 58, 138, 0.9);
                    margin: 0;
                }

                .flow-header-right {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .flow-user-menu {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .flow-user-avatar {
                    width: 28px;
                    height: 28px;
                    border-radius: 6px;
                    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .flow-sign-out-btn {
                    width: 28px;
                    height: 28px;
                    background: rgba(239, 68, 68, 0.1);
                    border: none;
                    border-radius: 6px;
                    color: rgba(239, 68, 68, 0.8);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }

                .flow-sign-out-btn:hover {
                    background: rgba(239, 68, 68, 0.2);
                    transform: scale(1.05);
                }

                .flow-close-btn {
                    width: 32px;
                    height: 32px;
                    background: rgba(107, 114, 128, 0.1);
                    border: none;
                    border-radius: 8px;
                    color: rgba(107, 114, 128, 0.8);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }

                .flow-close-btn:hover {
                    background: rgba(107, 114, 128, 0.2);
                    transform: scale(1.05);
                }

                .flow-welcome {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 24px;
                }

                .flow-welcome-content {
                    text-align: center;
                    max-width: 320px;
                }

                .flow-welcome-icon {
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(37, 99, 235, 0.8));
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    margin: 0 auto 24px;
                    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
                }

                .flow-welcome-title {
                    font-size: 24px;
                    font-weight: 600;
                    color: rgba(30, 58, 138, 0.9);
                    margin: 0 0 12px 0;
                }

                .flow-welcome-subtitle {
                    font-size: 14px;
                    color: rgba(59, 130, 246, 0.7);
                    margin: 0 0 32px 0;
                    line-height: 1.5;
                }

                .flow-auth-options {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .flow-google-signin-btn {
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.9));
                    border: none;
                    border-radius: 12px;
                    color: white;
                    font-size: 14px;
                    font-weight: 600;
                    padding: 14px 24px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    justify-content: center;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                }

                .flow-google-signin-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
                }

                .flow-google-signin-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .flow-google-description {
                    font-size: 12px;
                    color: rgba(59, 130, 246, 0.6);
                    margin: -8px 0 0 0;
                    font-style: italic;
                }

                .flow-continue-btn {
                    background: none;
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    border-radius: 12px;
                    color: rgba(59, 130, 246, 0.8);
                    font-size: 14px;
                    font-weight: 600;
                    padding: 12px 24px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .flow-continue-btn:hover {
                    background: rgba(59, 130, 246, 0.05);
                    border-color: rgba(59, 130, 246, 0.5);
                    transform: translateY(-1px);
                }

                .flow-main {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .flow-date-nav {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 24px;
                    border-bottom: 1px solid rgba(59, 130, 246, 0.1);
                    background: rgba(255, 255, 255, 0.2);
                }

                .flow-nav-btn {
                    width: 32px;
                    height: 32px;
                    background: rgba(59, 130, 246, 0.1);
                    border: none;
                    border-radius: 8px;
                    color: rgba(59, 130, 246, 0.8);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }

                .flow-nav-btn:hover {
                    background: rgba(59, 130, 246, 0.2);
                    transform: scale(1.05);
                }

                .flow-date-display {
                    text-align: center;
                    flex: 1;
                }

                .flow-date-text {
                    font-size: 16px;
                    font-weight: 600;
                    color: rgba(30, 58, 138, 0.9);
                    display: block;
                }

                .flow-date-indicator {
                    margin-top: 4px;
                }

                .flow-tasks-count {
                    font-size: 12px;
                    color: rgba(59, 130, 246, 0.7);
                    background: rgba(59, 130, 246, 0.1);
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-weight: 500;
                }

                .flow-controls {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px 24px;
                    border-bottom: 1px solid rgba(59, 130, 246, 0.1);
                }

                .flow-search {
                    flex: 1;
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(255, 255, 255, 0.5);
                    border: 1px solid rgba(59, 130, 246, 0.2);
                    border-radius: 8px;
                    padding: 8px 12px;
                    transition: all 0.2s ease;
                }

                .flow-search:focus-within {
                    border-color: rgba(59, 130, 246, 0.5);
                    background: rgba(255, 255, 255, 0.7);
                }

                .flow-search svg {
                    color: rgba(59, 130, 246, 0.6);
                }

                .flow-search input {
                    flex: 1;
                    border: none;
                    outline: none;
                    background: none;
                    font-size: 14px;
                    color: rgba(30, 58, 138, 0.9);
                }

                .flow-search input::placeholder {
                    color: rgba(59, 130, 246, 0.5);
                }

                .flow-filters {
                    display: flex;
                    gap: 4px;
                    background: rgba(59, 130, 246, 0.1);
                    border-radius: 8px;
                    padding: 4px;
                }

                .flow-filter-btn {
                    padding: 6px 12px;
                    border: none;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    background: none;
                    color: rgba(59, 130, 246, 0.7);
                }

                .flow-filter-btn.active {
                    background: rgba(59, 130, 246, 0.8);
                    color: white;
                }

                .flow-filter-btn:hover:not(.active) {
                    background: rgba(59, 130, 246, 0.1);
                }

                .flow-calendar-events {
                    padding: 16px 24px 0;
                }

                .flow-section-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: rgba(30, 58, 138, 0.9);
                    margin: 0 0 12px 0;
                }

                .flow-events-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-bottom: 16px;
                }

                .flow-event {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px 12px;
                    background: rgba(34, 197, 94, 0.1);
                    border-radius: 8px;
                    border-left: 3px solid rgba(34, 197, 94, 0.6);
                }

                .flow-event-time {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 12px;
                    color: rgba(34, 197, 94, 0.8);
                    font-weight: 500;
                    min-width: 60px;
                }

                .flow-event-details {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .flow-event-title {
                    font-size: 13px;
                    font-weight: 600;
                    color: rgba(30, 58, 138, 0.9);
                }

                .flow-event-location {
                    font-size: 11px;
                    color: rgba(59, 130, 246, 0.6);
                }

                .flow-tasks {
                    flex: 1;
                    padding: 16px 24px 24px;
                    overflow-y: auto;
                }

                .flow-tasks-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 16px;
                }

                .flow-add-task-btn {
                    width: 32px;
                    height: 32px;
                    background: rgba(59, 130, 246, 0.1);
                    border: none;
                    border-radius: 8px;
                    color: rgba(59, 130, 246, 0.8);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }

                .flow-add-task-btn:hover {
                    background: rgba(59, 130, 246, 0.2);
                    transform: scale(1.05);
                }

                .flow-add-task-form {
                    background: rgba(255, 255, 255, 0.6);
                    border: 1px solid rgba(59, 130, 246, 0.2);
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .flow-task-input {
                    border: none;
                    outline: none;
                    background: rgba(255, 255, 255, 0.8);
                    border-radius: 8px;
                    padding: 12px;
                    font-size: 14px;
                    color: rgba(30, 58, 138, 0.9);
                    border: 1px solid rgba(59, 130, 246, 0.2);
                    transition: all 0.2s ease;
                }

                .flow-task-input:focus {
                    border-color: rgba(59, 130, 246, 0.5);
                    background: rgba(255, 255, 255, 0.9);
                }

                .flow-task-textarea {
                    border: none;
                    outline: none;
                    background: rgba(255, 255, 255, 0.8);
                    border-radius: 8px;
                    padding: 12px;
                    font-size: 14px;
                    color: rgba(30, 58, 138, 0.9);
                    border: 1px solid rgba(59, 130, 246, 0.2);
                    transition: all 0.2s ease;
                    resize: vertical;
                    min-height: 60px;
                    font-family: inherit;
                }

                .flow-task-textarea:focus {
                    border-color: rgba(59, 130, 246, 0.5);
                    background: rgba(255, 255, 255, 0.9);
                }

                .flow-task-meta {
                    display: flex;
                    gap: 12px;
                }

                .flow-task-select {
                    flex: 1;
                    border: none;
                    outline: none;
                    background: rgba(255, 255, 255, 0.8);
                    border-radius: 8px;
                    padding: 8px 12px;
                    font-size: 12px;
                    color: rgba(30, 58, 138, 0.9);
                    border: 1px solid rgba(59, 130, 246, 0.2);
                    cursor: pointer;
                }

                .flow-task-actions {
                    display: flex;
                    gap: 8px;
                    justify-content: flex-end;
                }

                .flow-task-cancel-btn {
                    background: none;
                    border: 1px solid rgba(107, 114, 128, 0.3);
                    border-radius: 8px;
                    color: rgba(107, 114, 128, 0.8);
                    font-size: 12px;
                    font-weight: 600;
                    padding: 8px 16px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .flow-task-cancel-btn:hover {
                    background: rgba(107, 114, 128, 0.05);
                }

                .flow-task-save-btn {
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.9));
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: 12px;
                    font-weight: 600;
                    padding: 8px 16px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
                }

                .flow-task-save-btn:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
                }

                .flow-task-save-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .flow-tasks-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .flow-task-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.5);
                    border: 1px solid rgba(59, 130, 246, 0.1);
                    border-radius: 10px;
                    transition: all 0.2s ease;
                }

                .flow-task-item:hover {
                    background: rgba(255, 255, 255, 0.7);
                    border-color: rgba(59, 130, 246, 0.2);
                    transform: translateY(-1px);
                }

                .flow-task-checkbox {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: rgba(59, 130, 246, 0.6);
                    transition: all 0.2s ease;
                    padding: 2px;
                    margin-top: 2px;
                }

                .flow-task-checkbox:hover {
                    color: rgba(59, 130, 246, 0.8);
                    transform: scale(1.1);
                }

                .flow-task-checkbox.completed {
                    color: rgba(34, 197, 94, 0.8);
                }

                .flow-task-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .flow-task-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: rgba(30, 58, 138, 0.9);
                    transition: all 0.2s ease;
                }

                .flow-task-title.completed {
                    text-decoration: line-through;
                    color: rgba(107, 114, 128, 0.6);
                }

                .flow-task-description {
                    font-size: 12px;
                    color: rgba(59, 130, 246, 0.6);
                    line-height: 1.4;
                }

                .flow-task-tags {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                }

                .flow-task-priority,
                .flow-task-category {
                    font-size: 10px;
                    font-weight: 600;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .flow-task-edit {
                    width: 100%;
                }

                .flow-task-edit-input {
                    width: 100%;
                    border: none;
                    outline: none;
                    background: rgba(255, 255, 255, 0.8);
                    border-radius: 6px;
                    padding: 8px;
                    font-size: 14px;
                    color: rgba(30, 58, 138, 0.9);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                }

                .flow-task-actions {
                    display: flex;
                    gap: 4px;
                    opacity: 0;
                    transition: all 0.2s ease;
                }

                .flow-task-item:hover .flow-task-actions {
                    opacity: 1;
                }

                .flow-task-edit-btn,
                .flow-task-delete-btn {
                    width: 24px;
                    height: 24px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }

                .flow-task-edit-btn {
                    background: rgba(59, 130, 246, 0.1);
                    color: rgba(59, 130, 246, 0.8);
                }

                .flow-task-edit-btn:hover {
                    background: rgba(59, 130, 246, 0.2);
                    transform: scale(1.05);
                }

                .flow-task-delete-btn {
                    background: rgba(239, 68, 68, 0.1);
                    color: rgba(239, 68, 68, 0.8);
                }

                .flow-task-delete-btn:hover {
                    background: rgba(239, 68, 68, 0.2);
                    transform: scale(1.05);
                }

                .flow-empty-state {
                    text-align: center;
                    padding: 40px 20px;
                    color: rgba(59, 130, 246, 0.6);
                    font-size: 14px;
                    font-style: italic;
                }

                .flow-spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top: 2px solid rgba(255, 255, 255, 0.8);
                    border-radius: 50%;
                    animation: flowSpin 1s linear infinite;
                }

                @keyframes flowFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes flowSlideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                @keyframes flowSpin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                /* Scrollbar styling */
                .flow-tasks::-webkit-scrollbar {
                    width: 4px;
                }

                .flow-tasks::-webkit-scrollbar-track {
                    background: rgba(59, 130, 246, 0.1);
                    border-radius: 2px;
                }

                .flow-tasks::-webkit-scrollbar-thumb {
                    background: rgba(59, 130, 246, 0.3);
                    border-radius: 2px;
                }

                .flow-tasks::-webkit-scrollbar-thumb:hover {
                    background: rgba(59, 130, 246, 0.5);
                }
            `}</style>
        </div>
    );
};

export default FlowModal;
