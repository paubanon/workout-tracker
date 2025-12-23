import React from 'react';
import { SafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

/**
 * ThemedSafeAreaView - A wrapper around SafeAreaView that forces re-render on theme change.
 * 
 * This solves the issue where React Native's SafeAreaView and its children don't
 * re-render when theme context changes. By using a key based on the current theme,
 * we force React to remount the entire tree when the theme switches.
 * 
 * Use this instead of SafeAreaView in screens that need to respond to theme changes.
 */
export const ThemedSafeAreaView: React.FC<SafeAreaViewProps> = ({ children, style, ...props }) => {
    const { colors, isDark } = useTheme();

    return (
        <SafeAreaView
            key={isDark ? 'dark' : 'light'}
            style={[{ backgroundColor: colors.background }, style]}
            {...props}
        >
            {children}
        </SafeAreaView>
    );
};
