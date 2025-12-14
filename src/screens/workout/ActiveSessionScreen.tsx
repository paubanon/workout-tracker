import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Theme } from '../../theme';
import { Exercise, SetLog, WorkoutSession } from '../../models';
import { dataService } from '../../services/MockDataService';

// Helper to generate a new set
const createSet = (exerciseId: string, setNumber: number): SetLog => ({
    id: Math.random().toString(36).substr(2, 9),
    exerciseId,
    setNumber,
    loadKg: 0,
    reps: 0,
    completed: false,
});

export const ActiveSessionScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { templateId } = route.params || {};

    const [session, setSession] = useState<WorkoutSession | null>(null);
    const [exercises, setExercises] = useState<Exercise[]>([]);

    // Timer state
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        // Initialize Session
        const template = templateId ? dataService.getTemplates().find(t => t.id === templateId) : null;
        const allExercises = dataService.getExercises();

        // Determine initial exercises
        let initialExercises: Exercise[] = [];
        if (template) {
            initialExercises = template.exerciseIds
                .map(id => allExercises.find(e => e.id === id))
                .filter(Boolean) as Exercise[];
        }

        // Create initial sets (1 empty set per exercise)
        const initialSets: SetLog[] = initialExercises.map(ex => createSet(ex.id, 1));

        setSession({
            id: Math.random().toString(),
            date: new Date().toISOString(),
            name: template ? template.name : 'Custom Workout',
            painEntries: [],
            sets: initialSets,
        });

        setExercises(initialExercises); // For now just visible exercises
    }, [templateId]);

    useEffect(() => {
        const timer = setInterval(() => setDuration(d => d + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const handleAddSet = (exerciseId: string) => {
        if (!session) return;
        const existingSets = session.sets.filter(s => s.exerciseId === exerciseId);
        const nextSetNumber = existingSets.length + 1;
        const newSet = createSet(exerciseId, nextSetNumber);

        // Ghost values: copy from last set if exists
        if (existingSets.length > 0) {
            const lastSet = existingSets[existingSets.length - 1];
            newSet.loadKg = lastSet.loadKg;
            newSet.reps = lastSet.reps;
        }

        setSession({
            ...session,
            sets: [...session.sets, newSet],
        });
    };

    const handleUpdateSet = (setId: string, field: keyof SetLog, value: any) => {
        if (!session) return;
        setSession({
            ...session,
            sets: session.sets.map(s => s.id === setId ? { ...s, [field]: value } : s)
        });
    };

    const handleFinish = () => {
        // Save session
        Alert.alert("Workout Finished", "Great job!", [
            { text: "OK", onPress: () => navigation.goBack() }
        ]);
    };

    if (!session) return null;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={Theme.Typography.body}>Cancel</Text>
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <Text style={Theme.Typography.body}>Log Workout</Text>
                    <Text style={{ ...Theme.Typography.caption, color: Theme.Colors.primary }}>{formatTime(duration)}</Text>
                </View>
                <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
                    <Text style={styles.finishButtonText}>Finish</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView style={styles.content}>
                    {/* Workout Stats Placeholder */}
                    <View style={styles.statsRow}>
                        <View>
                            <Text style={Theme.Typography.caption}>Duration</Text>
                            <Text style={styles.statValue}>{formatTime(duration)}</Text>
                        </View>
                        <View>
                            <Text style={Theme.Typography.caption}>Volume</Text>
                            <Text style={styles.statValue}>
                                {session.sets.reduce((acc, s) => acc + (s.loadKg || 0) * (s.reps || 0), 0)} kg
                            </Text>
                        </View>
                        <View>
                            <Text style={Theme.Typography.caption}>Sets</Text>
                            <Text style={styles.statValue}>{session.sets.length}</Text>
                        </View>
                    </View>

                    {exercises.map((exercise) => {
                        const exerciseSets = session.sets.filter(s => s.exerciseId === exercise.id);

                        return (
                            <View key={exercise.id} style={styles.exerciseCard}>
                                <View style={styles.exerciseHeader}>
                                    <Text style={styles.exerciseTitle}>{exercise.name}</Text>
                                    <TouchableOpacity><Text>•••</Text></TouchableOpacity>
                                </View>

                                {/* Table Header */}
                                <View style={styles.setRow}>
                                    <Text style={[styles.colSet, styles.headerText]}>SET</Text>
                                    <Text style={[styles.colPrev, styles.headerText]}>PREVIOUS</Text>
                                    <Text style={[styles.colInput, styles.headerText]}>KG</Text>
                                    <Text style={[styles.colInput, styles.headerText]}>REPS</Text>
                                    <View style={styles.colCheck} />
                                </View>

                                {exerciseSets.map((set, index) => (
                                    <View key={set.id} style={[styles.setRow, set.completed && styles.setCompleted]}>
                                        <View style={styles.colSet}>
                                            <View style={styles.setBadge}>
                                                <Text style={styles.setText}>{index + 1}</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.colPrev}>-</Text>
                                        <TextInput
                                            style={styles.input}
                                            keyboardType="numeric"
                                            placeholder="0"
                                            value={set.loadKg?.toString()}
                                            onChangeText={(val) => handleUpdateSet(set.id, 'loadKg', parseFloat(val) || 0)}
                                        />
                                        <TextInput
                                            style={styles.input}
                                            keyboardType="numeric"
                                            placeholder="0"
                                            value={set.reps?.toString()}
                                            onChangeText={(val) => handleUpdateSet(set.id, 'reps', parseFloat(val) || 0)}
                                        />
                                        <TouchableOpacity
                                            style={[styles.colCheck, styles.checkBox, set.completed && styles.checkBoxChecked]}
                                            onPress={() => handleUpdateSet(set.id, 'completed', !set.completed)}
                                        >
                                            {set.completed && <Text style={{ color: 'white' }}>✓</Text>}
                                        </TouchableOpacity>
                                    </View>
                                ))}

                                <TouchableOpacity style={styles.addSetButton} onPress={() => handleAddSet(exercise.id)}>
                                    <Text style={styles.addSetText}>+ Add Set</Text>
                                </TouchableOpacity>
                            </View>
                        );
                    })}

                    <TouchableOpacity
                        style={styles.addExerciseButton}
                        onPress={() => navigation.navigate('ExerciseList', {
                            onSelect: (ex: Exercise) => {
                                if (!exercises.find(e => e.id === ex.id)) {
                                    setExercises(prev => [...prev, ex]);
                                    // Add one empty set
                                    handleAddSet(ex.id);
                                }
                            }
                        } as any)}
                    >
                        <Text style={styles.addExerciseText}>+ Add Exercise</Text>
                    </TouchableOpacity>

                    <View style={{ height: 100 }} />
                </ScrollView>
            </KeyboardAvoidingView>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Theme.Spacing.m,
        paddingVertical: Theme.Spacing.s,
        backgroundColor: Theme.Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Theme.Colors.border,
    },
    finishButton: {
        backgroundColor: Theme.Colors.primary,
        paddingHorizontal: Theme.Spacing.m,
        paddingVertical: 6,
        borderRadius: 16,
    },
    finishButtonText: {
        color: '#FFF',
        fontWeight: '600',
    },
    content: {
        padding: Theme.Spacing.m,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: Theme.Spacing.l,
    },
    statValue: {
        ...Theme.Typography.body,
        fontWeight: '600',
        color: Theme.Colors.primary,
    },
    exerciseCard: {
        backgroundColor: Theme.Colors.surface,
        borderRadius: 12,
        padding: Theme.Spacing.m,
        marginBottom: Theme.Spacing.m,
    },
    exerciseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Theme.Spacing.m,
    },
    exerciseTitle: {
        ...Theme.Typography.subtitle,
        color: Theme.Colors.primary,
    },
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Theme.Spacing.s,
        height: 40,
    },
    setCompleted: {
        backgroundColor: '#E8FAE8', // Light green
    },
    headerText: {
        ...Theme.Typography.caption,
        fontWeight: '600',
        textAlign: 'center',
    },
    colSet: { width: 40, alignItems: 'center' },
    colPrev: { flex: 1, textAlign: 'center', color: Theme.Colors.textSecondary },
    colInput: { width: 60, textAlign: 'center' },
    colCheck: { width: 40, alignItems: 'center' },

    setBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Theme.Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    setText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    input: {
        width: 60,
        height: 36,
        backgroundColor: Theme.Colors.background,
        borderRadius: 8,
        textAlign: 'center',
        fontWeight: '600',
        marginHorizontal: 4,
    },
    checkBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#E5E5E5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkBoxChecked: {
        backgroundColor: Theme.Colors.success,
    },
    addSetButton: {
        backgroundColor: Theme.Colors.background,
        padding: Theme.Spacing.s,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: Theme.Spacing.s,
    },
    addSetText: {
        fontWeight: '600',
        color: Theme.Colors.text,
    },
    addExerciseButton: {
        backgroundColor: Theme.Colors.primary,
        padding: Theme.Spacing.m,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: Theme.Spacing.xl,
    },
    addExerciseText: {
        color: '#FFF',
        fontWeight: 'bold',
    }
});
