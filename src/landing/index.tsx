import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./appRouter";
import { CalendarDataProvider } from "../components/CalendarDataProvider";

const root = ReactDOM.createRoot(
    document.getElementById("root") as HTMLElement,
);

root.render(
    <React.StrictMode>
        <CalendarDataProvider>
            <AppRouter />
        </CalendarDataProvider>
    </React.StrictMode>,
);
