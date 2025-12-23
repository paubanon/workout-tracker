import React, { createContext, useContext, useState, useEffect } from 'react';
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
            if (remoteTheme !== theme) {
                setThemeState(remoteTheme);
                await AsyncStorage.setItem('user_theme', remoteTheme);
            }
        }
    };

    const setTheme = async (mode: ThemeMode) => {
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
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    };

    const colors = theme === 'light' ? LightColors : DarkColors;
    const shadows = theme === 'light' ? Shadows.light : Shadows.dark;

    return (
        <ThemeContext.Provider value={{
            theme,
            toggleTheme,
            setTheme,
            colors,
            shadows,
            isDark: theme === 'dark'
        }}>
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
