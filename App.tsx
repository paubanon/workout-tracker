import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

// Wrapper component to access theme context for StatusBar
const ThemedStatusBar = () => {
    const { isDark } = useTheme();
    return <StatusBar style={isDark ? 'light' : 'dark'} />;
};

export default function App() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <SafeAreaProvider>
                    <ThemedStatusBar />
                    <RootNavigator />
                </SafeAreaProvider>
            </ThemeProvider>
        </AuthProvider>
    );
}
