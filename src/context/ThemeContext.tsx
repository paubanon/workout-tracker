import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabaseService } from '../services/SupabaseDataService';
import { Theme, LightColors, DarkColors, ThemeMode, ThemeColors, Shadows } from '../theme';
import { useAuth } from './AuthContext';

interface ThemeContextType {
    theme: ThemeMode;
    toggleTheme: () => void;
    setTheme: (mode: ThemeMode) => void;
    colors: ThemeColors;
    shadows: typeof Shadows.light;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<ThemeMode>('dark');
    const { session } = useAuth();

    // 1. Load from local storage on mount
    useEffect(() => {
        loadTheme();
    }, []);

    // 2. Sync with Supabase on login
    useEffect(() => {
        if (session?.user) {
            syncThemeWithProfile();
        }
    }, [session]);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('user_theme');
            if (savedTheme === 'light' || savedTheme === 'dark') {
                setThemeState(savedTheme);
            }
        } catch (e) {
            console.error('Failed to load theme from storage', e);
        }
    };

    const syncThemeWithProfile = async () => {
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

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        theme,
        toggleTheme,
        setTheme,
        colors,
        shadows,
        isDark
    }), [theme, toggleTheme, setTheme, colors, shadows, isDark]);

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
