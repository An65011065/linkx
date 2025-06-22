// urlFormatter.ts - URL formatting utilities

const NEW_TAB_ICON =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTkgM0g1QzMuODkgMyAzIDMuOSAzIDVWMTlDMyAyMC4xIDMuODkgMjEgNSAyMUgxOUMyMC4xIDIxIDIxIDIwLjEgMjEgMTlWNUMyMSAzLjkgMjAuMSAzIDE5IDNaTTUgMTlWNUgxOVYxOUg1WiIgZmlsbD0iIzJkMzQzNiIvPjxwYXRoIGQ9Ik0xNyA3SDdWOUgxN1Y3WiIgZmlsbD0iIzJkMzQzNiIvPjxwYXRoIGQ9Ik0xNyAxMUg3VjEzSDE3VjExWiIgZmlsbD0iIzJkMzQzNiIvPjxwYXRoIGQ9Ik0xNyAxNUg3VjE3SDE3VjE1WiIgZmlsbD0iIzJkMzQzNiIvPjwvc3ZnPg==";

export const isNewTabUrl = (url: string): boolean => {
    return (
        url === "chrome://newtab/" ||
        url === "about:blank" ||
        url === "chrome://new-tab-page/"
    );
};

export const getIconUrl = (url: string): string => {
    if (isNewTabUrl(url)) {
        return NEW_TAB_ICON;
    }
    return `chrome://favicon/size/32/${url}`;
};

export const formatUrl = (url: string): string => {
    if (isNewTabUrl(url)) {
        return "New Tab";
    }
    try {
        const urlObj = new URL(url);
        let displayText = urlObj.hostname.replace("www.", "");
        if (urlObj.pathname !== "/") {
            const pathSegments = urlObj.pathname.split("/").filter(Boolean);
            if (pathSegments.length > 0) {
                displayText += "/" + pathSegments[0];
            }
        }
        return displayText;
    } catch {
        return url;
    }
};
