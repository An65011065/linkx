import React, { useState } from "react";
import LandingPage from "./landing";
import DataLandingPage from "./dataLanding";
import NetworkLandingPage from "./networkLanding";

const AppRouter: React.FC = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [currentPage, setCurrentPage] = useState<"main" | "data" | "network">(
        "main",
    );

    const handleToggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
    };

    const handleNavigate = (page: "main" | "data" | "network") => {
        setCurrentPage(page);
    };

    // Render the appropriate page based on currentPage state
    switch (currentPage) {
        case "main":
            return (
                <LandingPage
                    isDarkMode={isDarkMode}
                    onToggleDarkMode={handleToggleDarkMode}
                    currentPage={currentPage}
                    onNavigate={handleNavigate}
                />
            );
        case "data":
            return (
                <DataLandingPage
                    isDarkMode={isDarkMode}
                    onToggleDarkMode={handleToggleDarkMode}
                    currentPage={currentPage}
                    onNavigate={handleNavigate}
                />
            );
        case "network":
            return (
                <NetworkLandingPage
                    isDarkMode={isDarkMode}
                    onToggleDarkMode={handleToggleDarkMode}
                    currentPage={currentPage}
                    onNavigate={handleNavigate}
                />
            );
        default:
            return (
                <LandingPage
                    isDarkMode={isDarkMode}
                    onToggleDarkMode={handleToggleDarkMode}
                    currentPage={currentPage}
                    onNavigate={handleNavigate}
                />
            );
    }
};

export default AppRouter;
