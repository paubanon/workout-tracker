import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Theme } from '../theme';
// Removed for clarity, logic moved to App.tsx or inside RootNavigator component if I combined them.
// Actually I will keep specific RootNavigator component clean and wrap in App.tsx

import { WorkoutListScreen } from '../screens/workout/WorkoutListScreen';
import { ActiveSessionScreen } from '../screens/workout/ActiveSessionScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { WeightHistoryScreen } from '../screens/profile/WeightHistoryScreen';
import { CreateExerciseScreen } from '../screens/exercises/CreateExerciseScreen';
import { EditExerciseScreen } from '../screens/exercises/EditExerciseScreen';
import { ExerciseListScreen } from '../screens/exercises/ExerciseListScreen';
import { CreateWorkoutScreen } from '../screens/workout/CreateWorkoutScreen';
import { HistoryScreen } from '../screens/history/HistoryScreen';
import { WorkoutHistoryDetailScreen } from '../screens/history/WorkoutHistoryDetailScreen';
import { EditWorkoutScreen } from '../screens/history/EditWorkoutScreen';
import { GoalsListScreen } from '../screens/goals/GoalsListScreen';
import { ExerciseGoalsScreen } from '../screens/goals/ExerciseGoalsScreen';
import { CreateGoalScreen } from '../screens/goals/CreateGoalScreen';
import { PostWorkoutCreationGoalsScreen } from '../screens/goals/PostWorkoutCreationGoalsScreen';

import { Ionicons } from '@expo/vector-icons';
import { CreateScreen } from '../screens/create/CreateScreen';
import { AnalysisScreen } from '../screens/analysis/AnalysisScreen';
import { AuthScreen } from '../screens/auth/AuthScreen';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { View, ActivityIndicator } from 'react-native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
    const { colors } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarStyle: {
                    borderTopColor: colors.border,
                    backgroundColor: colors.surface,
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

                    return <Ionicons name={iconName} size={size} color={color} />;
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

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export const RootNavigator = () => {
    const { session, isLoading } = useAuth();
    const { colors } = useTheme();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    // Create navigation theme that reacts to context changes
    const navigationTheme = {
        dark: colors.background === '#121212', // Check if using dark colors
        colors: {
            primary: colors.primary,
            background: colors.background,
            card: colors.surface,
            text: colors.text,
            border: colors.border,
            notification: colors.primary,
        },
        fonts: {
            regular: { fontFamily: 'System', fontWeight: '400' as const },
            medium: { fontFamily: 'System', fontWeight: '500' as const },
            bold: { fontFamily: 'System', fontWeight: '700' as const },
            heavy: { fontFamily: 'System', fontWeight: '900' as const },
        },
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <NavigationContainer theme={navigationTheme}>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
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
                                name="EditExercise"
                                component={EditExerciseScreen}
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
                                options={{ title: 'History' }}
                            />
                            <Stack.Screen
                                name="Settings"
                                component={SettingsScreen}
                                options={{ title: 'Settings' }}
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
                            <Stack.Screen
                                name="WeightHistory"
                                component={WeightHistoryScreen}
                                options={{ title: 'Weight History' }}
                            />
                            <Stack.Screen
                                name="GoalsList"
                                component={GoalsListScreen}
                                options={{ presentation: 'modal' }}
                            />
                            <Stack.Screen
                                name="ExerciseGoals"
                                component={ExerciseGoalsScreen}
                                options={{ presentation: 'modal' }}
                            />
                            <Stack.Screen
                                name="CreateGoal"
                                component={CreateGoalScreen}
                                options={{ presentation: 'modal' }}
                            />
                            <Stack.Screen
                                name="PostWorkoutCreationGoals"
                                component={PostWorkoutCreationGoalsScreen}
                                options={{ presentation: 'modal' }}
                            />
                        </>
                    )}
                </Stack.Navigator>
            </NavigationContainer>
        </GestureHandlerRootView>
    );
};
