import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Theme } from '../../theme';
import { WorkoutSession, SetLog, MetricType } from '../../models';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabaseService } from '../../services/SupabaseDataService';

export const WorkoutHistoryDetailScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { session } = route.params as { session: WorkoutSession };
    const { colors, isDark } = useTheme();
    const [menuVisible, setMenuVisible] = useState(false);

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

    const [exerciseNames, setExerciseNames] = React.useState<{ [key: string]: string }>({});

    React.useEffect(() => {
        import('../../services/SupabaseDataService').then(mod => {
            mod.supabaseService.getExercises().then(all => {
                const map: any = {};
                all.forEach(e => map[e.id] = e.name);
                setExerciseNames(map);
            });
        });
    }, []);

    const handleEdit = () => {
        setMenuVisible(false);
        navigation.navigate('EditWorkout', { session });
    };

    const handleDelete = () => {
        setMenuVisible(false);
        Alert.alert(
            "Delete Workout",
            `Are you sure you want to delete "${session.name || 'Untitled Workout'}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await supabaseService.deleteWorkoutSession(session.id);
                        navigation.goBack();
                    }
                }
            ]
        );
    };

    const renderSetGroup = (exerciseId: string, sets: SetLog[]) => {
        const name = exerciseNames[exerciseId] || 'Loading...';
        const note = sets[0]?.notes;

        return (
            <View key={exerciseId} style={[styles.card, { backgroundColor: colors.surface }]}>
                <Text style={[styles.exerciseTitle, { color: colors.text }]}>{name}</Text>
                {note ? <Text style={[styles.noteText, { color: colors.textMuted }]}>📝 {note}</Text> : null}

                {/* Header */}
                <View style={styles.row}>
                    <Text style={[styles.col, styles.headerText, { color: colors.textMuted }]}>SET</Text>
                    <Text style={[styles.col, styles.headerText, { color: colors.textMuted }]}>KG</Text>
                    <Text style={[styles.col, styles.headerText, { color: colors.textMuted }]}>REPS</Text>
                    <Text style={[styles.col, styles.headerText, { color: colors.textMuted }]}>RPE</Text>
                </View>

                {sets.map((set, i) => (
                    <View key={i} style={styles.row}>
                        <View style={styles.col}>
                            <View style={[styles.badge, { backgroundColor: colors.bgLight }]}>
                                <Text style={[styles.badgeText, { color: colors.textMuted }]}>{i + 1}</Text>
                            </View>
                        </View>
                        <Text style={[styles.col, styles.cellText, { color: colors.text }]}>{set.loadKg || '-'}</Text>
                        <Text style={[styles.col, styles.cellText, { color: colors.text }]}>{set.reps || '-'}</Text>
                        <Text style={[styles.col, styles.cellText, { color: colors.text }]}>{set.rpe || '-'}</Text>
                    </View>
                ))}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <Ionicons name="arrow-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[Theme.Typography.subtitle, { color: colors.text }]}>Workout Details</Text>
                <TouchableOpacity
                    onPress={() => setMenuVisible(!menuVisible)}
                    accessibilityRole="button"
                    accessibilityLabel="More options"
                >
                    <Ionicons name="ellipsis-vertical" size={24} color={colors.textMuted} />
                </TouchableOpacity>
            </View>

            {/* Dropdown Menu */}
            {menuVisible && (
                <View style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={handleEdit}
                        accessibilityRole="button"
                        accessibilityLabel="Edit workout"
                    >
                        <Ionicons name="create-outline" size={18} color={colors.text} />
                        <Text style={[styles.menuItemText, { color: colors.text }]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={handleDelete}
                        accessibilityRole="button"
                        accessibilityLabel="Delete workout"
                    >
                        <Ionicons name="trash-outline" size={18} color={colors.danger} />
                        <Text style={[styles.menuItemText, { color: colors.danger }]}>Delete</Text>
                    </TouchableOpacity>
                </View>
            )}

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.title, { color: colors.text }]}>{session.name || 'Untitled Workout'}</Text>
                <Text style={[styles.date, { color: colors.textMuted }]}>{date}</Text>

                {/* Stats Summary */}
                <View style={styles.statsRow}>
                    <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Volume</Text>
                        <Text style={[styles.statValue, { color: colors.primary }]}>
                            {session.sets.reduce((acc, s) => acc + (s.loadKg || 0) * (s.reps || 0), 0)} kg
                        </Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Sets</Text>
                        <Text style={[styles.statValue, { color: colors.primary }]}>{session.sets.length}</Text>
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
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Theme.Spacing.m,
        borderBottomWidth: 1,
    },
    menu: {
        position: 'absolute',
        top: 100,
        right: Theme.Spacing.m,
        borderRadius: 8,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 100,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 12,
        minWidth: 120,
    },
    menuItemText: {
        fontSize: 15,
    },
    content: {
        padding: Theme.Spacing.m,
        paddingBottom: 40,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 4,
    },
    date: {
        fontSize: 15,
        marginBottom: Theme.Spacing.l,
    },
    statsRow: {
        flexDirection: 'row',
        marginBottom: Theme.Spacing.l,
        gap: 12,
    },
    statBox: {
        padding: 12,
        borderRadius: 12,
        flex: 1,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    card: {
        borderRadius: 12,
        padding: Theme.Spacing.m,
        marginBottom: Theme.Spacing.m,
    },
    exerciseTitle: {
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 12,
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
    },
    cellText: {
        fontSize: 16,
        fontWeight: '500',
    },
    badge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    noteText: {
        fontSize: 13,
        marginBottom: 12,
        marginTop: -8,
        fontStyle: 'italic',
    }
});

