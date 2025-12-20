import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Theme } from '../theme'; // Keep for static values/types if needed

import { WorkoutListScreen } from '../screens/workout/WorkoutListScreen';
import { ActiveSessionScreen } from '../screens/workout/ActiveSessionScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { CreateExerciseScreen } from '../screens/exercises/CreateExerciseScreen';
import { ExerciseListScreen } from '../screens/exercises/ExerciseListScreen';
import { CreateWorkoutScreen } from '../screens/workout/CreateWorkoutScreen';
import { HistoryScreen } from '../screens/history/HistoryScreen';
import { WorkoutHistoryDetailScreen } from '../screens/history/WorkoutHistoryDetailScreen';
import { EditWorkoutScreen } from '../screens/history/EditWorkoutScreen';
import { CreateScreen } from '../screens/create/CreateScreen';
import { AnalysisScreen } from '../screens/analysis/AnalysisScreen';
import { AuthScreen } from '../screens/auth/AuthScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
    const { colors, isDark } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarStyle: {
                    borderTopColor: colors.border,
                    backgroundColor: colors.surface,
                    ...(isDark ? Theme.TopLight.l : Theme.Shadows.light.l), // TopLight in dark, shadow in light
                    borderTopWidth: isDark ? 0 : 0, // TopLight adds its own border
                },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: any;

                    if (route.name === 'Start') {
                        iconName = focused ? 'play-circle' : 'play-circle-outline';
                    } else if (route.name === 'Create') {
                        iconName = focused ? 'add-circle' : 'add-circle-outline';
                    } else if (route.name === 'Analysis') {
                        iconName = focused ? 'bar-chart' : 'bar-chart-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} style={{ strokeWidth: 2 } as any} />;
                },
            })}
        >
            <Tab.Screen
                name="Start"
                component={WorkoutListScreen}
                options={{ title: 'Start' }}
            />
            <Tab.Screen name="Create" component={CreateScreen} />
            <Tab.Screen name="Analysis" component={AnalysisScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

export const RootNavigator = () => {
    const { session, isLoading } = useAuth();
    const { colors, isDark } = useTheme();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const MyNavigationTheme = {
        ...DefaultTheme,
        colors: {
            ...DefaultTheme.colors,
            primary: colors.primary,
            background: colors.background,
            card: colors.surface,
            text: colors.text,
            border: colors.border,
            notification: colors.danger,
        },
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <NavigationContainer theme={MyNavigationTheme}>
                <Stack.Navigator
                    screenOptions={{
                        headerShown: false,
                        headerStyle: { backgroundColor: colors.surface },
                        headerTintColor: colors.text,
                        headerTitleStyle: { fontWeight: 'bold' },
                        contentStyle: { backgroundColor: colors.background }
                    }}
                >
                    {!session ? (
                        <Stack.Screen name="Auth" component={AuthScreen} />
                    ) : (
                        <>
                            <Stack.Screen name="Tabs" component={TabNavigator} />
                            <Stack.Screen
                                name="ActiveSession"
                                component={ActiveSessionScreen}
                                options={{ presentation: 'fullScreenModal' }}
                            />
                            <Stack.Screen
                                name="CreateExercise"
                                component={CreateExerciseScreen}
                                options={{ presentation: 'modal' }}
                            />
                            <Stack.Screen
                                name="ExerciseList"
                                component={ExerciseListScreen}
                                options={{ presentation: 'modal' }}
                            />
                            <Stack.Screen
                                name="CreateWorkout"
                                component={CreateWorkoutScreen}
                                options={{ presentation: 'modal' }}
                            />
                            <Stack.Screen
                                name="History"
                                component={HistoryScreen}
                                options={{ title: 'History', headerShown: false }}
                            />
                            <Stack.Screen
                                name="Settings"
                                component={SettingsScreen}
                                options={{ title: 'Settings', headerShown: true }}
                            />
                            <Stack.Screen
                                name="WorkoutHistoryDetail"
                                component={WorkoutHistoryDetailScreen}
                                options={{ presentation: 'modal', title: 'Workout Details' }}
                            />
                            <Stack.Screen
                                name="EditWorkout"
                                component={EditWorkoutScreen}
                                options={{ presentation: 'modal', title: 'Edit Workout' }}
                            />
                        </>
                    )}
                </Stack.Navigator>
            </NavigationContainer>
        </GestureHandlerRootView>
    );
};
