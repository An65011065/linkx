import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, Grip, X, RotateCcw, Globe } from "lucide-react";

interface Message {
    id: string;
    content: string;
    role: "user" | "ai";
    timestamp: number;
}

interface SearchModalProps {
    isVisible: boolean;
    onClose: () => void;
}

interface PageContent {
    title: string;
    url: string;
    description: string;
    content: string;
    contentLength: number;
    wordCount: number;
    extractedAt: string;
}

interface PageCache {
    [url: string]: {
        content: PageContent;
        addedToThread: boolean;
        lastVisited: number;
    };
}

const SearchModal: React.FC<SearchModalProps> = ({ isVisible, onClose }) => {
    const [message, setMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [showChatPanel, setShowChatPanel] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 80 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [pageContent, setPageContent] = useState<PageContent | null>(null);
    const [isClearing, setIsClearing] = useState(false);
    const [pageCache, setPageCache] = useState<PageCache>({});
    const [currentUrl, setCurrentUrl] = useState<string>("");
    const [isExtractingContent, setIsExtractingContent] = useState(false);
    const [chatSize, setChatSize] = useState({ width: 420, height: 500 });
    const [isResizing, setIsResizing] = useState(false);
    const [resizeHandle, setResizeHandle] = useState<string>("");
    const [hasDragged, setHasDragged] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [isInputHovered, setIsInputHovered] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<HTMLDivElement>(null);
    const chatRef = useRef<HTMLDivElement>(null);

    // Storage keys for persistence
    const STORAGE_KEYS = {
        MESSAGES: "lyncx_search_messages",
        SHOW_CHAT: "lyncx_search_show_chat",
        POSITION: "lyncx_search_position",
        PAGE_CACHE: "lyncx_search_page_cache",
        CHAT_SIZE: "lyncx_search_chat_size",
    };

    // Initialize position based on window size
    useEffect(() => {
        const updatePosition = () => {
            if (window.innerWidth > 0) {
                setPosition({ x: Math.max(0, window.innerWidth - 460), y: 80 });
            }
        };
        updatePosition();
        window.addEventListener("resize", updatePosition);
        return () => window.removeEventListener("resize", updatePosition);
    }, []);

    // Load persistent data when modal becomes visible
    useEffect(() => {
        if (isVisible) {
            loadPersistedData();
            handlePageChange();
            if (textareaRef.current) {
                textareaRef.current.focus();
            }
        }
    }, [isVisible]);

    // Check for page changes when URL changes
    useEffect(() => {
        if (isVisible) {
            const handleUrlChange = () => {
                handlePageChange();
            };

            // Listen for navigation events
            window.addEventListener("popstate", handleUrlChange);

            // Check periodically for URL changes (for SPAs)
            const urlCheckInterval = setInterval(() => {
                if (window.location.href !== currentUrl) {
                    handlePageChange();
                }
            }, 1000);

            return () => {
                window.removeEventListener("popstate", handleUrlChange);
                clearInterval(urlCheckInterval);
            };
        }
    }, [isVisible, currentUrl]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Save data whenever it changes
    useEffect(() => {
        if (messages.length > 0) {
            saveToStorage(STORAGE_KEYS.MESSAGES, messages);
        }
    }, [messages]);

    useEffect(() => {
        saveToStorage(STORAGE_KEYS.SHOW_CHAT, showChatPanel);
    }, [showChatPanel]);

    useEffect(() => {
        saveToStorage(STORAGE_KEYS.POSITION, position);
    }, [position]);

    useEffect(() => {
        saveToStorage(STORAGE_KEYS.CHAT_SIZE, chatSize);
    }, [chatSize]);

    useEffect(() => {
        if (Object.keys(pageCache).length > 0) {
            saveToStorage(STORAGE_KEYS.PAGE_CACHE, pageCache);
        }
    }, [pageCache]);

    const saveToStorage = (key: string, data: unknown) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            console.log(`✅ Saved to storage: ${key}`);
        } catch (error) {
            console.log("❌ Failed to save to storage:", error);
        }
    };

    const loadFromStorage = (key: string) => {
        try {
            const stored = localStorage.getItem(key);
            const result = stored ? JSON.parse(stored) : null;
            console.log(`📋 Loaded from storage: ${key}`, result);
            return result;
        } catch (error) {
            console.log("❌ Failed to load from storage:", error);
            return null;
        }
    };

    const loadPersistedData = () => {
        console.log("📂 Loading persisted data...");

        // Load messages
        const savedMessages = loadFromStorage(STORAGE_KEYS.MESSAGES);
        if (savedMessages && Array.isArray(savedMessages)) {
            setMessages(savedMessages);
            console.log(`📨 Loaded ${savedMessages.length} messages`);
        }

        // Load chat panel state
        const savedShowChat = loadFromStorage(STORAGE_KEYS.SHOW_CHAT);
        if (savedShowChat !== null) {
            setShowChatPanel(savedShowChat);
        }

        // Load position
        const savedPosition = loadFromStorage(STORAGE_KEYS.POSITION);
        if (savedPosition) {
            setPosition(savedPosition);
        }

        // Load chat size
        const savedChatSize = loadFromStorage(STORAGE_KEYS.CHAT_SIZE);
        if (savedChatSize) {
            setChatSize(savedChatSize);
        }

        // Load page cache
        const savedPageCache = loadFromStorage(STORAGE_KEYS.PAGE_CACHE);
        if (savedPageCache) {
            setPageCache(savedPageCache);
            console.log(
                `📄 Loaded cache for ${
                    Object.keys(savedPageCache).length
                } pages`,
            );
        }
    };

    // Handle page changes intelligently
    const handlePageChange = async () => {
        const newUrl = window.location.href;

        // Skip if same URL
        if (newUrl === currentUrl) {
            return;
        }

        console.log(`🔄 Page changed from ${currentUrl} to ${newUrl}`);
        setCurrentUrl(newUrl);

        // Check if we've already processed this page
        const cached = pageCache[newUrl];
        if (cached) {
            console.log(`📋 Using cached content for ${newUrl}`);
            setPageContent(cached.content);

            // Update last visited time
            setPageCache((prev) => ({
                ...prev,
                [newUrl]: {
                    ...cached,
                    lastVisited: Date.now(),
                },
            }));
            return;
        }

        // Extract content for new page
        console.log(`📄 Extracting content for new page: ${newUrl}`);
        await extractPageContent(newUrl);
    };

    // Clear memory function
    const clearMemory = async () => {
        setIsClearing(true);

        try {
            console.log("🧹 Clearing memory...");

            // Clear local state
            setMessages([]);
            setPageCache({});

            // Clear localStorage
            localStorage.removeItem(STORAGE_KEYS.MESSAGES);
            localStorage.removeItem(STORAGE_KEYS.PAGE_CACHE);

            // Reset AI service thread
            try {
                const { default: AIService } = await import(
                    "../main/services/AIService"
                );
                const aiService = AIService.getInstance();
                aiService.resetGeneralConversation();
                console.log("🤖 AI service thread reset");
            } catch (error) {
                console.error("❌ Failed to reset AI service:", error);
            }

            console.log("✅ Memory cleared - starting fresh conversation");

            // Re-extract current page content
            await extractPageContent(currentUrl);
        } catch (error) {
            console.error("❌ Error clearing memory:", error);
        } finally {
            setIsClearing(false);
        }
    };

    // Extract page content and cache it
    const extractPageContent = async (url: string = window.location.href) => {
        if (isExtractingContent) return;

        setIsExtractingContent(true);

        try {
            console.log(
                `📄 SearchModal: Extracting page content for ${url}...`,
            );

            // Try to find main content areas
            const contentSelectors = [
                "main",
                '[role="main"]',
                "article",
                ".content",
                ".main-content",
                "#content",
                "#main",
                ".post-content",
                ".entry-content",
                ".article-body",
                ".story-content",
                ".page-content",
            ];

            let mainContent = "";

            // Try to find main content area first
            for (const selector of contentSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    const text = element.textContent || "";
                    if (text.trim().length > 200) {
                        mainContent = text;
                        console.log(
                            `📄 Found main content using selector: ${selector}`,
                        );
                        break;
                    }
                }
            }

            // Fallback: get paragraphs and headings
            if (!mainContent || mainContent.trim().length < 200) {
                console.log(
                    "📄 No main content area found, extracting from paragraphs and headings",
                );
                const contentElements = document.querySelectorAll(
                    "p, h1, h2, h3, h4, h5, h6, li, blockquote, div.text, div.paragraph",
                );
                if (contentElements.length > 0) {
                    mainContent = Array.from(contentElements)
                        .map((el) => (el.textContent || "").trim())
                        .filter((text) => text.length > 20)
                        .join("\n");
                }
            }

            // Final fallback to body
            if (!mainContent || mainContent.trim().length < 200) {
                mainContent = document.body?.textContent || "";
            }

            // Clean up the text
            const cleanText = mainContent
                .replace(/\s+/g, " ")
                .replace(/\n\s*\n/g, "\n")
                .replace(/[^\S\n]+/g, " ")
                .trim();

            // Truncate to reasonable size (3000 words max for conversation)
            const words = cleanText.split(/\s+/);
            const maxWords = 3000;
            let truncatedContent = cleanText;

            if (words.length > maxWords) {
                truncatedContent =
                    words.slice(0, maxWords).join(" ") +
                    "\n\n[Content truncated for conversation - " +
                    (words.length - maxWords) +
                    " more words available]";
                console.log(
                    `📝 Truncated content from ${words.length} to ${maxWords} words`,
                );
            }

            // Get page metadata
            const title = document.title || "";
            const description =
                document
                    .querySelector('meta[name="description"]')
                    ?.getAttribute("content") ||
                document
                    .querySelector('meta[property="og:description"]')
                    ?.getAttribute("content") ||
                "";

            const wordCount = truncatedContent
                .split(/\s+/)
                .filter((word) => word.length > 0).length;

            const extractedPageContent: PageContent = {
                title,
                url,
                description,
                content: truncatedContent,
                contentLength: truncatedContent.length,
                wordCount: wordCount,
                extractedAt: new Date().toISOString(),
            };

            // Cache the content
            setPageCache((prev) => ({
                ...prev,
                [url]: {
                    content: extractedPageContent,
                    addedToThread: false,
                    lastVisited: Date.now(),
                },
            }));

            setPageContent(extractedPageContent);

            console.log("✅ SearchModal: Page content extracted and cached:", {
                url,
                title: title.substring(0, 50) + "...",
                wordCount: extractedPageContent.wordCount,
                contentLength: extractedPageContent.contentLength,
            });
        } catch (error) {
            console.error(
                "❌ SearchModal: Error extracting page content:",
                error,
            );
        } finally {
            setIsExtractingContent(false);
        }
    };

    const handleSubmit = async () => {
        if (!message.trim()) return;

        const userMessage: Message = {
            id: `user_${Date.now()}`,
            content: message.trim(),
            role: "user",
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setMessage("");
        setIsTyping(false);
        setShowChatPanel(true);
        setIsLoading(true);

        try {
            console.log("🤖 Calling AI service...");

            // Import and use AIService
            const { default: AIService } = await import(
                "../main/services/AIService"
            );
            const aiService = AIService.getInstance();

            // Determine if we should include page content
            let shouldIncludePageContent = false;
            let contentToSend: PageContent | null = null;

            const isFirstMessage = messages.length === 0;
            const currentPageCached = pageCache[currentUrl];
            const pageNotAddedToThread =
                currentPageCached && !currentPageCached.addedToThread;

            if (isFirstMessage || pageNotAddedToThread) {
                shouldIncludePageContent = true;
                contentToSend = pageContent;

                // Mark this page as added to thread
                if (currentPageCached) {
                    setPageCache((prev) => ({
                        ...prev,
                        [currentUrl]: {
                            ...prev[currentUrl],
                            addedToThread: true,
                        },
                    }));
                }

                console.log(
                    `📤 Including page content in message: ${currentUrl}`,
                );
            } else {
                console.log(
                    `⚡ Sending message without page content (already in thread)`,
                );
            }

            // Call the real AI service
            const response = await aiService.generateGeneralResponse(
                userMessage.content,
                shouldIncludePageContent ? contentToSend : null,
            );

            const aiMessage: Message = {
                id: `ai_${Date.now()}`,
                content: response,
                role: "ai",
                timestamp: Date.now(),
            };

            setMessages((prev) => [...prev, aiMessage]);
            console.log("✅ AI response received");
        } catch (error) {
            console.error("❌ Error getting AI response:", error);
            const errorMessage: Message = {
                id: `error_${Date.now()}`,
                content:
                    "Sorry, I'm having trouble responding right now. Please try again.",
                role: "ai",
                timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleTextareaChange = (
        e: React.ChangeEvent<HTMLTextAreaElement>,
    ) => {
        setMessage(e.target.value);
        setIsTyping(e.target.value.length > 0);

        // Auto-resize textarea
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(
                textareaRef.current.scrollHeight,
                120,
            )}px`;
        }
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

        const width = chatSize.width;
        const height = chatSize.height;
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

    // Close chat panel instead of entire modal
    const handleCloseChatPanel = () => {
        setShowChatPanel(false);
    };

    // Resize handlers
    const handleResizeStart = (e: React.MouseEvent, handle: string) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        setResizeHandle(handle);
    };

    const handleResizeMove = (e: MouseEvent) => {
        if (!isResizing || !chatRef.current) return;

        const rect = chatRef.current.getBoundingClientRect();
        let newWidth = chatSize.width;
        let newHeight = chatSize.height;

        if (resizeHandle.includes("right")) {
            newWidth = Math.max(300, Math.min(800, e.clientX - rect.left));
        }
        if (resizeHandle.includes("bottom")) {
            newHeight = Math.max(300, Math.min(700, e.clientY - rect.top));
        }

        setChatSize({ width: newWidth, height: newHeight });
    };

    const handleResizeEnd = () => {
        setIsResizing(false);
        setResizeHandle("");
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

    useEffect(() => {
        if (isResizing) {
            document.addEventListener("mousemove", handleResizeMove);
            document.addEventListener("mouseup", handleResizeEnd);
            return () => {
                document.removeEventListener("mousemove", handleResizeMove);
                document.removeEventListener("mouseup", handleResizeEnd);
            };
        }
    }, [isResizing, resizeHandle]);

    // Get cached pages count for display
    const cachedPagesCount = Object.keys(pageCache).length;
    const currentPageInThread = pageCache[currentUrl]?.addedToThread || false;

    if (!isVisible) return null;

    return (
        <>
            {/* Chat Panel */}
            {showChatPanel && (
                <div
                    ref={chatRef}
                    className="chat-panel"
                    style={{
                        left: position.x,
                        top: position.y,
                        width: chatSize.width,
                        height: chatSize.height,
                        transform: isDragging ? "scale(1.02)" : "scale(1)",
                        cursor: isDragging ? "grabbing" : "default",
                    }}
                >
                    <div
                        ref={dragRef}
                        className="chat-drag-header"
                        onMouseDown={handleMouseDown}
                    >
                        <div className="drag-handle">
                            <Grip size={12} />
                        </div>
                        <div className="header-info">
                            {cachedPagesCount > 0 && (
                                <div className="pages-indicator">
                                    <span>{cachedPagesCount}</span>
                                    {currentPageInThread && (
                                        <div className="current-page-dot" />
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="header-buttons">
                            <button
                                onClick={clearMemory}
                                disabled={isClearing}
                                className="header-btn clear-btn"
                                title="Clear conversation"
                            >
                                <RotateCcw size={12} />
                            </button>
                            <button
                                onClick={handleCloseChatPanel}
                                className="header-btn close-btn"
                                title="Close chat panel"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    </div>

                    <div className="chat-messages">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`message ${msg.role}`}>
                                <div className="message-content">
                                    <p>{msg.content}</p>
                                    <span className="message-time">
                                        {new Date(
                                            msg.timestamp,
                                        ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="message ai">
                                <div className="message-content">
                                    <div className="typing-indicator">
                                        <div className="typing-dot"></div>
                                        <div className="typing-dot"></div>
                                        <div className="typing-dot"></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Resize handles */}
                    <div
                        className="resize-handle resize-right"
                        onMouseDown={(e) => handleResizeStart(e, "right")}
                    />
                    <div
                        className="resize-handle resize-bottom"
                        onMouseDown={(e) => handleResizeStart(e, "bottom")}
                    />
                    <div
                        className="resize-handle resize-corner"
                        onMouseDown={(e) =>
                            handleResizeStart(e, "bottom-right")
                        }
                    />
                </div>
            )}

            {/* Bottom Input - Simple opacity based on focus */}
            <div
                className={`input-container ${isVisible ? "visible" : ""} ${
                    isInputFocused || isTyping ? "focused" : ""
                }`}
                onMouseEnter={() => setIsInputHovered(true)}
                onMouseLeave={() => setIsInputHovered(false)}
            >
                <div className="input-wrapper">
                    {isExtractingContent && (
                        <div className="extracting-indicator">
                            <Globe size={12} />
                            <span>Reading page...</span>
                        </div>
                    )}
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={handleTextareaChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setIsInputFocused(false)}
                        placeholder={isInputFocused ? "Ask anything..." : ""}
                        className="input-textarea"
                        rows={1}
                    />
                    <button
                        onClick={onClose}
                        className="close-input-btn"
                        title="Close"
                    >
                        <X size={14} />
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!message.trim()}
                        className={`submit-button ${isTyping ? "active" : ""}`}
                    >
                        <ArrowUp size={14} />
                    </button>
                </div>
            </div>

            <style jsx>{`
                .chat-panel {
                    position: fixed;
                    background: rgba(246, 248, 250, 0.95);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(71, 85, 105, 0.15);
                    border-radius: 14px;
                    box-shadow: 0 20px 40px rgba(30, 41, 59, 0.08);
                    animation: slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
                        system-ui, sans-serif;
                    z-index: 10000001;
                    display: flex;
                    flex-direction: column;
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    overflow: hidden;
                }

                .chat-drag-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                    border-bottom: 1px solid rgba(71, 85, 105, 0.08);
                    cursor: grab;
                    background: rgba(71, 85, 105, 0.02);
                    border-radius: 14px 14px 0 0;
                }

                .chat-drag-header:active {
                    cursor: grabbing;
                }

                .drag-handle {
                    color: rgba(100, 116, 139, 0.5);
                    cursor: grab;
                }

                .header-info {
                    flex: 1;
                    display: flex;
                    justify-content: center;
                }

                .pages-indicator {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(71, 85, 105, 0.08);
                    padding: 4px 10px;
                    border-radius: 10px;
                    font-size: 11px;
                    font-weight: 600;
                    color: rgba(71, 85, 105, 0.8);
                    position: relative;
                }

                .current-page-dot {
                    position: absolute;
                    top: -2px;
                    right: -2px;
                    width: 6px;
                    height: 6px;
                    background: rgba(34, 197, 94, 0.8);
                    border-radius: 50%;
                    border: 1px solid rgba(248, 250, 252, 0.9);
                }

                .header-buttons {
                    display: flex;
                    gap: 6px;
                    align-items: center;
                }

                .header-btn {
                    width: 26px;
                    height: 26px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    font-size: 12px;
                }

                .clear-btn {
                    background: rgba(71, 85, 105, 0.06);
                    color: rgba(71, 85, 105, 0.7);
                }

                .clear-btn:hover {
                    background: rgba(71, 85, 105, 0.12);
                    color: rgba(71, 85, 105, 1);
                    transform: scale(1.05);
                }

                .close-btn {
                    background: rgba(239, 68, 68, 0.08);
                    color: rgba(220, 38, 38, 0.7);
                }

                .close-btn:hover {
                    background: rgba(239, 68, 68, 0.15);
                    color: rgba(220, 38, 38, 1);
                    transform: scale(1.05);
                }

                .header-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }

                .extracting-indicator {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    background: rgba(71, 85, 105, 0.08);
                    border-radius: 12px;
                    font-size: 11px;
                    color: rgba(71, 85, 105, 0.8);
                    font-weight: 500;
                }

                .chat-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .message {
                    display: flex;
                    align-items: flex-start;
                    animation: messageSlide 0.3s ease-out;
                }

                .message.user {
                    justify-content: flex-end;
                }

                .message-content {
                    max-width: 80%;
                    min-width: 0;
                }

                .message.user .message-content {
                    text-align: right;
                }

                .message-content p {
                    margin: 0 0 4px 0;
                    padding: 12px 16px;
                    border-radius: 16px;
                    font-size: 13px;
                    line-height: 1.4;
                    font-weight: 500;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }

                .message.user .message-content p {
                    background: rgba(71, 85, 105, 0.9);
                    color: rgba(248, 250, 252, 0.95);
                    border-bottom-right-radius: 6px;
                }

                .message.ai .message-content p {
                    background: rgba(71, 85, 105, 0.06);
                    color: rgba(30, 41, 59, 0.9);
                    border-bottom-left-radius: 6px;
                }

                .message-time {
                    font-size: 10px;
                    color: rgba(100, 116, 139, 0.6);
                    font-weight: 500;
                }

                .typing-indicator {
                    display: flex;
                    gap: 4px;
                    padding: 12px 16px;
                    background: rgba(71, 85, 105, 0.06);
                    border-radius: 16px;
                    border-bottom-left-radius: 6px;
                }

                .typing-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: rgba(71, 85, 105, 0.5);
                    animation: typing 1.4s infinite ease-in-out;
                }

                .typing-dot:nth-child(1) {
                    animation-delay: -0.32s;
                }

                .typing-dot:nth-child(2) {
                    animation-delay: -0.16s;
                }

                .resize-handle {
                    position: absolute;
                    background: transparent;
                }

                .resize-right {
                    top: 0;
                    right: 0;
                    width: 4px;
                    height: 100%;
                    cursor: ew-resize;
                }

                .resize-bottom {
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 4px;
                    cursor: ns-resize;
                }

                .resize-corner {
                    bottom: 0;
                    right: 0;
                    width: 12px;
                    height: 12px;
                    cursor: nw-resize;
                }

                .resize-handle:hover {
                    background: rgba(71, 85, 105, 0.1);
                }

                .chat-messages::-webkit-scrollbar {
                    width: 4px;
                }

                .chat-messages::-webkit-scrollbar-track {
                    background: rgba(71, 85, 105, 0.05);
                }

                .chat-messages::-webkit-scrollbar-thumb {
                    background: rgba(71, 85, 105, 0.2);
                    border-radius: 2px;
                }

                .input-container {
                    position: fixed;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%) translateY(0);
                    width: 100%;
                    max-width: 680px;
                    padding: 20px;
                    z-index: 10000000;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
                        system-ui, sans-serif;
                    opacity: 0.15;
                    transition: opacity 0.3s ease;
                }

                .input-container.visible {
                    opacity: 0.15;
                }

                .input-container:hover {
                    opacity: 0.6;
                }

                .input-container.focused {
                    opacity: 1;
                }

                .input-wrapper {
                    background: rgba(248, 250, 252, 0.95);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(71, 85, 105, 0.12);
                    border-radius: 24px;
                    padding: 16px 20px;
                    display: flex;
                    align-items: flex-end;
                    gap: 12px;
                    box-shadow: 0 8px 32px rgba(30, 41, 59, 0.08);
                    transition: all 0.3s ease;
                }

                .input-wrapper:focus-within {
                    border-color: rgba(71, 85, 105, 0.25);
                    box-shadow: 0 0 0 3px rgba(71, 85, 105, 0.06),
                        0 12px 40px rgba(30, 41, 59, 0.12);
                    transform: translateY(-2px);
                }

                .input-textarea {
                    flex: 1;
                    background: none;
                    border: none;
                    outline: none;
                    font-size: 15px;
                    color: rgba(30, 41, 59, 0.9);
                    font-weight: 500;
                    line-height: 1.5;
                    resize: none;
                    min-height: 24px;
                    max-height: 120px;
                    overflow-y: auto;
                    font-family: inherit;
                }

                .input-textarea::placeholder {
                    color: rgba(100, 116, 139, 0.5);
                    font-weight: 400;
                }

                .input-textarea::-webkit-scrollbar {
                    width: 4px;
                }

                .input-textarea::-webkit-scrollbar-track {
                    background: transparent;
                }

                .input-textarea::-webkit-scrollbar-thumb {
                    background: rgba(71, 85, 105, 0.2);
                    border-radius: 2px;
                }

                .close-input-btn {
                    width: 36px;
                    height: 36px;
                    background: rgba(71, 85, 105, 0.05);
                    border: 1px solid rgba(71, 85, 105, 0.08);
                    border-radius: 50%;
                    color: rgba(71, 85, 105, 0.4);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                    flex-shrink: 0;
                }

                .close-input-btn:hover {
                    background: rgba(239, 68, 68, 0.08);
                    border-color: rgba(239, 68, 68, 0.15);
                    color: rgba(220, 38, 38, 0.7);
                    transform: scale(1.05);
                }

                .close-input-btn:active {
                    transform: scale(0.98);
                }

                .submit-button {
                    width: 36px;
                    height: 36px;
                    background: rgba(71, 85, 105, 0.08);
                    border: 1px solid rgba(71, 85, 105, 0.12);
                    border-radius: 50%;
                    color: rgba(71, 85, 105, 0.5);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                    flex-shrink: 0;
                    transform: scale(0.9);
                    opacity: 0.6;
                }

                .submit-button.active {
                    background: rgba(71, 85, 105, 0.9);
                    border-color: rgba(71, 85, 105, 0.8);
                    color: rgba(248, 250, 252, 0.95);
                    transform: scale(1);
                    opacity: 1;
                    box-shadow: 0 4px 12px rgba(71, 85, 105, 0.25);
                }

                .submit-button:hover:not(:disabled) {
                    transform: scale(1.05);
                    box-shadow: 0 6px 20px rgba(71, 85, 105, 0.3);
                }

                .submit-button:disabled {
                    cursor: not-allowed;
                    opacity: 0.4;
                }

                .submit-button:active:not(:disabled) {
                    transform: scale(0.98);
                }

                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(20px) translateY(-10px)
                            scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0) translateY(0) scale(1);
                    }
                }

                @keyframes messageSlide {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes typing {
                    0%,
                    80%,
                    100% {
                        transform: scale(0.8);
                        opacity: 0.5;
                    }
                    40% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }

                /* Mobile responsiveness */
                @media (max-width: 768px) {
                    .input-container {
                        padding: 16px;
                        max-width: calc(100vw - 32px);
                    }

                    .input-wrapper {
                        border-radius: 20px;
                        padding: 12px 16px;
                    }

                    .input-textarea {
                        font-size: 16px;
                    }

                    .chat-panel {
                        width: calc(100vw - 32px) !important;
                        height: 60vh !important;
                        left: 16px !important;
                        top: 20% !important;
                    }
                }
            `}</style>
        </>
    );
};

export default SearchModal;
