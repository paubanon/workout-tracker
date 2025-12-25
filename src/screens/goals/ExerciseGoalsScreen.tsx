import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { GlowCard } from '../../components/GlowCard';
import { CircularProgress } from '../../components/CircularProgress';
import { supabaseService } from '../../services/SupabaseDataService';
import { ExerciseGoal, MetricType, SetLog } from '../../models';
import { calculateGoalProgress } from '../../utils/goalHelper';

const METRIC_LABELS: Record<string, string> = {
    targetLoad: 'Load',
    targetReps: 'Reps',
    targetTime: 'Time',
    targetDistance: 'Distance',
    targetRom: 'ROM'
};

const METRIC_UNITS: Record<string, string> = {
    targetLoad: 'kg',
    targetReps: '',
    targetTime: 's',
    targetDistance: 'm',
    targetRom: 'cm'
};

export const ExerciseGoalsScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { colors, isDark } = useTheme();
    const { exerciseId, exerciseName, enabledMetrics, repsType, trackBodyWeight } = route.params;

    const [goals, setGoals] = useState<ExerciseGoal[]>([]);
    const [history, setHistory] = useState<SetLog[]>([]);
    const [loading, setLoading] = useState(true);

    const loadGoals = async () => {
        setLoading(true);
        const [goalsData, historyData] = await Promise.all([
            supabaseService.getGoalsForExercise(exerciseId),
            supabaseService.getExerciseHistory(exerciseId)
        ]);
        setGoals(goalsData);
        setHistory(historyData);
        setLoading(false);
    };

    useFocusEffect(
        useCallback(() => {
            loadGoals();
        }, [exerciseId])
    );

    const handleDeleteGoal = (goal: ExerciseGoal) => {
        Alert.alert(
            'Delete Goal',
            `Are you sure you want to delete "${goal.name || 'this goal'}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await supabaseService.deleteGoal(goal.id);
                        loadGoals();
                    }
                }
            ]
        );
    };

    const getGoalDisplayName = (goal: ExerciseGoal): string => {
        if (goal.name) return goal.name;
        const parts: string[] = [];
        if (goal.targetLoad) parts.push(`${goal.targetLoad}kg`);
        if (goal.targetReps) parts.push(`${goal.targetReps} reps`);
        if (goal.targetTime) parts.push(`${goal.targetTime}s`);
        if (goal.targetDistance) parts.push(`${goal.targetDistance}m`);
        if (goal.targetRom) parts.push(`ROM ${goal.targetRom}cm`);
        return parts.join(' × ') || 'Goal';
    };

    const getMetricProgress = (goal: ExerciseGoal): { metric: string; target: number; unit: string }[] => {
        const metrics: { metric: string; target: number; unit: string }[] = [];
        if (goal.targetLoad) metrics.push({ metric: 'Load', target: goal.targetLoad, unit: 'kg' });
        if (goal.targetReps) metrics.push({ metric: 'Reps', target: goal.targetReps, unit: '' });
        if (goal.targetTime) metrics.push({ metric: 'Time', target: goal.targetTime, unit: 's' });
        if (goal.targetDistance) metrics.push({ metric: 'Distance', target: goal.targetDistance, unit: 'm' });
        if (goal.targetRom) metrics.push({ metric: 'ROM', target: goal.targetRom, unit: 'cm' });
        return metrics;
    };

    const renderGoalCard = ({ item: goal }: { item: ExerciseGoal }) => {
        const metrics = getMetricProgress(goal);
        const progress = goal.completed ? 100 : calculateGoalProgress(goal, history);

        return (
            <GlowCard style={styles.card} level="m">
                <TouchableOpacity
                    style={styles.cardContent}
                    onPress={() => navigation.navigate('CreateGoal', {
                        exerciseId,
                        exerciseName,
                        enabledMetrics,
                        repsType,
                        trackBodyWeight,
                        goalToEdit: goal
                    })}
                    onLongPress={() => handleDeleteGoal(goal)}
                >
                    <CircularProgress progress={progress} size={56} />
                    <View style={styles.goalInfo}>
                        <Text style={[styles.goalName, { color: colors.text }]}>
                            {getGoalDisplayName(goal)}
                        </Text>
                        {goal.completed && (
                            <Text style={[styles.completedText, { color: colors.success }]}>
                                ✓ Completed{goal.completedAt ? ` ${new Date(goal.completedAt).toLocaleDateString()}` : ''}
                            </Text>
                        )}
                        <View style={styles.metricsRow}>
                            {metrics.map((m, i) => (
                                <Text key={i} style={[styles.metricText, { color: colors.textMuted }]}>
                                    {m.metric}: {m.target}{m.unit}
                                    {i < metrics.length - 1 ? ' • ' : ''}
                                </Text>
                            ))}
                        </View>
                    </View>
                </TouchableOpacity>
            </GlowCard>
        );
    };

    const activeGoals = goals.filter(g => !g.completed);
    const completedGoals = goals.filter(g => g.completed);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                    {exerciseName}
                </Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('CreateGoal', {
                        exerciseId,
                        exerciseName,
                        enabledMetrics,
                        repsType,
                        trackBodyWeight
                    })}
                >
                    <Ionicons name="add" size={28} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={[...activeGoals, ...completedGoals]}
                keyExtractor={item => item.id}
                renderItem={renderGoalCard}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="flag-outline" size={48} color={colors.textMuted} />
                            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                No goals for this exercise
                            </Text>
                            <TouchableOpacity
                                style={[styles.addButton, { backgroundColor: colors.primary }]}
                                onPress={() => navigation.navigate('CreateGoal', {
                                    exerciseId,
                                    exerciseName,
                                    enabledMetrics,
                                    repsType,
                                    trackBodyWeight
                                })}
                            >
                                <Text style={styles.addButtonText}>Add Goal</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Theme.Spacing.m,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: Theme.Typography.scale.lg,
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: Theme.Spacing.s,
    },
    list: {
        padding: Theme.Spacing.m,
    },
    card: {
        borderRadius: 12,
        marginBottom: Theme.Spacing.m,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Theme.Spacing.m,
    },
    goalInfo: {
        flex: 1,
        marginLeft: Theme.Spacing.m,
    },
    goalName: {
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 4,
    },
    completedText: {
        fontSize: 13,
        marginBottom: 4,
    },
    metricsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    metricText: {
        fontSize: 13,
    },
    emptyState: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: Theme.Spacing.xl * 2,
    },
    emptyText: {
        fontSize: 16,
        marginTop: Theme.Spacing.m,
        marginBottom: Theme.Spacing.l,
    },
    addButton: {
        paddingHorizontal: Theme.Spacing.l,
        paddingVertical: Theme.Spacing.s,
        borderRadius: 20,
    },
    addButtonText: {
        color: 'white',
        fontWeight: '600',
    },
});
