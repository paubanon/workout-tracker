import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Theme } from '../../theme';
import { WorkoutSession, SetLog, MetricType } from '../../models';
import { Ionicons } from '@expo/vector-icons';

export const WorkoutHistoryDetailScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { session } = route.params as { session: WorkoutSession };

    if (!session) return null;

    const date = new Date(session.date).toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    // Group sets by exercise
    const groupedSets: { [key: string]: SetLog[] } = {};
    const exercisesOrder: string[] = [];

    session.sets.forEach(set => {
        if (!groupedSets[set.exerciseId]) {
            groupedSets[set.exerciseId] = [];
            exercisesOrder.push(set.exerciseId);
        }
        groupedSets[set.exerciseId].push(set);
    });

    // Mock exercise names since session only has IDs (In real app we might fetch or pass map)
    // Ideally we pass full exercise objects or cache them.
    // For now I will assume we might need to fetch them, but for simplicity in this task
    // I will try to rely on what available or show ID/placeholder if name missing.
    // Actually, `HistoryScreen` typically doesn't have exercise details.
    // We should probably fetch exercises or pass them.
    // Let's assume for this specific task we might just show "Exercise" or we fetch.
    // Better: Helper to name exercises.
    // Since I can't easily fetch "all exercises" here without async, I might need to load component.
    // Let's do a simple effect to `loadExercises` if needed, similar to other screens.

    const [exerciseNames, setExerciseNames] = React.useState<{ [key: string]: string }>({});

    React.useEffect(() => {
        // We'll trust that SupabaseDataService is available and we can just get all
        // Or improvement: Get specific IDs.
        // For now, lazy load all.
        import('../../services/SupabaseDataService').then(mod => {
            mod.supabaseService.getExercises().then(all => {
                const map: any = {};
                all.forEach(e => map[e.id] = e.name);
                setExerciseNames(map);
            });
        });
    }, []);

    const renderSetGroup = (exerciseId: string, sets: SetLog[]) => {
        const name = exerciseNames[exerciseId] || 'Loading...';
        const note = sets[0]?.notes;

        return (
            <View key={exerciseId} style={styles.card}>
                <Text style={styles.exerciseTitle}>{name}</Text>
                {note ? <Text style={styles.noteText}>📝 {note}</Text> : null}

                {/* Header */}
                <View style={styles.row}>
                    <Text style={[styles.col, styles.headerText]}>SET</Text>
                    <Text style={[styles.col, styles.headerText]}>KG</Text>
                    <Text style={[styles.col, styles.headerText]}>REPS</Text>
                    <Text style={[styles.col, styles.headerText]}>RPE</Text>
                </View>

                {sets.map((set, i) => (
                    <View key={i} style={styles.row}>
                        <View style={styles.col}>
                            <View style={styles.badge}><Text style={styles.badgeText}>{i + 1}</Text></View>
                        </View>
                        <Text style={[styles.col, styles.cellText]}>{set.loadKg || '-'}</Text>
                        <Text style={[styles.col, styles.cellText]}>{set.reps || '-'}</Text>
                        <Text style={[styles.col, styles.cellText]}>{set.rpe || '-'}</Text>
                    </View>
                ))}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <Text style={Theme.Typography.subtitle}>Workout Details</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>{session.name || 'Untitled Workout'}</Text>
                <Text style={styles.date}>{date}</Text>

                {/* Stats Summary */}
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Volume</Text>
                        <Text style={styles.statValue}>
                            {session.sets.reduce((acc, s) => acc + (s.loadKg || 0) * (s.reps || 0), 0)} kg
                        </Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Sets</Text>
                        <Text style={styles.statValue}>{session.sets.length}</Text>
                    </View>
                </View>

                {exercisesOrder.map(exId => renderSetGroup(exId, groupedSets[exId]))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Theme.Spacing.m,
        backgroundColor: Theme.Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Theme.Colors.border,
    },
    content: {
        padding: Theme.Spacing.m,
        paddingBottom: 40,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 4,
        color: Theme.Colors.text,
    },
    date: {
        fontSize: 15,
        color: Theme.Colors.textSecondary,
        marginBottom: Theme.Spacing.l,
    },
    statsRow: {
        flexDirection: 'row',
        marginBottom: Theme.Spacing.l,
        gap: 12,
    },
    statBox: {
        backgroundColor: Theme.Colors.surface,
        padding: 12,
        borderRadius: 12,
        flex: 1,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: Theme.Colors.textSecondary,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: Theme.Colors.primary,
    },
    card: {
        backgroundColor: Theme.Colors.surface,
        borderRadius: 12,
        padding: Theme.Spacing.m,
        marginBottom: Theme.Spacing.m,
    },
    exerciseTitle: {
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 12,
        color: Theme.Colors.text,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    col: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerText: {
        fontSize: 11,
        fontWeight: '700',
        color: Theme.Colors.textSecondary,
    },
    cellText: {
        fontSize: 16,
        fontWeight: '500',
    },
    badge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Theme.Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Theme.Colors.textSecondary,
    },
    noteText: {
        fontSize: 13,
        color: Theme.Colors.textSecondary,
        marginBottom: 12,
        marginTop: -8,
        fontStyle: 'italic',
    }
});
