import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, Keyboard, Animated, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Theme } from '../../theme';
import { Exercise, SetLog, WorkoutSession } from '../../models';
import { supabaseService } from '../../services/SupabaseDataService';

// Helper to generate a new set
const createSet = (exerciseId: string, setNumber: number, defaults?: {
    load?: number, reps?: string, tempo?: string, time?: number, distance?: number, rom?: string
}): SetLog => ({
    id: Math.random().toString(36).substr(2, 9),
    exerciseId,
    setNumber,
    loadKg: 0, // Actual input starts empty/0
    reps: 0,
    completed: false,

    // Targets for Ghost Values
    targetLoad: defaults?.load,
    targetReps: defaults?.reps,
    targetTempo: defaults?.tempo,
    targetTime: defaults?.time,
    targetDistance: defaults?.distance,
    targetRom: defaults?.rom,
});

export const ActiveSessionScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { templateId } = route.params || {};

    const [session, setSession] = useState<WorkoutSession | null>(null);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [userWeight, setUserWeight] = useState<number>(0);

    // Modal State
    const [activeModalExerciseId, setActiveModalExerciseId] = useState<string | null>(null);
    const [showExerciseModal, setShowExerciseModal] = useState(false);

    // Note State
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [currentNote, setCurrentNote] = useState('');
    const [exerciseNotes, setExerciseNotes] = useState<{ [key: string]: string }>({});

    // Toast State
    const [showToast, setShowToast] = useState(false);
    const fadeAnim = useState(new Animated.Value(0))[0];

    // Timer state
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        if (showToast) {
            Animated.timing(fadeAnim, {
                toValue: 1, duration: 300, useNativeDriver: true
            }).start();
            const timer = setTimeout(() => {
                Animated.timing(fadeAnim, {
                    toValue: 0, duration: 300, useNativeDriver: true
                }).start(() => navigation.goBack());
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [showToast]);

    useEffect(() => {
        const initSession = async () => {
            // Get User Profile for Weight
            const profile = await supabaseService.getUserProfile();
            const currentWeight = profile?.weightHistory?.[0]?.weightKg || 0; // Assuming newest first? Or check sort
            // Actually weightHistory might not be sorted. Let's sorting logic if needed, or assume last added.
            // But Mock/Supabase service returns it. Let's assume most recent is first or handle it.
            // Supabase profile query: weight_history is JSONB array.
            // Let's just grab the last entry if array exists.
            let weight = 0;
            if (profile?.weightHistory?.length) {
                // Sort by date desc just to be safe if not already
                const sorted = [...profile.weightHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                weight = sorted[0].weightKg;
            }
            setUserWeight(weight);

            // Initialize Session
            let template = null;
            if (templateId) {
                const templates = await supabaseService.getTemplates();
                template = templates.find(t => t.id === templateId);
            }

            const allExercises = await supabaseService.getExercises();

            let initialExercises: Exercise[] = [];
            let initialSets: SetLog[] = [];

            if (template) {
                // Load from Template
                template.exercises.forEach(te => {
                    const ex = allExercises.find(e => e.id === te.exerciseId);
                    if (ex) {
                        initialExercises.push(ex);

                        if (te.sets && te.sets.length > 0) {
                            // Use confirmed sets array
                            te.sets.forEach((targetSet, i) => {
                                initialSets.push(createSet(ex.id, i + 1, {
                                    load: targetSet.targetLoad,
                                    reps: targetSet.targetReps,
                                    tempo: targetSet.targetTempo,
                                    time: targetSet.targetTime,
                                    distance: targetSet.targetDistance,
                                    rom: targetSet.targetRom
                                }));
                            });
                        } else {
                            // Fallback to targetSets count
                            const count = te.targetSets || 0;
                            for (let i = 0; i < count; i++) {
                                initialSets.push(createSet(ex.id, i + 1, {
                                    load: te.targetLoad,
                                    reps: te.targetReps,
                                    tempo: te.targetTempo,
                                    time: te.targetTime,
                                    distance: te.targetDistance,
                                    rom: te.targetRom
                                }));
                            }
                        }
                    }
                });
            } else {
                // Custom or Empty
                // If we had passed exercises from creating a custom workout, logic would be here.
                // For now assumes empty.
            }

            setSession({
                id: Math.random().toString(),
                date: new Date().toISOString(),
                name: template ? template.name : 'Custom Workout',
                painEntries: [],
                sets: initialSets,
            });

            setExercises(initialExercises);
        };
        initSession();
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

        // Copy defaults from last set (Duplicate previous actuals as new targets? or just empty?)
        // User behavior: "Duplicate Last Set" usually means copy the VALUES.
        // But here we creating a new blank set.
        let defaults = {};
        if (existingSets.length > 0) {
            const last = existingSets[existingSets.length - 1];
            defaults = {
                load: last.loadKg,
                reps: last.reps?.toString(),
                tempo: last.tempo || last.targetTempo,
                time: last.timeSeconds,
                distance: last.distanceMeters,
                rom: last.romCm?.toString() // Assuming romCm matches targetRom handling
            };
        }

        const newSet = createSet(exerciseId, nextSetNumber, defaults);

        // If copying actuals to actuals intentionally:
        if (existingSets.length > 0) {
            const last = existingSets[existingSets.length - 1];
            newSet.loadKg = last.loadKg;
            newSet.reps = last.reps;
            // Tempo?
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

    const handleExerciseAction = (exerciseId: string) => {
        setActiveModalExerciseId(exerciseId);
        setShowExerciseModal(true);
    };

    const handleDeleteExercise = () => {
        if (!activeModalExerciseId || !session) return;

        // Remove sets
        const updatedSets = session.sets.filter(s => s.exerciseId !== activeModalExerciseId);
        setSession({
            ...session,
            sets: updatedSets
        });

        // Remove from exercises list
        setExercises(prev => prev.filter(e => e.id !== activeModalExerciseId));

        setShowExerciseModal(false);
        setActiveModalExerciseId(null);
    };

    const handleOpenNoteModal = () => {
        if (!activeModalExerciseId) return;
        setCurrentNote(exerciseNotes[activeModalExerciseId] || '');
        setShowExerciseModal(false);
        setShowNoteModal(true);
    };

    const handleSaveNote = () => {
        if (activeModalExerciseId) {
            setExerciseNotes(prev => ({
                ...prev,
                [activeModalExerciseId]: currentNote
            }));
        }
        setShowNoteModal(false);
    };

    const handleFinish = async () => {
        if (!session) return;

        // Prepare session for saving: Add body weight to load if applicable
        const sessionToSave = { ...session };
        sessionToSave.sets = session.sets.map(set => {
            const exercise = exercises.find(e => e.id === set.exerciseId);
            if (exercise?.trackBodyWeight && userWeight > 0) {
                return {
                    ...set,
                    loadKg: (set.loadKg || 0) + userWeight
                };
            }
            if (exercise?.trackBodyWeight && userWeight > 0) {
                return {
                    ...set,
                    loadKg: (set.loadKg || 0) + userWeight
                };
            }
            return set;
        });

        // Inject Notes into the first set of each exercise
        Object.entries(exerciseNotes).forEach(([exId, note]) => {
            if (!note.trim()) return;
            // Find first set for this exercise
            const firstSetIndex = sessionToSave.sets.findIndex(s => s.exerciseId === exId);
            if (firstSetIndex !== -1) {
                sessionToSave.sets[firstSetIndex] = {
                    ...sessionToSave.sets[firstSetIndex],
                    notes: note
                };
            }
        });

        // Save to Supabase
        await supabaseService.addWorkoutSession(sessionToSave);

        // Show Toast
        setShowToast(true);
    };

    if (!session) return null;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
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

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            >
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={{ paddingBottom: 220 }} // Extra padding for scrolling
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Stats */}
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
                        const hasTempo = exercise.repsType === 'tempo';
                        const hasIsometric = exercise.repsType === 'isometric';

                        return (
                            <View key={exercise.id} style={styles.exerciseCard}>
                                <View style={styles.exerciseHeader}>
                                    <View>
                                        <Text style={styles.exerciseTitle}>{exercise.name}</Text>
                                        {exerciseNotes[exercise.id] ? (
                                            <Text style={styles.noteText}>📝 {exerciseNotes[exercise.id]}</Text>
                                        ) : null}
                                    </View>
                                    <TouchableOpacity onPress={() => handleExerciseAction(exercise.id)}>
                                        <Ionicons name="ellipsis-horizontal" size={24} color={Theme.Colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>

                                {/* Table Header */}
                                <View style={styles.setRow}>
                                    <Text style={[styles.colSet, styles.headerText]}>SET</Text>

                                    {/* Dynamic Headers */}
                                    {(exercise.enabledMetrics || []).includes('load') && (
                                        <Text style={[styles.colInput, styles.headerText]}>KG</Text>
                                    )}
                                    {(exercise.enabledMetrics || []).includes('reps') && (
                                        <Text style={[styles.colInput, styles.headerText]}>REPS</Text>
                                    )}
                                    {(hasTempo || hasIsometric) && (exercise.enabledMetrics || []).includes('reps') && (
                                        <Text style={[styles.colInput, styles.headerText]}>
                                            {hasIsometric ? 'TIME' : 'TEMPO'}
                                        </Text>
                                    )}
                                    {(exercise.enabledMetrics || []).includes('time') && (
                                        <Text style={[styles.colInput, styles.headerText]}>TIME</Text>
                                    )}
                                    {(exercise.enabledMetrics || []).includes('distance') && (
                                        <Text style={[styles.colInput, styles.headerText]}>DIST</Text>
                                    )}
                                    {(exercise.enabledMetrics || []).includes('rom') && (
                                        <Text style={[styles.colInput, styles.headerText]}>ROM</Text>
                                    )}

                                    <View style={styles.colCheck} />
                                </View>

                                {exerciseSets.map((set, index) => (
                                    <View key={set.id} style={[styles.setRow, set.completed && styles.setCompleted]}>
                                        <View style={styles.colSet}>
                                            <View style={styles.setBadge}>
                                                <Text style={styles.setText}>{index + 1}</Text>
                                            </View>
                                        </View>

                                        {/* Load Input */}
                                        {(exercise.enabledMetrics || []).includes('load') && (
                                            <TextInput
                                                style={styles.input}
                                                keyboardType="numeric"
                                                placeholder={
                                                    exercise.trackBodyWeight
                                                        ? `${set.targetLoad || 0} (+${userWeight})`
                                                        : (set.targetLoad ? set.targetLoad.toString() : "-")
                                                }
                                                placeholderTextColor="#C7C7CC"
                                                value={set.loadKg === 0 ? '' : set.loadKg?.toString()}
                                                onChangeText={(val) => handleUpdateSet(set.id, 'loadKg', parseFloat(val) || 0)}
                                            />
                                        )}

                                        {/* Reps Input */}
                                        {(exercise.enabledMetrics || []).includes('reps') && (
                                            <TextInput
                                                style={styles.input}
                                                keyboardType="numeric"
                                                placeholder={set.targetReps || "-"}
                                                placeholderTextColor="#C7C7CC"
                                                value={set.reps === 0 ? '' : set.reps?.toString()}
                                                onChangeText={(val) => handleUpdateSet(set.id, 'reps', parseFloat(val) || 0)}
                                            />
                                        )}

                                        {/* Tempo/Time Input (Associated with Reps usually) */}
                                        {(hasTempo || hasIsometric) && (exercise.enabledMetrics || []).includes('reps') && (
                                            <TextInput
                                                style={styles.input}
                                                placeholder={set.targetTempo || (hasIsometric ? "0s" : "3010")}
                                                placeholderTextColor="#C7C7CC"
                                                value={set.tempo}
                                                onChangeText={(val) => handleUpdateSet(set.id, 'tempo', val)}
                                            />
                                        )}

                                        {/* Pure Time Input */}
                                        {(exercise.enabledMetrics || []).includes('time') && (
                                            <TextInput
                                                style={styles.input}
                                                keyboardType="numeric"
                                                placeholder={set.targetTime ? set.targetTime.toString() : "-"}
                                                placeholderTextColor="#C7C7CC"
                                                value={set.timeSeconds === 0 ? '' : set.timeSeconds?.toString()}
                                                onChangeText={(val) => handleUpdateSet(set.id, 'timeSeconds', parseFloat(val) || 0)}
                                            />
                                        )}

                                        {/* Distance Input */}
                                        {(exercise.enabledMetrics || []).includes('distance') && (
                                            <TextInput
                                                style={styles.input}
                                                keyboardType="numeric"
                                                placeholder={set.targetDistance ? set.targetDistance.toString() : "-"}
                                                placeholderTextColor="#C7C7CC"
                                                value={set.distanceMeters === 0 ? '' : set.distanceMeters?.toString()}
                                                onChangeText={(val) => handleUpdateSet(set.id, 'distanceMeters', parseFloat(val) || 0)}
                                            />
                                        )}

                                        {/* ROM Input */}
                                        {(exercise.enabledMetrics || []).includes('rom') && (
                                            <TextInput
                                                style={styles.input}
                                                placeholder={set.targetRom || "-"}
                                                placeholderTextColor="#C7C7CC"
                                                value={set.romCm ? set.romCm.toString() : ''}
                                                onChangeText={(val) => handleUpdateSet(set.id, 'romCm', parseFloat(val) || 0)} // Or string? Model says romCm is number.
                                            />
                                        )}

                                        <TouchableOpacity
                                            style={[styles.colCheck, styles.checkBox, set.completed && styles.checkBoxChecked]}
                                            // Updated: If completing, and values are empty, fill with targets (Ghost Logic)
                                            onPress={() => {
                                                const isActive = !set.completed;
                                                let updates: any = { completed: isActive };

                                                if (isActive) {
                                                    // Fill with defaults if empty
                                                    if (!set.loadKg && set.targetLoad) updates.loadKg = set.targetLoad;
                                                    if (!set.reps && set.targetReps) updates.reps = parseFloat(set.targetReps) || 0; // Simple parse, might need robust handling for "8-12"
                                                    if (!set.timeSeconds && set.targetTime) updates.timeSeconds = set.targetTime;
                                                    if (!set.distanceMeters && set.targetDistance) updates.distanceMeters = set.targetDistance;
                                                    if (!set.romCm && set.targetRom) updates.romCm = parseFloat(set.targetRom) || 0;
                                                    if (!set.tempo && set.targetTempo) updates.tempo = set.targetTempo;
                                                }

                                                // Actually update
                                                const updatedSets = session.sets.map(s => s.id === set.id ? { ...s, ...updates } : s);
                                                setSession({ ...session, sets: updatedSets });
                                            }}
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
                                    handleAddSet(ex.id);
                                }
                            }
                        } as any)}
                    >
                        <Text style={styles.addExerciseText}>+ Add Exercise</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Toast Notification */}
            {
                showToast && (
                    <Animated.View style={[styles.toast, { opacity: fadeAnim }]}>
                        <Text style={styles.toastText}>Great job!</Text>
                    </Animated.View>
                )
            }
            {/* Exercise Action Modal */}
            <Modal
                visible={showExerciseModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowExerciseModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowExerciseModal(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Options</Text>

                        <TouchableOpacity style={styles.modalButton} onPress={handleOpenNoteModal}>
                            <Text style={styles.modalButtonText}>Add Note</Text>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity style={styles.modalButton} onPress={handleDeleteExercise}>
                            <Text style={[styles.modalButtonText, { color: Theme.Colors.danger }]}>Delete Exercise</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.cancelButton} onPress={() => setShowExerciseModal(false)}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Note Input Modal */}
            <Modal
                visible={showNoteModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowNoteModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add Note</Text>
                        <TextInput
                            style={styles.noteInput}
                            placeholder="Type your notes here..."
                            value={currentNote}
                            onChangeText={setCurrentNote}
                            multiline
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowNoteModal(false)}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveNote}>
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView >
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
        backgroundColor: '#E8FAE8',
    },
    headerText: {
        ...Theme.Typography.caption,
        fontWeight: '600',
        textAlign: 'center',
    },
    colSet: { width: 40, alignItems: 'center' },
    colInput: { flex: 1, textAlign: 'center' }, // Flexible input width
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
        flex: 1,
        height: 44, // Increased from 36
        backgroundColor: Theme.Colors.background,
        borderRadius: 8,
        textAlign: 'center',
        fontWeight: '600',
        marginHorizontal: 4,
        fontSize: 16,
        paddingVertical: 8, // Added padding
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
    },
    // Toast
    toast: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 20,
        zIndex: 1000,
    },
    toastText: {
        color: 'white',
        fontWeight: '600',
    },
    // Note Text
    noteText: {
        fontSize: 12,
        color: Theme.Colors.textSecondary,
        marginTop: 2,
    },
    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Theme.Spacing.l,
    },
    modalContent: {
        backgroundColor: Theme.Colors.surface,
        borderRadius: 20,
        width: '100%',
        maxWidth: 320,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 16,
    },
    modalButton: {
        paddingVertical: 12,
        alignItems: 'center',
        width: '100%',
    },
    modalButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: Theme.Colors.primary,
    },
    divider: {
        height: 1,
        backgroundColor: Theme.Colors.border,
        width: '100%',
        marginVertical: 4,
    },
    cancelButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: Theme.Colors.textSecondary,
    },
    saveButton: {
        backgroundColor: Theme.Colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    noteInput: {
        backgroundColor: Theme.Colors.background,
        width: '100%',
        height: 100,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        textAlignVertical: 'top',
        color: Theme.Colors.text,
    }
});
