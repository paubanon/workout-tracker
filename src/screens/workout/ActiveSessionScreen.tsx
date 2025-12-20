import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, Keyboard, Animated, Modal, Switch, ActivityIndicator } from 'react-native';
import DraggableFlatList, { ScaleDecorator, RenderItemParams, ShadowDecorator } from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Theme } from '../../theme';
import { Exercise, SetLog, WorkoutSession } from '../../models';
import { supabaseService } from '../../services/SupabaseDataService';
import { performSetUpdate, toggleSetComplete, handleSaveRpe } from '../../utils/setLogicHelper';
import { useTheme } from '../../context/ThemeContext';

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
    const { colors, isDark } = useTheme();

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

    // RPE State
    const [trackRpePreference, setTrackRpePreference] = useState(false);
    const [showRpeModal, setShowRpeModal] = useState(false);
    const [currentRpe, setCurrentRpe] = useState(5); // Default start
    const [pendingSetId, setPendingSetId] = useState<string | null>(null);

    // Toast State
    const [showToast, setShowToast] = useState(false);
    const fadeAnim = useState(new Animated.Value(0))[0];

    // Timer state
    const [duration, setDuration] = useState(0);

    // Keyboard height for dynamic padding
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    // Loading state for save button
    const [isSaving, setIsSaving] = useState(false);

    const loadProfilePrefs = async () => {
        const profile = await supabaseService.getUserProfile();
        if (profile?.preferences?.trackRpe) {
            setTrackRpePreference(true);
        }
    };

    useEffect(() => {
        loadProfilePrefs();
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

    // Listen to keyboard events
    useEffect(() => {
        const showSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => setKeyboardHeight(e.endCoordinates.height)
        );
        const hideSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardHeight(0)
        );
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    useEffect(() => {
        const initSession = async () => {
            // Get User Profile for Weight
            const profile = await supabaseService.getUserProfile();
            // Assuming newest first? Or check sort
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

    const handleRemoveSet = (exerciseId: string) => {
        if (!session) return;
        const exerciseSets = session.sets.filter(s => s.exerciseId === exerciseId);
        if (exerciseSets.length === 0) return;

        // Remove the last set for this exercise
        const lastSet = exerciseSets[exerciseSets.length - 1];
        setSession({
            ...session,
            sets: session.sets.filter(s => s.id !== lastSet.id)
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

    // Consolidating the logic to mark a set as complete (including ghost values)
    const onPerformSetUpdate = (setId: string, completed: boolean, additionalUpdates: any = {}) => {
        performSetUpdate(session, setSession, setId, completed, additionalUpdates);
    };

    const onToggleSetComplete = (setId: string, currentCompleted: boolean) => {
        toggleSetComplete({
            setId,
            currentCompleted,
            trackRpePreference,
            setPendingSetId,
            setCurrentRpe,
            setShowRpeModal,
            session,
            setSession
        });
    };

    const onSaveRpe = () => {
        handleSaveRpe({
            pendingSetId,
            currentRpe,
            handleUpdateSet,
            performSetUpdate, // Passed but unused in simplified version
            setShowRpeModal,
            setPendingSetId,
            session,
            setSession
        });
    };

    const handleFinish = async () => {
        if (!session || isSaving) return;

        setIsSaving(true);

        // Prepare session for saving: Add body weight to load if applicable
        const sessionToSave = {
            ...session,
            durationSeconds: duration
        };

        // Sort sets based on current visual exercise order
        const exerciseOrder = exercises.map(e => e.id);
        const sortedSets = [...session.sets].sort((a, b) => {
            const idxA = exerciseOrder.indexOf(a.exerciseId);
            const idxB = exerciseOrder.indexOf(b.exerciseId);
            if (idxA === idxB) return a.setNumber - b.setNumber;
            return idxA - idxB;
        });

        sessionToSave.sets = sortedSets.map(set => {
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

        setIsSaving(false);

        // Show Toast
        setShowToast(true);
    };

    if (!session) return null;

    // Computed Styles
    const containerStyle = { backgroundColor: colors.background };
    const headerStyle = { backgroundColor: colors.surface, borderBottomColor: colors.border };
    const textStyle = { color: colors.text };
    const textMutedStyle = { color: colors.textMuted };
    const buttonTextStyle = { color: colors.primary };
    const surfaceStyle = { backgroundColor: colors.surface };
    const cardShadowStyle = isDark ? Theme.TopLight.m : Theme.Shadows.light.m;

    return (
        <SafeAreaView style={[styles.container, containerStyle]} edges={['top']}>
            <View style={[styles.header, headerStyle]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={[styles.bodyText, textStyle]}>Cancel</Text>
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <Text style={[styles.bodyText, textStyle]}>Log Workout</Text>
                    <Text style={[styles.captionText, { color: colors.primary }]}>{formatTime(duration)}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.finishButton, { backgroundColor: colors.primary, opacity: isSaving ? 0.7 : 1 }]}
                    onPress={handleFinish}
                    disabled={isSaving}
                    accessibilityRole="button"
                    accessibilityLabel={isSaving ? 'Saving workout' : 'Finish workout'}
                >
                    {isSaving ? (
                        <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                        <Text style={styles.finishButtonText}>Finish</Text>
                    )}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            >
                <DraggableFlatList
                    data={exercises}
                    onDragEnd={({ data }) => setExercises(data)}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: Math.max(220, keyboardHeight + 100) }}
                    style={styles.content}
                    keyboardShouldPersistTaps="handled"
                    ListHeaderComponent={
                        <View style={styles.statsRow}>
                            <View>
                                <Text style={[styles.captionText, textMutedStyle]}>Duration</Text>
                                <Text style={[styles.statValue, { color: colors.primary }]}>{formatTime(duration)}</Text>
                            </View>
                            <View>
                                <Text style={[styles.captionText, textMutedStyle]}>Volume</Text>
                                <Text style={[styles.statValue, { color: colors.primary }]}>
                                    {session.sets.reduce((acc, s) => acc + (s.loadKg || 0) * (s.reps || 0), 0)} kg
                                </Text>
                            </View>
                            <View>
                                <Text style={[styles.captionText, textMutedStyle]}>Sets</Text>
                                <Text style={[styles.statValue, { color: colors.primary }]}>{session.sets.length}</Text>
                            </View>
                        </View>
                    }
                    renderItem={({ item: exercise, getIndex, drag, isActive }: RenderItemParams<Exercise>) => {
                        const exerciseSets = session.sets.filter(s => s.exerciseId === exercise.id);
                        const hasTempo = exercise.repsType === 'tempo';
                        const hasIsometric = exercise.repsType === 'isometric';
                        const index = getIndex();

                        return (
                            <ScaleDecorator>
                                <TouchableOpacity
                                    key={exercise.id}
                                    style={[
                                        styles.exerciseCard,
                                        surfaceStyle,
                                        { backgroundColor: isActive ? colors.bgLight : colors.surface },
                                        cardShadowStyle
                                    ]}
                                    onLongPress={drag}
                                    delayLongPress={750}
                                    activeOpacity={1}
                                    disabled={isActive}
                                >
                                    <View style={styles.exerciseHeader}>
                                        <View>
                                            <Text style={[styles.exerciseTitle, { color: colors.primary }]}>{exercise.name}</Text>
                                            {exerciseNotes[exercise.id] ? (
                                                <Text style={[styles.noteText, textMutedStyle]}>📝 {exerciseNotes[exercise.id]}</Text>
                                            ) : null}
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => handleExerciseAction(exercise.id)}
                                            accessibilityRole="button"
                                            accessibilityLabel={`Options for ${exercise.name}`}
                                        >
                                            <Ionicons name="ellipsis-horizontal" size={24} color={colors.textMuted} />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Table Header */}
                                    <View style={styles.setRow}>
                                        <Text style={[styles.colSet, styles.headerText, textMutedStyle]}>SET</Text>

                                        {/* Dynamic Headers */}
                                        {(exercise.enabledMetrics || []).includes('load') && (
                                            <Text style={[styles.colInput, styles.headerText, textMutedStyle]}>KG</Text>
                                        )}
                                        {(exercise.enabledMetrics || []).includes('reps') && (
                                            <Text style={[styles.colInput, styles.headerText, textMutedStyle]}>REPS</Text>
                                        )}
                                        {(hasTempo || hasIsometric) && (exercise.enabledMetrics || []).includes('reps') && (
                                            <Text style={[styles.colInput, styles.headerText, textMutedStyle]}>
                                                {hasIsometric ? 'TIME' : 'TEMPO'}
                                            </Text>
                                        )}
                                        {(exercise.enabledMetrics || []).includes('time') && (
                                            <Text style={[styles.colInput, styles.headerText, textMutedStyle]}>TIME</Text>
                                        )}
                                        {(exercise.enabledMetrics || []).includes('distance') && (
                                            <Text style={[styles.colInput, styles.headerText, textMutedStyle]}>DIST</Text>
                                        )}
                                        {(exercise.enabledMetrics || []).includes('rom') && (
                                            <Text style={[styles.colInput, styles.headerText, textMutedStyle]}>ROM</Text>
                                        )}

                                        <View style={styles.colCheck} />
                                    </View>

                                    {exerciseSets.map((set, index) => (
                                        <View key={set.id} style={[styles.setRow, set.completed ? { backgroundColor: isDark ? 'rgba(101, 217, 132, 0.2)' : '#E8FAE8' } : null]}>
                                            <View style={styles.colSet}>
                                                <View style={[styles.setBadge, { backgroundColor: colors.bgLight }]}>
                                                    <Text style={[styles.setText, textStyle]}>{index + 1}</Text>
                                                </View>
                                            </View>

                                            {/* Load Input */}
                                            {(exercise.enabledMetrics || []).includes('load') && (
                                                <TextInput
                                                    style={[styles.input, textStyle, { backgroundColor: isDark ? colors.bgLight : colors.background }]}
                                                    keyboardType="numeric"
                                                    placeholder={
                                                        exercise.trackBodyWeight
                                                            ? `${set.targetLoad || 0} (+${userWeight})`
                                                            : (set.targetLoad ? set.targetLoad.toString() : "-")
                                                    }
                                                    placeholderTextColor={colors.textMuted}
                                                    value={set.loadKg === 0 ? '' : set.loadKg?.toString()}
                                                    onChangeText={(val) => handleUpdateSet(set.id, 'loadKg', parseFloat(val) || 0)}
                                                />
                                            )}

                                            {/* Reps Input */}
                                            {(exercise.enabledMetrics || []).includes('reps') && (
                                                <TextInput
                                                    style={[styles.input, textStyle, { backgroundColor: isDark ? colors.bgLight : colors.background }]}
                                                    keyboardType="numeric"
                                                    placeholder={set.targetReps || "-"}
                                                    placeholderTextColor={colors.textMuted}
                                                    value={set.reps === 0 ? '' : set.reps?.toString()}
                                                    onChangeText={(val) => handleUpdateSet(set.id, 'reps', parseFloat(val) || 0)}
                                                />
                                            )}

                                            {/* Tempo/Time Input (Associated with Reps usually) */}
                                            {(hasTempo || hasIsometric) && (exercise.enabledMetrics || []).includes('reps') && (
                                                <TextInput
                                                    style={[styles.input, textStyle, { backgroundColor: isDark ? colors.bgLight : colors.background }]}
                                                    placeholder={set.targetTempo || (hasIsometric ? "0s" : "3010")}
                                                    placeholderTextColor={colors.textMuted}
                                                    value={set.tempo}
                                                    onChangeText={(val) => handleUpdateSet(set.id, 'tempo', val)}
                                                />
                                            )}

                                            {/* Pure Time Input */}
                                            {(exercise.enabledMetrics || []).includes('time') && (
                                                <TextInput
                                                    style={[styles.input, textStyle, { backgroundColor: isDark ? colors.bgLight : colors.background }]}
                                                    keyboardType="numeric"
                                                    placeholder={set.targetTime ? set.targetTime.toString() : "-"}
                                                    placeholderTextColor={colors.textMuted}
                                                    value={set.timeSeconds === 0 ? '' : set.timeSeconds?.toString()}
                                                    onChangeText={(val) => handleUpdateSet(set.id, 'timeSeconds', parseFloat(val) || 0)}
                                                />
                                            )}

                                            {/* Distance Input */}
                                            {(exercise.enabledMetrics || []).includes('distance') && (
                                                <TextInput
                                                    style={[styles.input, textStyle, { backgroundColor: isDark ? colors.bgLight : colors.background }]}
                                                    keyboardType="numeric"
                                                    placeholder={set.targetDistance ? set.targetDistance.toString() : "-"}
                                                    placeholderTextColor={colors.textMuted}
                                                    value={set.distanceMeters === 0 ? '' : set.distanceMeters?.toString()}
                                                    onChangeText={(val) => handleUpdateSet(set.id, 'distanceMeters', parseFloat(val) || 0)}
                                                />
                                            )}

                                            {/* ROM Input */}
                                            {(exercise.enabledMetrics || []).includes('rom') && (
                                                <TextInput
                                                    style={[styles.input, textStyle, { backgroundColor: isDark ? colors.bgLight : colors.background }]}
                                                    placeholder={set.targetRom || "-"}
                                                    placeholderTextColor={colors.textMuted}
                                                    value={set.romCm ? set.romCm.toString() : ''}
                                                    onChangeText={(val) => handleUpdateSet(set.id, 'romCm', parseFloat(val) || 0)}
                                                />
                                            )}

                                            <TouchableOpacity
                                                style={[styles.colCheck, styles.checkBox, set.completed && styles.checkBoxChecked, { borderColor: set.completed ? colors.success : colors.border, backgroundColor: set.completed ? colors.success : 'transparent' }]}
                                                onPress={() => onToggleSetComplete(set.id, set.completed)}
                                                accessibilityRole="checkbox"
                                                accessibilityState={{ checked: set.completed }}
                                                accessibilityLabel={`Set ${index + 1} ${set.completed ? 'completed' : 'incomplete'}`}
                                            >
                                                {set.completed && <Text style={{ color: 'white' }}>✓</Text>}
                                            </TouchableOpacity>
                                        </View>
                                    ))}

                                    <View style={styles.setButtonsRow}>
                                        {exerciseSets.length > 0 && (
                                            <TouchableOpacity
                                                style={[styles.removeSetButton, { backgroundColor: colors.bgLight }]}
                                                onPress={() => handleRemoveSet(exercise.id)}
                                                accessibilityRole="button"
                                                accessibilityLabel={`Remove last set from ${exercise.name}`}
                                            >
                                                <Text style={[styles.removeSetText, { color: colors.danger }]}>− Remove Set</Text>
                                            </TouchableOpacity>
                                        )}
                                        <TouchableOpacity
                                            style={[styles.addSetButton, { backgroundColor: colors.bgLight }]}
                                            onPress={() => handleAddSet(exercise.id)}
                                            accessibilityRole="button"
                                            accessibilityLabel={`Add set to ${exercise.name}`}
                                        >
                                            <Text style={[styles.addSetText, { color: colors.primary }]}>+ Add Set</Text>
                                        </TouchableOpacity>
                                    </View>
                                </TouchableOpacity>
                            </ScaleDecorator>
                        );
                    }}
                    ListFooterComponent={
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
                            accessibilityRole="button"
                            accessibilityLabel="Add exercise to workout"
                        >
                            <Text style={[styles.addExerciseText, { color: colors.primary }]}>+ Add Exercise</Text>
                        </TouchableOpacity>
                    }
                />
            </KeyboardAvoidingView>

            {/* Toast Notification */}
            {
                showToast && (
                    <Animated.View style={[styles.toast, { opacity: fadeAnim, backgroundColor: colors.surface }]}>
                        <Text style={[styles.toastText, textStyle]}>Great job!</Text>
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
                    <View style={[styles.modalContent, surfaceStyle]}>
                        <Text style={[styles.modalTitle, textStyle]}>Options</Text>

                        <TouchableOpacity style={styles.modalButton} onPress={handleOpenNoteModal}>
                            <Text style={[styles.modalButtonText, buttonTextStyle]}>Add Note</Text>
                        </TouchableOpacity>

                        <View style={[styles.divider, { backgroundColor: colors.border }]} />

                        <TouchableOpacity style={styles.modalButton} onPress={handleDeleteExercise}>
                            <Text style={[styles.modalButtonText, { color: colors.danger }]}>Delete Exercise</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.cancelButton} onPress={() => setShowExerciseModal(false)}>
                            <Text style={[styles.cancelButtonText, textMutedStyle]}>Cancel</Text>
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
                    <View style={[styles.modalContent, surfaceStyle]}>
                        <Text style={[styles.modalTitle, textStyle]}>Add Note</Text>
                        <TextInput
                            style={[styles.noteInput, { color: colors.text, borderColor: colors.border }]}
                            placeholder="Type your notes here..."
                            placeholderTextColor={colors.textMuted}
                            value={currentNote}
                            onChangeText={setCurrentNote}
                            multiline
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowNoteModal(false)}>
                                <Text style={[styles.cancelButtonText, textMutedStyle]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSaveNote}>
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
            {/* RPE Modal */}
            <Modal
                visible={showRpeModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowRpeModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, surfaceStyle]}>
                        <Text style={[styles.modalTitle, textStyle]}>Rate RPE (1-10)</Text>
                        <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 16, textAlign: 'center' }}>
                            1 = Very Easy, 10 = Max Effort
                        </Text>

                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                <TouchableOpacity
                                    key={num}
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 20,
                                        backgroundColor: currentRpe === num ? colors.primary : colors.background,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        borderWidth: 1,
                                        borderColor: currentRpe === num ? colors.primary : colors.border
                                    }}
                                    onPress={() => setCurrentRpe(num)}
                                >
                                    <Text style={{
                                        color: currentRpe === num ? '#FFF' : colors.text,
                                        fontWeight: '600'
                                    }}>
                                        {num}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowRpeModal(false)}>
                                <Text style={[styles.cancelButtonText, textMutedStyle]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={onSaveRpe}>
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
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Theme.Spacing.m,
        paddingVertical: Theme.Spacing.s,
        borderBottomWidth: 1,
    },
    finishButton: {
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
        fontSize: Theme.Typography.scale.md,
        fontWeight: '600',
        color: Theme.Colors.primary,
    },
    exerciseCard: {
        borderRadius: 12,
        padding: Theme.Spacing.m,
        marginBottom: Theme.Spacing.m,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    exerciseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Theme.Spacing.m,
    },
    exerciseTitle: {
        fontSize: Theme.Typography.scale.lg,
        fontWeight: '600',
        // color in inline style
    },
    noteText: {
        fontSize: Theme.Typography.scale.sm,
        marginTop: 4,
    },
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Theme.Spacing.s,
    },
    colSet: { width: 36, alignItems: 'center', flexShrink: 0 },
    colInput: { flex: 1, alignItems: 'center', flexShrink: 1, marginHorizontal: 8 },
    colCheck: { width: 32, alignItems: 'flex-end', flexShrink: 0 },

    headerText: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
    },
    setBadge: {
        width: 24,
        height: 24,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    setText: {
        fontSize: 12,
        fontWeight: '600',
    },
    input: {
        flex: 1,
        height: 36,
        borderRadius: 6,
        textAlign: 'center',
        fontSize: 14,
        minWidth: 40,
        marginHorizontal: 4,
    },
    checkBox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkBoxChecked: {
        // backgroundColor: Theme.Colors.success, // Dynamic inline
    },
    setButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 12,
        gap: 12,
    },
    removeSetButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    removeSetText: {
        fontSize: 14,
        fontWeight: '600',
    },
    addSetButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    addSetText: {
        fontSize: 14,
        fontWeight: '600',
    },
    addExerciseButton: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        // backgroundColor set inline dynamic
    },
    addExerciseText: {
        fontSize: 16,
        fontWeight: '600',
    },

    // Toast
    toast: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    toastText: {
        fontWeight: '600',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Theme.Spacing.l,
    },
    modalContent: {
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
        marginBottom: 16, // Fixed spacing
        textAlign: 'center',
    },
    modalActions: {
        width: '100%',
        marginBottom: 16,
    },
    modalButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    modalButtonText: {
        fontSize: 17,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        marginVertical: 4,
        width: '100%'
    },
    cancelButton: {
        marginTop: 8,
    },
    cancelButtonText: {
        fontSize: 17,
        fontWeight: '600',
    },
    saveButton: {
        marginTop: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 16,
    },
    noteInput: {
        width: '100%',
        height: 100,
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        textAlignVertical: 'top',
        marginBottom: 16,
    },
    bodyText: {
        fontSize: Theme.Typography.scale.md,
    },
    captionText: {
        fontSize: Theme.Typography.scale.sm,
    }
});
