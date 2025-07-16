import React, { useRef, useEffect, useState } from "react";
import { useExtensionData } from "../../data/useExtensionData";
import { StoryCard } from "../components/StoryCard";

interface StoriesComponentProps {
    isDarkMode?: boolean;
}

const STORY_DURATION = 4000; // 2 seconds per story
const TOTAL_STORIES = 4;

const StoriesComponent: React.FC<StoriesComponentProps> = ({
    isDarkMode = false,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const {
        currentSession,
        isLoading,
        topDomains,
        longestStreak,
        longestBreak,
        sleepPatterns,
        wellnessScore,
    } = useExtensionData();
    const intervalRef = useRef<number | undefined>(undefined);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);

    const cardTypes = ["overview", "activity", "focus", "score"] as const;

    // Scroll to specific card
    const scrollToCard = (index: number) => {
        if (containerRef.current) {
            containerRef.current.scrollTo({
                top: index * containerRef.current.clientHeight,
                behavior: "smooth",
            });
        }
    };

    // Main timer logic
    useEffect(() => {
        if (isPaused) return;

        const interval = setInterval(() => {
            setProgress((prev) => {
                const newProgress = prev + 100 / (STORY_DURATION / 100); // Update every 100ms

                if (newProgress >= 100) {
                    // Move to next card
                    setCurrentIndex((prevIndex) => {
                        const nextIndex = (prevIndex + 1) % TOTAL_STORIES;
                        scrollToCard(nextIndex);
                        return nextIndex;
                    });
                    return 0; // Reset progress
                }

                return newProgress;
            });
        }, 100);

        intervalRef.current = interval;
        return () => clearInterval(interval);
    }, [isPaused, currentIndex]);

    // Calculate progress values for all bars
    const getProgressValues = () => {
        const values = Array(TOTAL_STORIES).fill(0);

        // Fill completed bars
        for (let i = 0; i < currentIndex; i++) {
            values[i] = 100;
        }

        // Current bar gets the current progress
        values[currentIndex] = progress;

        return values;
    };

    // Handle bar clicks
    const handleBarClick = (index: number) => {
        setCurrentIndex(index);
        setProgress(0);
        scrollToCard(index);
    };

    if (isLoading || !currentSession) {
        return <div>Loading...</div>;
    }

    const progressValues = getProgressValues();

    return (
        <div
            className="relative w-full h-full rounded-xl overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Progress Bars */}
            <div className="absolute bottom-4 right-7 flex gap-1 z-50 w-32">
                {cardTypes.map((_, index) => (
                    <div
                        key={index}
                        className={`flex-1 h-0.5 cursor-pointer rounded-full overflow-hidden ${
                            isDarkMode ? "bg-white/20" : "bg-black/20"
                        }`}
                        onClick={() => handleBarClick(index)}
                    >
                        <div
                            className={`h-full transition-all duration-100 ease-linear origin-left ${
                                isDarkMode ? "bg-white/90" : "bg-black/90"
                            }`}
                            style={{
                                transform: `scaleX(${
                                    progressValues[index] / 100
                                })`,
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Cards */}
            <div
                className="w-full h-full overflow-y-auto snap-y snap-mandatory"
                ref={containerRef}
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                {cardTypes.map((type) => (
                    <div
                        key={type}
                        className="w-full h-full snap-start flex items-center justify-center"
                    >
                        <StoryCard
                            currentSession={currentSession}
                            cardType={type}
                            isDarkMode={isDarkMode}
                            topDomains={topDomains}
                            longestStreak={longestStreak}
                            longestBreak={longestBreak}
                            sleepPatterns={sleepPatterns}
                            wellnessScore={wellnessScore}
                        />
                    </div>
                ))}
            </div>

            <style jsx>{`
                div::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
};

export default StoriesComponent;
