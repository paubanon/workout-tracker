import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';

export default function App() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <SafeAreaProvider>
                    <StatusBar style="auto" />
                    <RootNavigator />
                </SafeAreaProvider>
            </ThemeProvider>
        </AuthProvider>
    );
}
