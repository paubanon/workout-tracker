import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Keyboard, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ExerciseGoal } from '../models';
import { getGoalDisplayName, getDaysToComplete } from '../utils/goalHelper';

interface GoalAchievedToastProps {
    goal: ExerciseGoal;
    exerciseName: string;
    visible: boolean;
    onHide: () => void;
}

export const GoalAchievedToast: React.FC<GoalAchievedToastProps> = ({
    goal,
    exerciseName,
    visible,
    onHide
}) => {
    const { colors } = useTheme();
    const fadeAnim = React.useRef(new Animated.Value(0)).current;

    // No keyboard tracking needed - toast displays at top

    useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true
            }).start();

            const timer = setTimeout(() => {
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true
                }).start(() => onHide());
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!visible) return null;

    const days = getDaysToComplete(goal.createdAt);
    const daysText = days === 0 ? 'today' : days === 1 ? 'in 1 day' : `in ${days} days`;

    return (
        <Animated.View
            style={[
                styles.container,
                { backgroundColor: colors.success, opacity: fadeAnim }
            ]}
        >
            <Text style={styles.emoji}>🎉</Text>
            <View style={styles.textContainer}>
                <Text style={styles.title}>Goal Achieved!</Text>
                <Text style={styles.goalName} numberOfLines={1}>
                    {exerciseName}: {getGoalDisplayName(goal)}
                </Text>
                <Text style={styles.subtitle}>
                    Completed {daysText}. Great work!
                </Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        zIndex: 9999,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 9999,
    },
    emoji: {
        fontSize: 32,
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    goalName: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
        marginTop: 2,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        marginTop: 4,
    },
});
