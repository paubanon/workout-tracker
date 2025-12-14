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

function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: Theme.Colors.primary,
                tabBarInactiveTintColor: Theme.Colors.textSecondary,
            }}
        >
            <Tab.Screen name="Workouts" component={WorkoutListScreen} />
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
