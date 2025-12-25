import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { GlowCard } from '../../components/GlowCard';
import { supabaseService } from '../../services/SupabaseDataService';
import { ExerciseGoal, Exercise, SetLog } from '../../models';
import { calculateGoalProgress } from '../../utils/goalHelper';

interface ExerciseSummary {
    exercise: Exercise;
    sets: SetLog[];
    goals: ExerciseGoal[];
    progressDeltas: { goal: ExerciseGoal; previousProgress: number; currentProgress: number }[];
    achievedGoals: ExerciseGoal[];
}

export const PostWorkoutSummaryScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { colors } = useTheme();

    const { sessionSets, exerciseIds } = route.params || {};

    const [summaries, setSummaries] = useState<ExerciseSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSummaryData();
    }, []);

    const loadSummaryData = async () => {
        if (!exerciseIds || exerciseIds.length === 0) {
            setLoading(false);
            return;
        }

        const results: ExerciseSummary[] = [];

        for (const exerciseId of exerciseIds) {
            // Get exercise info
            const exercises = await supabaseService.getExercises();
            const exercise = exercises.find(e => e.id === exerciseId);
            if (!exercise) continue;

            // Get sets for this exercise from the session
            const sets = sessionSets?.filter((s: SetLog) => s.exerciseId === exerciseId) || [];

            // Get goals for this exercise
            const goals = await supabaseService.getGoalsForExercise(exerciseId);

            // Get historical sets (excluding current session) for progress comparison
            const history = await supabaseService.getExerciseHistory(exerciseId);

            // Calculate progress deltas
            const progressDeltas: ExerciseSummary['progressDeltas'] = [];
            const achievedGoals: ExerciseGoal[] = [];

            for (const goal of goals) {
                if (goal.completed) {
                    // Check if it was completed in THIS session
                    if (goal.completedAt) {
                        const completedDate = new Date(goal.completedAt);
                        const now = new Date();
                        const diffMs = now.getTime() - completedDate.getTime();
                        // If completed within last 5 minutes, it's from this session
                        if (diffMs < 5 * 60 * 1000) {
                            achievedGoals.push(goal);
                        }
                    }
                    continue;
                }

                // History includes all sets (including just-saved session)
                // To get "previous", exclude the most recent N sets where N = session sets for this exercise
                const sessionSetCount = sets.length;
                const historyWithoutSession = history.slice(0, Math.max(0, history.length - sessionSetCount));

                const previousProgress = calculateGoalProgress(goal, historyWithoutSession);

                // Calculate current progress (full history which includes current session)
                const currentProgress = calculateGoalProgress(goal, history);

                // Show if there's any positive delta
                const delta = currentProgress - previousProgress;
                if (delta > 0) {
                    progressDeltas.push({ goal, previousProgress, currentProgress });
                }
            }

            results.push({
                exercise,
                sets,
                goals,
                progressDeltas,
                achievedGoals
            });
        }

        setSummaries(results);
        setLoading(false);
    };

    const hasAnyPositiveProgress = summaries.some(s => s.progressDeltas.length > 0 || s.achievedGoals.length > 0);

    const handleDone = () => {
        // Reset navigation to tabs (clearing the modal stack)
        navigation.reset({
            index: 0,
            routes: [{ name: 'Tabs' }],
        });
    };

    const handleViewGoals = () => {
        navigation.navigate('GoalsList');
    };

    const renderExerciseSummary = (summary: ExerciseSummary) => {
        const { exercise, progressDeltas, achievedGoals } = summary;

        // Skip if no progress to show
        if (progressDeltas.length === 0 && achievedGoals.length === 0) {
            return null;
        }

        return (
            <GlowCard key={exercise.id} style={styles.card} level="m">
                <View style={[styles.cardContent, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.exerciseName, { color: colors.text }]}>
                        {exercise.name}
                    </Text>

                    {/* Achieved Goals */}
                    {achievedGoals.map(goal => (
                        <View key={goal.id} style={[styles.achievedBanner, { backgroundColor: colors.success + '20' }]}>
                            <Text style={styles.achievedEmoji}>🎉</Text>
                            <View style={styles.achievedTextContainer}>
                                <Text style={[styles.achievedTitle, { color: colors.success }]}>
                                    Goal Achieved!
                                </Text>
                                <Text style={[styles.achievedGoalName, { color: colors.text }]}>
                                    {goal.name || formatGoalTargets(goal)}
                                </Text>
                            </View>
                        </View>
                    ))}

                    {/* Progress Deltas */}
                    {progressDeltas.map(({ goal, previousProgress, currentProgress }) => {
                        const delta = Math.round(currentProgress - previousProgress);
                        return (
                            <View key={goal.id} style={styles.progressRow}>
                                <Text style={[styles.progressText, { color: colors.text }]}>
                                    {Math.round(previousProgress)}% → {Math.round(currentProgress)}%{' '}
                                    <Text style={{ color: colors.success, fontWeight: '600' }}>
                                        (+{delta}%)
                                    </Text>
                                </Text>
                                <Text style={[styles.goalNameText, { color: colors.textMuted }]} numberOfLines={1}>
                                    {goal.name || formatGoalTargets(goal)}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </GlowCard>
        );
    };

    const formatGoalTargets = (goal: ExerciseGoal): string => {
        const parts: string[] = [];
        if (goal.targetLoad) parts.push(`${goal.targetLoad}kg`);
        if (goal.targetReps) parts.push(`${goal.targetReps} reps`);
        if (goal.targetTime) parts.push(`${goal.targetTime}s`);
        if (goal.targetDistance) parts.push(`${goal.targetDistance}m`);
        return parts.join(' × ') || 'Goal';
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <View style={{ width: 60 }} />
                <Text style={[styles.headerTitle, { color: colors.text }]}>Workout Complete</Text>
                <TouchableOpacity onPress={handleDone} style={styles.doneButton}>
                    <Text style={[styles.doneText, { color: colors.primary }]}>Done</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Success Header */}
                <View style={styles.successHeader}>
                    <Text style={styles.successEmoji}>💪</Text>
                    <Text style={[styles.successTitle, { color: colors.text }]}>Great Work!</Text>
                </View>

                {loading ? (
                    <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading...</Text>
                ) : hasAnyPositiveProgress ? (
                    <>
                        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                            Goal Progress
                        </Text>
                        {summaries.map(renderExerciseSummary)}
                    </>
                ) : (
                    <View style={styles.motivationalContainer}>
                        <Ionicons name="heart" size={48} color={colors.primary} />
                        <Text style={[styles.motivationalText, { color: colors.text }]}>
                            Consistency is key!
                        </Text>
                        <Text style={[styles.motivationalSubtext, { color: colors.textMuted }]}>
                            We all have tough days. Keep showing up, you are doing great!
                        </Text>
                    </View>
                )}

                {/* View All Goals Button */}
                <TouchableOpacity
                    style={[styles.viewGoalsButton, { backgroundColor: colors.primary }]}
                    onPress={handleViewGoals}
                >
                    <Text style={styles.viewGoalsText}>View All Goals</Text>
                </TouchableOpacity>
            </ScrollView>
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
        ...Theme.Typography.subtitle,
    },
    doneButton: {
        width: 60,
        alignItems: 'flex-end',
    },
    doneText: {
        ...Theme.Typography.body,
        fontWeight: '600',
    },
    content: {
        padding: Theme.Spacing.m,
        paddingBottom: Theme.Spacing.xl,
    },
    successHeader: {
        alignItems: 'center',
        marginBottom: Theme.Spacing.l,
    },
    successEmoji: {
        fontSize: 48,
        marginBottom: Theme.Spacing.s,
    },
    successTitle: {
        ...Theme.Typography.h2,
    },
    sectionTitle: {
        ...Theme.Typography.sectionHeader,
        marginBottom: Theme.Spacing.m,
    },
    card: {
        marginBottom: Theme.Spacing.m,
        borderRadius: Theme.BorderRadius.m,
    },
    cardContent: {
        padding: Theme.Spacing.m,
        borderRadius: Theme.BorderRadius.m,
    },
    exerciseName: {
        ...Theme.Typography.body,
        fontWeight: '600',
        marginBottom: Theme.Spacing.s,
    },
    achievedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Theme.Spacing.s,
        borderRadius: Theme.BorderRadius.sm,
        marginBottom: Theme.Spacing.s,
    },
    achievedEmoji: {
        fontSize: 24,
        marginRight: Theme.Spacing.s,
    },
    achievedTextContainer: {
        flex: 1,
    },
    achievedTitle: {
        fontWeight: '700',
        fontSize: 14,
    },
    achievedGoalName: {
        fontSize: 13,
    },
    progressRow: {
        flexDirection: 'column',
        paddingVertical: 4,
    },
    progressText: {
        fontSize: 14,
    },
    goalNameText: {
        fontSize: 13,
        marginTop: 2,
    },
    motivationalContainer: {
        alignItems: 'center',
        paddingVertical: Theme.Spacing.xl,
    },
    motivationalText: {
        ...Theme.Typography.h3,
        marginTop: Theme.Spacing.m,
    },
    motivationalSubtext: {
        ...Theme.Typography.body,
        textAlign: 'center',
        marginTop: Theme.Spacing.s,
        paddingHorizontal: Theme.Spacing.l,
    },
    loadingText: {
        textAlign: 'center',
        marginTop: Theme.Spacing.l,
    },
    viewGoalsButton: {
        padding: Theme.Spacing.m,
        borderRadius: Theme.BorderRadius.m,
        alignItems: 'center',
        marginTop: Theme.Spacing.l,
    },
    viewGoalsText: {
        color: 'white',
        ...Theme.Typography.body,
        fontWeight: '600',
    },
});
