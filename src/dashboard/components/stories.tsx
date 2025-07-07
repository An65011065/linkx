import React, { useState, useRef, useEffect } from "react";
import { useExtensionData } from "../../data/useExtensionData";
import { StoryCard } from "../components/StoryCard";
// import { StoryCard } from "./light-mode/StoryCard";

interface StoriesComponentProps {
    isDarkMode?: boolean;
}

const StoriesComponent: React.FC<StoriesComponentProps> = ({
    isDarkMode = false,
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(false);
    const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { currentSession, isLoading } = useExtensionData();

    const cardTypes = ["overview", "activity", "focus", "score"] as const;

    // Handle scroll to change cards
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const scrollTop = container.scrollTop;
            const cardHeight = container.clientHeight;
            const newIndex = Math.round(scrollTop / cardHeight);
            if (
                newIndex !== currentIndex &&
                newIndex >= 0 &&
                newIndex < cardTypes.length
            ) {
                setCurrentIndex(newIndex);
            }
        };

        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, [currentIndex, cardTypes.length]);

    // Auto-play functionality
    const startAutoPlay = () => {
        if (autoPlayRef.current) {
            clearInterval(autoPlayRef.current);
        }
        setIsAutoPlaying(true);
        autoPlayRef.current = setInterval(() => {
            setCurrentIndex((prev) => {
                const next = prev + 1;
                if (next >= cardTypes.length) {
                    // Loop back to first slide
                    if (containerRef.current) {
                        containerRef.current.scrollTo({
                            top: 0,
                            behavior: "smooth",
                        });
                    }
                    return 0;
                }
                // Scroll to next card
                if (containerRef.current) {
                    containerRef.current.scrollTo({
                        top: next * containerRef.current.clientHeight,
                        behavior: "smooth",
                    });
                }
                return next;
            });
        }, 3000);
    };

    const stopAutoPlay = () => {
        if (autoPlayRef.current) {
            clearInterval(autoPlayRef.current);
            autoPlayRef.current = null;
        }
        setIsAutoPlaying(false);
    };

    const toggleAutoPlay = () => {
        if (isAutoPlaying) {
            stopAutoPlay();
        } else {
            startAutoPlay();
        }
    };

    // Start auto-play on mount
    useEffect(() => {
        startAutoPlay();
        return () => {
            if (autoPlayRef.current) {
                clearInterval(autoPlayRef.current);
            }
        };
    }, []);

    // Handle hover
    const handleMouseEnter = () => {
        stopAutoPlay();
    };

    const handleMouseLeave = () => {
        startAutoPlay();
    };

    if (isLoading || !currentSession) {
        return <div className="stories-container">Loading...</div>;
    }

    return (
        <div
            className="stories-container"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Scroll Container */}
            <div className="scroll-container" ref={containerRef}>
                {cardTypes.map((type) => (
                    <div key={type} className="card-wrapper">
                        <StoryCard
                            currentSession={currentSession}
                            cardType={type}
                            isAutoPlaying={isAutoPlaying}
                            onToggleAutoPlay={
                                type === "overview" ? toggleAutoPlay : undefined
                            }
                            currentIndex={currentIndex}
                            totalCards={cardTypes.length}
                            isDarkMode={isDarkMode}
                        />
                    </div>
                ))}
            </div>

            <style>
                {`
                .stories-container {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    border-radius: 12px;
                    overflow: hidden;
                }

                .scroll-container {
                    width: 100%;
                    height: 100%;
                    overflow-y: auto;
                    scroll-snap-type: y mandatory;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }

                .scroll-container::-webkit-scrollbar {
                    display: none;
                }

                .card-wrapper {
                    width: 100%;
                    height: 100%;
                    scroll-snap-align: start;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-sizing: border-box;
                }

                /* Mobile support */
                @media (pointer: coarse) and (hover: none) {
                    .scroll-container {
                        overflow-x: auto;
                        overflow-y: hidden;
                        display: flex;
                        scroll-snap-type: x mandatory;
                    }
                    .card-wrapper {
                        flex-shrink: 0;
                        width: 100%;
                        scroll-snap-align: center;
                    }
                }
                `}
            </style>
        </div>
    );
};

export default StoriesComponent;

// newbranch
