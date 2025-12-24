import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabaseService } from '../services/SupabaseDataService';
import { Theme, LightColors, DarkColors, ThemeMode, ThemeColors, Shadows, DateFormat, formatDateWithFormat, formatDateShortWithFormat } from '../theme';
import { useAuth } from './AuthContext';

interface ThemeContextType {
    theme: ThemeMode;
    toggleTheme: () => void;
    setTheme: (mode: ThemeMode) => void;
    colors: ThemeColors;
    shadows: typeof Shadows.light;
    isDark: boolean;
    // Date format
    dateFormat: DateFormat;
    setDateFormat: (format: DateFormat) => void;
    formatDate: (date: string | Date) => string;
    formatDateShort: (date: string | Date) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<ThemeMode>('dark');
    const [dateFormat, setDateFormatState] = useState<DateFormat>('DD/MM/YYYY');
    const { session } = useAuth();

    // 1. Load from local storage on mount
    useEffect(() => {
        loadPreferences();
    }, []);

    // 2. Sync with Supabase on login
    useEffect(() => {
        if (session?.user) {
            syncPreferencesWithProfile();
        }
    }, [session]);

    const loadPreferences = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('user_theme');
            const savedDateFormat = await AsyncStorage.getItem('user_date_format');
            if (savedTheme === 'light' || savedTheme === 'dark') {
                setThemeState(savedTheme);
            }
            if (savedDateFormat === 'DD/MM/YYYY' || savedDateFormat === 'MM/DD/YYYY' || savedDateFormat === 'YYYY-MM-DD') {
                setDateFormatState(savedDateFormat);
            }
        } catch (e) {
            console.error('Failed to load preferences from storage', e);
        }
    };

    const syncPreferencesWithProfile = async () => {
        const profile = await supabaseService.getUserProfile();
        if (profile?.preferences?.theme) {
            const remoteTheme = profile.preferences.theme as ThemeMode;
            setThemeState(currentTheme => {
                if (remoteTheme !== currentTheme) {
                    AsyncStorage.setItem('user_theme', remoteTheme);
                    return remoteTheme;
                }
                return currentTheme;
            });
        }
        if (profile?.preferences?.dateFormat) {
            const remoteDateFormat = profile.preferences.dateFormat as DateFormat;
            setDateFormatState(currentFormat => {
                if (remoteDateFormat !== currentFormat) {
                    AsyncStorage.setItem('user_date_format', remoteDateFormat);
                    return remoteDateFormat;
                }
                return currentFormat;
            });
        }
    };

    const setTheme = useCallback(async (mode: ThemeMode) => {
        setThemeState(mode);
        await AsyncStorage.setItem('user_theme', mode);

        // Update Supabase if user is logged in
        if (session?.user) {
            const profile = await supabaseService.getUserProfile();
            await supabaseService.updateUserProfile({
                preferences: {
                    ...profile?.preferences,
                    theme: mode
                }
            });
        }
    }, [session]);

    const setDateFormat = useCallback(async (format: DateFormat) => {
        setDateFormatState(format);
        await AsyncStorage.setItem('user_date_format', format);

        // Update Supabase if user is logged in
        if (session?.user) {
            const profile = await supabaseService.getUserProfile();
            await supabaseService.updateUserProfile({
                preferences: {
                    ...profile?.preferences,
                    dateFormat: format
                }
            });
        }
    }, [session]);

    const toggleTheme = useCallback(() => {
        setThemeState(currentTheme => {
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            // Async operations in a separate effect or fire-and-forget
            AsyncStorage.setItem('user_theme', newTheme);
            if (session?.user) {
                supabaseService.getUserProfile().then(profile => {
                    supabaseService.updateUserProfile({
                        preferences: {
                            ...profile?.preferences,
                            theme: newTheme
                        }
                    });
                });
            }
            return newTheme;
        });
    }, [session]);

    // Memoize derived values to ensure stable references
    const colors = useMemo(() => theme === 'light' ? LightColors : DarkColors, [theme]);
    const shadows = useMemo(() => theme === 'light' ? Shadows.light : Shadows.dark, [theme]);
    const isDark = theme === 'dark';

    // Date formatting functions that use user's preference
    const formatDate = useCallback((date: string | Date) => formatDateWithFormat(date, dateFormat), [dateFormat]);
    const formatDateShortFn = useCallback((date: string | Date) => formatDateShortWithFormat(date, dateFormat), [dateFormat]);

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        theme,
        toggleTheme,
        setTheme,
        colors,
        shadows,
        isDark,
        dateFormat,
        setDateFormat,
        formatDate,
        formatDateShort: formatDateShortFn
    }), [theme, toggleTheme, setTheme, colors, shadows, isDark, dateFormat, setDateFormat, formatDate, formatDateShortFn]);

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
