import React, { useState, useEffect, useRef } from "react";
import {
    Plus,
    X,
    Check,
    Calendar,
    ChevronRight,
    Grip,
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

interface FlowModalProps {
    isVisible: boolean;
    onClose: () => void;
}

const FlowModal: React.FC<FlowModalProps> = ({ isVisible, onClose }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [currentView, setCurrentView] = useState<
        "today" | "tomorrow" | "later"
    >("today");
    const [isMinimized, setIsMinimized] = useState(false);
    const [position, setPosition] = useState({ x: 20, y: 80 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [hasDragged, setHasDragged] = useState(false);
    const dragRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isVisible) {
            loadTasks();
        }
    }, [isVisible]);

    const loadTasks = async () => {
        try {
            // Simulate loading from storage
            const mockTasks: Task[] = [
                {
                    id: "1",
                    title: "Review design mockups",
                    completed: false,
                    createdAt: Date.now() - 3600000,
                    dueDate: "today",
                },
                {
                    id: "2",
                    title: "Team standup meeting",
                    completed: true,
                    createdAt: Date.now() - 7200000,
                    dueDate: "today",
                },
                {
                    id: "3",
                    title: "Update project documentation",
                    completed: false,
                    createdAt: Date.now() - 1800000,
                    dueDate: "today",
                },
                {
                    id: "4",
                    title: "Client presentation prep",
                    completed: false,
                    createdAt: Date.now() - 900000,
                    dueDate: "tomorrow",
                },
                {
                    id: "5",
                    title: "Research competitor analysis",
                    completed: false,
                    createdAt: Date.now() - 450000,
                    dueDate: "later",
                },
            ];
            setTasks(mockTasks);
        } catch (error) {
            console.error("Error loading tasks:", error);
        }
    };

    const addTask = () => {
        if (!newTaskTitle.trim()) return;

        const newTask: Task = {
            id: `task_${Date.now()}`,
            title: newTaskTitle.trim(),
            completed: false,
            createdAt: Date.now(),
            dueDate: currentView,
        };

        setTasks([newTask, ...tasks]);
        setNewTaskTitle("");
    };

    const toggleTask = (taskId: string) => {
        setTasks(
            tasks.map((task) =>
                task.id === taskId
                    ? {
                          ...task,
                          completed: !task.completed,
                          completedAt: !task.completed ? Date.now() : undefined,
                      }
                    : task,
            ),
        );
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

    const getTaskCount = (timeframe: "today" | "tomorrow" | "later") => {
        return tasks.filter(
            (task) => task.dueDate === timeframe && !task.completed,
        ).length;
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!dragRef.current) return;

        const rect = dragRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
        setIsDragging(true);
        setHasDragged(false);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;

        setHasDragged(true);

        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        // Use different bounds based on current state
        const width = isMinimized ? 100 : 320;
        const height = isMinimized ? 40 : 400;
        const maxX = window.innerWidth - width;
        const maxY = window.innerHeight - height;

        setPosition({
            x: Math.max(0, Math.min(newX, maxX)),
            y: Math.max(0, Math.min(newY, maxY)),
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMinimizedClick = () => {
        // Only expand if we didn't just finish dragging
        if (!hasDragged) {
            setIsMinimized(false);
        }
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            return () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
            };
        }
    }, [isDragging, dragOffset]);

    const viewLabels = {
        today: "Today",
        tomorrow: "Tomorrow",
        later: "Later",
    };

    const getNextView = () => {
        if (currentView === "today") return "tomorrow";
        if (currentView === "tomorrow") return "later";
        return "today";
    };

    if (!isVisible) return null;

    return (
        <div
            ref={dragRef}
            className={`flow-container ${isMinimized ? "minimized" : ""}`}
            style={{
                left: position.x,
                top: position.y,
                transform: isDragging ? "scale(1.02)" : "scale(1)",
                cursor: isDragging ? "grabbing" : "default",
            }}
        >
            {/* Minimized State */}
            {isMinimized && (
                <div
                    className="flow-minimized"
                    onClick={handleMinimizedClick}
                    onMouseDown={handleMouseDown}
                >
                    <div className="minimized-icon">
                        <Calendar size={16} />
                    </div>
                    <div className="minimized-info">
                        <span className="minimized-count">
                            {getTaskCount("today")}
                        </span>
                        <span className="minimized-label">today</span>
                    </div>
                </div>
            )}

            {/* Full State */}
            {!isMinimized && (
                <div className="flow-modal">
                    {/* Header */}
                    <div className="flow-header" onMouseDown={handleMouseDown}>
                        <div className="flow-header-left">
                            <div className="drag-handle">
                                <Grip size={12} />
                            </div>
                            <div className="flow-icon">
                                <Calendar size={14} />
                            </div>
                            <h1 className="flow-title">Flow</h1>
                        </div>
                        <div className="flow-header-right">
                            <button
                                className="flow-minimize-btn"
                                onClick={() => setIsMinimized(true)}
                            >
                                <Minimize size={14} />
                            </button>
                            <button
                                className="flow-close-btn"
                                onClick={onClose}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {/* View Header */}
                    <div className="flow-view-header">
                        <div className="view-selector">
                            <h2 className="view-title">
                                {viewLabels[currentView]}
                            </h2>
                            <div className="view-count">
                                {getTaskCount(currentView)} tasks
                            </div>
                        </div>
                        <button
                            className="view-next-btn"
                            onClick={() => setCurrentView(getNextView())}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Add Task */}
                    <div className="flow-add-section">
                        <div className="flow-add-wrapper">
                            <Plus size={14} className="flow-add-icon" />
                            <input
                                type="text"
                                placeholder={`Add task for ${currentView}...`}
                                value={newTaskTitle}
                                onChange={(e) =>
                                    setNewTaskTitle(e.target.value)
                                }
                                onKeyPress={(e) =>
                                    e.key === "Enter" && addTask()
                                }
                                className="flow-add-input"
                            />
                        </div>
                    </div>

                    {/* Tasks */}
                    <div className="flow-tasks">
                        {getTasksForView().map((task) => (
                            <div
                                key={task.id}
                                className={`flow-task ${
                                    task.completed ? "completed" : ""
                                }`}
                            >
                                <button
                                    className="task-check"
                                    onClick={() => toggleTask(task.id)}
                                >
                                    <Check size={12} />
                                </button>
                                <span className="task-title">{task.title}</span>
                            </div>
                        ))}
                        {getTasksForView().length === 0 && (
                            <div className="flow-empty">
                                <p>No tasks for {currentView}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                .flow-container {
                    position: fixed;
                    z-index: 10000000;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
                        system-ui, sans-serif;
                    transition: transform 0.2s ease;
                }

                .flow-minimized {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(139, 69, 19, 0.95);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(160, 82, 45, 0.3);
                    border-radius: 20px;
                    padding: 8px 12px;
                    cursor: grab;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    width: fit-content;
                }

                .flow-minimized:hover {
                    transform: scale(1.02);
                    background: rgba(139, 69, 19, 1);
                    border-color: rgba(160, 82, 45, 0.5);
                }

                .flow-minimized:active {
                    cursor: grabbing;
                }

                .minimized-icon {
                    color: rgba(245, 245, 220, 0.9);
                }

                .minimized-info {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .minimized-count {
                    color: rgba(245, 245, 220, 0.95);
                    font-weight: 700;
                    font-size: 13px;
                }

                .minimized-label {
                    color: rgba(245, 245, 220, 0.7);
                    font-size: 11px;
                    font-weight: 500;
                }

                .flow-modal {
                    width: 320px;
                    background: rgba(245, 245, 220, 0.95);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(160, 82, 45, 0.3);
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                }

                .flow-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                    background: rgba(160, 82, 45, 0.1);
                    border-bottom: 1px solid rgba(160, 82, 45, 0.2);
                    cursor: grab;
                }

                .flow-header:active {
                    cursor: grabbing;
                }

                .flow-header-left {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .drag-handle {
                    color: rgba(139, 69, 19, 0.5);
                    cursor: grab;
                }

                .flow-icon {
                    width: 24px;
                    height: 24px;
                    background: rgba(160, 82, 45, 0.2);
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: rgba(139, 69, 19, 0.8);
                }

                .flow-title {
                    margin: 0;
                    font-size: 15px;
                    font-weight: 600;
                    color: rgba(101, 67, 33, 0.9);
                }

                .flow-header-right {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .flow-minimize-btn,
                .flow-close-btn {
                    width: 28px;
                    height: 28px;
                    background: rgba(160, 82, 45, 0.1);
                    border: none;
                    border-radius: 6px;
                    color: rgba(139, 69, 19, 0.7);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }

                .flow-minimize-btn:hover,
                .flow-close-btn:hover {
                    background: rgba(160, 82, 45, 0.2);
                    color: rgba(139, 69, 19, 1);
                    transform: scale(1.05);
                }

                .flow-view-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 16px 12px;
                    background: rgba(160, 82, 45, 0.05);
                }

                .view-selector {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .view-title {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 700;
                    color: rgba(101, 67, 33, 0.9);
                }

                .view-count {
                    background: rgba(160, 82, 45, 0.15);
                    color: rgba(139, 69, 19, 0.8);
                    font-size: 11px;
                    font-weight: 600;
                    padding: 2px 6px;
                    border-radius: 6px;
                }

                .view-next-btn {
                    width: 32px;
                    height: 32px;
                    background: rgba(160, 82, 45, 0.1);
                    border: none;
                    border-radius: 8px;
                    color: rgba(139, 69, 19, 0.7);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }

                .view-next-btn:hover {
                    background: rgba(160, 82, 45, 0.2);
                    color: rgba(139, 69, 19, 1);
                    transform: scale(1.05);
                }

                .flow-add-section {
                    padding: 12px 16px;
                    background: rgba(160, 82, 45, 0.05);
                    border-bottom: 1px solid rgba(160, 82, 45, 0.1);
                }

                .flow-add-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(245, 245, 220, 0.8);
                    border: 1px solid rgba(160, 82, 45, 0.2);
                    border-radius: 8px;
                    padding: 10px 12px;
                    transition: all 0.2s ease;
                }

                .flow-add-wrapper:focus-within {
                    border-color: rgba(160, 82, 45, 0.4);
                    background: rgba(245, 245, 220, 0.95);
                    box-shadow: 0 0 0 2px rgba(160, 82, 45, 0.1);
                }

                .flow-add-icon {
                    color: rgba(139, 69, 19, 0.6);
                }

                .flow-add-input {
                    flex: 1;
                    border: none;
                    outline: none;
                    background: none;
                    font-size: 14px;
                    color: rgba(101, 67, 33, 0.9);
                    font-weight: 500;
                }

                .flow-add-input::placeholder {
                    color: rgba(139, 69, 19, 0.5);
                }

                .flow-tasks {
                    max-height: 300px;
                    overflow-y: auto;
                    padding: 8px 0;
                }

                .flow-task {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px 16px;
                    transition: all 0.2s ease;
                    group: hover;
                }

                .flow-task:hover {
                    background: rgba(160, 82, 45, 0.08);
                }

                .flow-task.completed {
                    opacity: 0.7;
                }

                .task-check {
                    width: 20px;
                    height: 20px;
                    background: none;
                    border: 1.5px solid rgba(160, 82, 45, 0.3);
                    border-radius: 4px;
                    color: rgba(139, 69, 19, 0.6);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    flex-shrink: 0;
                }

                .task-check:hover {
                    border-color: rgba(160, 82, 45, 0.5);
                    background: rgba(160, 82, 45, 0.1);
                }

                .flow-task.completed .task-check {
                    background: rgba(34, 197, 94, 0.2);
                    border-color: rgba(34, 197, 94, 0.5);
                    color: rgba(34, 197, 94, 0.8);
                }

                .task-title {
                    flex: 1;
                    font-size: 14px;
                    color: rgba(101, 67, 33, 0.9);
                    font-weight: 500;
                    line-height: 1.3;
                    transition: all 0.2s ease;
                }

                .flow-task.completed .task-title {
                    text-decoration: line-through;
                    color: rgba(139, 69, 19, 0.5);
                }

                .flow-empty {
                    text-align: center;
                    padding: 40px 20px;
                    color: rgba(139, 69, 19, 0.5);
                    font-size: 14px;
                    font-style: italic;
                }

                .flow-empty p {
                    margin: 0;
                }

                /* Scrollbar */
                .flow-tasks::-webkit-scrollbar {
                    width: 4px;
                }

                .flow-tasks::-webkit-scrollbar-track {
                    background: rgba(160, 82, 45, 0.1);
                }

                .flow-tasks::-webkit-scrollbar-thumb {
                    background: rgba(160, 82, 45, 0.3);
                    border-radius: 2px;
                }

                .flow-tasks::-webkit-scrollbar-thumb:hover {
                    background: rgba(160, 82, 45, 0.5);
                }
            `}</style>
        </div>
    );
};

export default FlowModal;
