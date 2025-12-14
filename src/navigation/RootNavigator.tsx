import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Theme } from '../theme';
import { View, Text } from 'react-native';

import { WorkoutListScreen } from '../screens/workout/WorkoutListScreen';
import { ActiveSessionScreen } from '../screens/workout/ActiveSessionScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { CreateExerciseScreen } from '../screens/exercises/CreateExerciseScreen';
import { ExerciseListScreen } from '../screens/exercises/ExerciseListScreen';
import { CreateWorkoutScreen } from '../screens/workout/CreateWorkoutScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

import { Ionicons } from '@expo/vector-icons';
import { CreateScreen } from '../screens/create/CreateScreen';
import { AnalysisScreen } from '../screens/analysis/AnalysisScreen';

function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: Theme.Colors.primary,
                tabBarInactiveTintColor: Theme.Colors.textSecondary,
                tabBarStyle: {
                    borderTopColor: Theme.Colors.border,
                    backgroundColor: Theme.Colors.surface,
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

export const RootNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
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
            </Stack.Navigator>
        </NavigationContainer>
    );
};
