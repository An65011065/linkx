import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    location?: string;
    description?: string;
    attendees?: string[];
    completed?: boolean;
}

export interface AuthUser {
    uid: string;
    email: string;
    displayName: string | null;
    photoURL: string | null;
    accessToken: string;
    refreshToken: string | null;
    plan: string;
    subscriptionEnd: string | null;
    createdAt: number;
}

interface CalendarDataContextType {
    user: AuthUser | null;
    calendarEvents: CalendarEvent[];
    isLoading: boolean;
    error: string | null;
    loadCalendarEvents: () => Promise<void>;
    clearError: () => void;
}

const CalendarDataContext = createContext<CalendarDataContextType | undefined>(undefined);

export const useCalendarData = () => {
    const context = useContext(CalendarDataContext);
    if (context === undefined) {
        throw new Error('useCalendarData must be used within a CalendarDataProvider');
    }
    return context;
};

interface CalendarDataProviderProps {
    children: ReactNode;
}

export const CalendarDataProvider: React.FC<CalendarDataProviderProps> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastFetchTime, setLastFetchTime] = useState<number>(0);
    const [cachedEvents, setCachedEvents] = useState<CalendarEvent[]>([]);
    
    // Cache duration: 5 minutes
    const CACHE_DURATION = 5 * 60 * 1000;

    // Load user from storage - check multiple possible storage keys
    useEffect(() => {
        const loadUser = async () => {
            try {
                console.log('📊 CalendarDataProvider: Loading user from storage...');
                
                // Check all possible storage keys
                const result = await chrome.storage.local.get(['user', 'cachedUser', 'auth_user']);
                console.log('📊 Storage result:', result);
                
                let userData = null;
                
                // Try 'user' key first (JSON stringified)
                if (result.user) {
                    try {
                        userData = JSON.parse(result.user);
                        console.log('📊 Found user data in "user" key:', userData);
                    } catch (e) {
                        console.error('📊 Error parsing user from "user" key:', e);
                    }
                }
                
                // Try 'auth_user' key (direct object)
                if (!userData && result.auth_user) {
                    userData = result.auth_user;
                    console.log('📊 Found user data in "auth_user" key:', userData);
                }
                
                // Try 'cachedUser' key (direct object)
                if (!userData && result.cachedUser) {
                    userData = result.cachedUser;
                    console.log('📊 Found user data in "cachedUser" key:', userData);
                }
                
                if (userData) {
                    // Check if this user data has the required fields for calendar access
                    console.log('📊 User data fields:', Object.keys(userData));
                    console.log('📊 Has accessToken:', !!userData.accessToken);
                    console.log('📊 Has gmailToken:', !!userData.gmailToken);
                    
                    // If we have gmailToken but not accessToken, use gmailToken as accessToken
                    if (!userData.accessToken && userData.gmailToken) {
                        userData.accessToken = userData.gmailToken;
                        console.log('📊 Using gmailToken as accessToken');
                    }
                    
                    setUser(userData);
                } else {
                    console.log('📊 No user data found in any storage key');
                    setUser(null);
                }
            } catch (error) {
                console.error('📊 Error loading user:', error);
                setUser(null);
            }
        };
        loadUser();
    }, []);

    // Load cached events from storage on mount
    useEffect(() => {
        const loadCachedEvents = async () => {
            try {
                const result = await chrome.storage.local.get(['cachedCalendarEvents', 'lastCalendarFetch']);
                if (result.cachedCalendarEvents && result.lastCalendarFetch) {
                    const cachedTime = result.lastCalendarFetch;
                    const now = Date.now();
                    
                    if (now - cachedTime < CACHE_DURATION) {
                        console.log('📊 Using cached calendar events');
                        const cached = JSON.parse(result.cachedCalendarEvents).map((event: any) => ({
                            ...event,
                            start: new Date(event.start),
                            end: new Date(event.end)
                        }));
                        setCachedEvents(cached);
                        setCalendarEvents(cached);
                        setLastFetchTime(cachedTime);
                    }
                }
            } catch (error) {
                console.error('📊 Error loading cached events:', error);
            }
        };
        loadCachedEvents();
    }, []);

    // Load calendar events when user changes
    useEffect(() => {
        if (user) {
            console.log('📊 User changed, loading calendar events...');
            const now = Date.now();
            // Only fetch if cache is expired or empty
            if (now - lastFetchTime > CACHE_DURATION || cachedEvents.length === 0) {
                loadCalendarEvents();
            } else {
                console.log('📊 Using cached events, not fetching');
                setCalendarEvents(cachedEvents);
            }
        } else {
            console.log('📊 No user, clearing calendar events');
            setCalendarEvents([]);
            setError(null);
        }
    }, [user]);

    const loadCalendarEvents = async (forceRefresh = false) => {
        if (!user?.accessToken) {
            console.log('📊 No access token available, user:', user);
            setCalendarEvents([]);
            setError('No access token available');
            return;
        }

        // Check cache first unless force refresh
        const now = Date.now();
        if (!forceRefresh && now - lastFetchTime < CACHE_DURATION && cachedEvents.length > 0) {
            console.log('📊 Using cached events, skipping API call');
            setCalendarEvents(cachedEvents);
            return;
        }

        console.log('📊 Loading calendar events for user:', user.email);
        setIsLoading(true);
        setError(null);
        
        try {
            const currentDate = new Date();
            // Start from beginning of today to include all past events from today
            const startOfToday = new Date(currentDate);
            startOfToday.setHours(0, 0, 0, 0);
            const endOfTomorrow = new Date(currentDate);
            endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
            endOfTomorrow.setHours(23, 59, 59, 999);

            const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
                new URLSearchParams({
                    timeMin: startOfToday.toISOString(),
                    timeMax: endOfTomorrow.toISOString(),
                    singleEvents: 'true',
                    orderBy: 'startTime',
                    maxResults: '50',
                });

            console.log('📊 Fetching calendar events from:', url);
            console.log('📊 Using access token:', user.accessToken.substring(0, 20) + '...');

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${user.accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            console.log('📊 Calendar API response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('📊 Calendar API error:', errorText);
                
                if (response.status === 401) {
                    setError('Authentication expired. Please log in again.');
                } else if (response.status === 403) {
                    setError('Calendar access denied. Please check permissions.');
                } else if (response.status >= 500) {
                    setError('Google Calendar service is temporarily unavailable.');
                } else {
                    setError(`Unable to load calendar events (${response.status})`);
                }
                
                // If we have cached events and this is a temporary error, keep showing them
                if (cachedEvents.length > 0 && response.status >= 500) {
                    console.log('📊 Using cached events due to server error');
                    setCalendarEvents(cachedEvents);
                }
                return;
            }

            const data = await response.json();
            console.log('📊 Calendar API response data:', data);
            console.log('📊 Number of events received:', data.items?.length || 0);
            
            // Load event completion states from storage
            const result = await chrome.storage.local.get(['calendarEventStates']);
            const eventStates = result.calendarEventStates
                ? JSON.parse(result.calendarEventStates)
                : {};

            const events: CalendarEvent[] = data.items?.map((item: any) => {
                const event = {
                    id: item.id,
                    title: item.summary || 'No title',
                    start: new Date(item.start.dateTime || item.start.date),
                    end: new Date(item.end.dateTime || item.end.date),
                    location: item.location,
                    description: item.description,
                    attendees: item.attendees?.map((attendee: any) => attendee.email) || [],
                    completed: eventStates[item.id] || false,
                };
                console.log('📊 Parsed event:', event.title, 'at', event.start);
                return event;
            }) || [];

            console.log('📊 Setting calendar events:', events.length);
            setCalendarEvents(events);
            setCachedEvents(events);
            setLastFetchTime(now);
            
            // Cache the events
            try {
                await chrome.storage.local.set({
                    cachedCalendarEvents: JSON.stringify(events),
                    lastCalendarFetch: now
                });
                console.log('📊 Events cached successfully');
            } catch (cacheError) {
                console.error('📊 Failed to cache events:', cacheError);
            }
            
        } catch (error) {
            console.error('📊 Failed to load calendar events:', error);
            setError('Failed to connect to Google Calendar. Please check your connection.');
            
            // If we have cached events, keep showing them
            if (cachedEvents.length > 0) {
                console.log('📊 Using cached events due to network error');
                setCalendarEvents(cachedEvents);
            } else {
                setCalendarEvents([]);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const clearError = () => {
        setError(null);
    };

    const value: CalendarDataContextType = {
        user,
        calendarEvents,
        isLoading,
        error,
        loadCalendarEvents,
        clearError,
    };

    console.log('📊 CalendarDataProvider rendering with:', {
        user: user ? user.email : 'none',
        eventCount: calendarEvents.length,
        isLoading,
        error: error || 'none'
    });

    return (
        <CalendarDataContext.Provider value={value}>
            {children}
        </CalendarDataContext.Provider>
    );
};