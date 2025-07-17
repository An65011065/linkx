import React, { useState, useEffect } from "react";
import DataService from "../../data/dataService";
import type { Task } from "../../data/dataService";

interface TodoListProps {
    isDarkMode?: boolean;
    onTasksChange?: (tasks: Task[]) => void;
}

// Time parsing function
const parseTimeFromText = (
    text: string,
): { cleanText: string; time: string | null; error: string | null } => {
    // Regex to match @ or 'at' followed by time patterns
    const timeRegex =
        /(?:@\s*|(?:^|\s)at\s+)(\d{1,2}(?::\d{2})?(?:\s*(?:am|pm|AM|PM))?)/gi;

    const match = timeRegex.exec(text);

    if (match) {
        const timeString = match[1].trim();

        // Check if am/pm is specified
        if (!/am|pm/i.test(timeString)) {
            return {
                cleanText: text,
                time: null,
                error: "Please specify AM or PM (e.g., @4pm or @4am)",
            };
        }

        // Remove the matched time pattern from the text
        const cleanText = text.replace(match[0], "").trim();
        // Clean up any double spaces
        const finalCleanText = cleanText.replace(/\s+/g, " ");

        return {
            cleanText: finalCleanText,
            time: timeString,
            error: null,
        };
    }

    return {
        cleanText: text,
        time: null,
        error: null,
    };
};

const TodoList: React.FC<TodoListProps> = ({
    isDarkMode = false,
    onTasksChange,
}) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [input, setInput] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const dataService = DataService.getInstance();

    // Load tasks on mount
    useEffect(() => {
        const loadTasks = async () => {
            const loadedTasks = await dataService.getTasks();
            // Filter out deleted tasks, but keep completed (expired) ones
            const visibleTasks = loadedTasks.filter(
                (task) => task.status !== "deleted",
            );
            setTasks(visibleTasks);
            // Only pass active tasks to the storyboard
            if (onTasksChange) {
                const activeTasks = visibleTasks.filter(
                    (task) => task.status === "active",
                );
                onTasksChange(activeTasks);
            }
        };
        loadTasks();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            const { cleanText, time, error } = parseTimeFromText(input.trim());

            if (error) {
                setErrorMessage(error);
                return;
            }

            // Clear any previous error
            setErrorMessage("");

            // Create task with parsed time
            const newTask = await dataService.addTask(cleanText, time || undefined);

            const updatedTasks = [...tasks, newTask];
            setTasks(updatedTasks);
            // Only pass active tasks to the storyboard
            if (onTasksChange) {
                const activeTasks = updatedTasks.filter(
                    (task) => task.status === "active",
                );
                onTasksChange(activeTasks);
            }
            setInput("");
        }
    };

    const toggleTask = async (taskId: string) => {
        await dataService.toggleTask(taskId);
        const allTasks = await dataService.getTasks();
        // Filter out deleted tasks, but keep completed (expired) ones
        const visibleTasks = allTasks.filter(
            (task) => task.status !== "deleted",
        );
        setTasks(visibleTasks);
        // Only pass active tasks to the storyboard
        if (onTasksChange) {
            const activeTasks = visibleTasks.filter(
                (task) => task.status === "active",
            );
            onTasksChange(activeTasks);
        }
    };

    const markAsDeleted = async (taskId: string) => {
        await dataService.updateTaskStatus(taskId, "deleted");
        const allTasks = await dataService.getTasks();
        // Filter out deleted tasks, but keep completed (expired) ones
        const visibleTasks = allTasks.filter(
            (task) => task.status !== "deleted",
        );
        setTasks(visibleTasks);
        // Only pass active tasks to the storyboard
        if (onTasksChange) {
            const activeTasks = visibleTasks.filter(
                (task) => task.status === "active",
            );
            onTasksChange(activeTasks);
        }
    };

    return (
        <div
            className={`h-full w-full flex flex-col ${
                isDarkMode ? "bg-black text-white" : "bg-white text-gray-800"
            }`}
        >
            <div className="flex-1 p-8">
                <h2
                    className={`text-2xl font-semibold mb-6 ${
                        isDarkMode ? "text-white" : "text-gray-800"
                    }`}
                >
                    Up Next
                </h2>

                <form onSubmit={handleSubmit} className="mb-6">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            // Clear error when user starts typing
                            if (errorMessage) setErrorMessage("");
                        }}
                        placeholder="Add a task (e.g., go to gym @ 4pm)"
                        className={`w-full px-4 py-3 rounded-lg ${
                            isDarkMode
                                ? "bg-gray-900 text-white border border-gray-700 focus:border-blue-500"
                                : "bg-gray-50 border border-gray-200 focus:border-blue-500"
                        } focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors`}
                    />
                    {errorMessage && (
                        <div
                            className={`mt-2 text-sm ${
                                isDarkMode ? "text-red-400" : "text-red-600"
                            }`}
                        >
                            {errorMessage}
                        </div>
                    )}
                </form>

                <div className="space-y-3">
                    {tasks.map((task, index) => (
                        <div
                            key={task.id}
                            onClick={() => toggleTask(task.id)}
                            className={`p-3 rounded-lg flex items-center justify-between group cursor-pointer transition-all duration-500 ${
                                task.completed || task.status === "completed"
                                    ? isDarkMode
                                        ? "bg-red-950/30 text-red-400"
                                        : "bg-red-50 text-red-700"
                                    : isDarkMode
                                    ? "bg-gray-900/50 hover:bg-green-950/30 hover:text-green-400"
                                    : "bg-gray-50 hover:bg-green-50 hover:text-green-700"
                            }`}
                        >
                            <div className="flex items-center gap-3 flex-1">
                                <span className="relative">
                                    <span className="relative inline-block">
                                        {index + 1}) {task.text}
                                        {task.time && (
                                            <span
                                                className={`ml-2 ${
                                                    isDarkMode
                                                        ? "text-blue-400"
                                                        : "text-blue-600"
                                                }`}
                                            >
                                                | {task.time}
                                            </span>
                                        )}
                                        {/* Animated strike-through line */}
                                        {(task.completed ||
                                            task.status === "completed") && (
                                            <span
                                                className={`absolute left-0 top-1/2 w-full h-[0.1rem] transform origin-left transition-transform duration-700 ease-in-out ${
                                                    isDarkMode
                                                        ? "bg-red-400"
                                                        : "bg-red-700"
                                                }`}
                                                style={{
                                                    transform: "scaleX(1)",
                                                }}
                                            />
                                        )}
                                    </span>
                                </span>
                            </div>
                            {/* Show X button only for completed tasks */}
                            {(task.completed ||
                                task.status === "completed") && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        markAsDeleted(task.id);
                                    }}
                                    className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                                        isDarkMode
                                            ? "text-red-400 hover:text-red-300"
                                            : "text-red-700 hover:text-red-800"
                                    }`}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <line
                                            x1="18"
                                            y1="6"
                                            x2="6"
                                            y2="18"
                                        ></line>
                                        <line
                                            x1="6"
                                            y1="6"
                                            x2="18"
                                            y2="18"
                                        ></line>
                                    </svg>
                                </button>
                            )}
                        </div>
                    ))}
                    {tasks.length === 0 && (
                        <div
                            className={`text-center py-8 ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                        >
                            No tasks yet. Add one above!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TodoList;
