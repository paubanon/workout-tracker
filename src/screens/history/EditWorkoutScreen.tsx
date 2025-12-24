import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Theme } from '../../theme';
import { WorkoutSession, SetLog } from '../../models';
import { Ionicons } from '@expo/vector-icons';
import { supabaseService } from '../../services/SupabaseDataService';
import { useTheme } from '../../context/ThemeContext';
import { sanitizeDecimal, parseDecimal, sanitizeInteger, parseInteger } from '../../utils/inputValidation';

export const EditWorkoutScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { session } = route.params as { session: WorkoutSession };
    const { colors } = useTheme();

    const [workoutName, setWorkoutName] = useState(session.name || '');
    const [workoutDate, setWorkoutDate] = useState(new Date(session.date).toISOString().split('T')[0]);
    const [sets, setSets] = useState<SetLog[]>(session.sets);
    const [saving, setSaving] = useState(false);

    const [exerciseNames, setExerciseNames] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        supabaseService.getExercises().then(all => {
            const map: any = {};
            all.forEach(e => map[e.id] = e.name);
            setExerciseNames(map);
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);

        const updatedSession: WorkoutSession = {
            ...session,
            name: workoutName,
            date: new Date(workoutDate).toISOString(),
            sets: sets
        };

        await supabaseService.updateWorkoutSession(updatedSession);
        setSaving(false);
        Alert.alert('Success', 'Workout updated successfully', [
            { text: 'OK', onPress: () => navigation.goBack() }
        ]);
    };

    const updateSet = (index: number, field: keyof SetLog, value: any) => {
        const newSets = [...sets];
        newSets[index] = { ...newSets[index], [field]: value };
        setSets(newSets);
    };

    const deleteSet = (index: number) => {
        Alert.alert('Delete Set', 'Are you sure you want to delete this set?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => setSets(sets.filter((_, i) => i !== index))
            }
        ]);
    };

    const addSet = (exerciseId: string) => {
        const newSet: SetLog = {
            id: `new_${Date.now()}`,
            exerciseId,
            setNumber: sets.filter(s => s.exerciseId === exerciseId).length + 1,
            completed: false,
        };
        setSets([...sets, newSet]);
    };

    const handleAddExercise = () => {
        navigation.navigate('ExerciseList', {
            onSelect: (exerciseId: string) => {
                const newSet: SetLog = {
                    id: `new_${Date.now()}`,
                    exerciseId,
                    setNumber: 1,
                    completed: false,
                };
                setSets(prev => [...prev, newSet]);
            }
        });
    };

    // Group sets by exercise
    const groupedSets: { [key: string]: { sets: SetLog[], indices: number[] } } = {};
    sets.forEach((set, index) => {
        if (!groupedSets[set.exerciseId]) {
            groupedSets[set.exerciseId] = { sets: [], indices: [] };
        }
        groupedSets[set.exerciseId].sets.push(set);
        groupedSets[set.exerciseId].indices.push(index);
    });

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        accessibilityRole="button"
                        accessibilityLabel="Close"
                    >
                        <Ionicons name="close" size={24} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={[Theme.Typography.subtitle, { color: colors.text }]}>Edit Workout</Text>
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={saving}
                        accessibilityRole="button"
                        accessibilityLabel={saving ? 'Saving' : 'Save workout'}
                    >
                        <Text style={[styles.saveButton, { color: colors.primary }, saving && styles.saveButtonDisabled]}>
                            {saving ? 'Saving...' : 'Save'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={styles.content}
                    automaticallyAdjustKeyboardInsets={true}
                >
                    {/* Workout Name */}
                    <View style={styles.field}>
                        <Text style={[styles.label, { color: colors.text }]}>Workout Name</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                            value={workoutName}
                            onChangeText={setWorkoutName}
                            placeholder="Enter workout name"
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>

                    {/* Date */}
                    <View style={styles.field}>
                        <Text style={[styles.label, { color: colors.text }]}>Date (YYYY-MM-DD)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                            value={workoutDate}
                            onChangeText={setWorkoutDate}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>

                    {/* Exercises */}
                    {Object.keys(groupedSets).map(exerciseId => {
                        const { sets: exerciseSets, indices } = groupedSets[exerciseId];
                        const exerciseName = exerciseNames[exerciseId] || 'Loading...';

                        return (
                            <View key={exerciseId} style={[styles.exerciseCard, { backgroundColor: colors.surface }]}>
                                <Text style={[styles.exerciseTitle, { color: colors.text }]}>{exerciseName}</Text>

                                {exerciseSets.map((set, i) => {
                                    const globalIndex = indices[i];
                                    return (
                                        <View key={globalIndex} style={styles.setRow}>
                                            <Text style={[styles.setNumber, { color: colors.textMuted }]}>{i + 1}</Text>
                                            <View style={styles.setInputs}>
                                                <View style={styles.inputGroup}>
                                                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>KG</Text>
                                                    <TextInput
                                                        style={[styles.setInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                                        value={set.loadKg?.toString() || ''}
                                                        onChangeText={(text) => {
                                                            const sanitized = sanitizeDecimal(text);
                                                            updateSet(globalIndex, 'loadKg', parseDecimal(sanitized));
                                                        }}
                                                        keyboardType="decimal-pad"
                                                        placeholderTextColor={colors.textMuted}
                                                    />
                                                </View>
                                                <View style={styles.inputGroup}>
                                                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Reps</Text>
                                                    <TextInput
                                                        style={[styles.setInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                                        value={set.reps?.toString() || ''}
                                                        onChangeText={(text) => {
                                                            const sanitized = sanitizeInteger(text);
                                                            updateSet(globalIndex, 'reps', parseInteger(sanitized));
                                                        }}
                                                        keyboardType="number-pad"
                                                        placeholderTextColor={colors.textMuted}
                                                    />
                                                </View>
                                                <View style={styles.inputGroup}>
                                                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>RPE</Text>
                                                    <TextInput
                                                        style={[styles.setInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                                        value={set.rpe?.toString() || ''}
                                                        onChangeText={(text) => {
                                                            const sanitized = sanitizeInteger(text);
                                                            let val = parseInteger(sanitized);
                                                            // Clamp RPE between 1 and 10 (0 means empty)
                                                            if (val > 10) val = 10;
                                                            if (val < 0) val = 0;
                                                            updateSet(globalIndex, 'rpe', val === 0 ? undefined : val);
                                                        }}
                                                        keyboardType="number-pad"
                                                        placeholderTextColor={colors.textMuted}
                                                        placeholder="1-10"
                                                        maxLength={2}
                                                    />
                                                </View>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.deleteButton}
                                                onPress={() => deleteSet(globalIndex)}
                                                accessibilityRole="button"
                                                accessibilityLabel={`Delete set ${i + 1}`}
                                            >
                                                <Ionicons name="trash-outline" size={20} color={colors.danger} />
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}

                                {/* Add Set Button */}
                                <TouchableOpacity
                                    style={[styles.addSetButton, { borderColor: colors.primary }]}
                                    onPress={() => addSet(exerciseId)}
                                    accessibilityRole="button"
                                    accessibilityLabel="Add set"
                                >
                                    <Ionicons name="add" size={18} color={colors.primary} />
                                    <Text style={[styles.addSetText, { color: colors.primary }]}>Add Set</Text>
                                </TouchableOpacity>
                            </View>
                        );
                    })}

                    {/* Add Exercise Button */}
                    <TouchableOpacity
                        style={[styles.addExerciseButton, { backgroundColor: colors.primary }]}
                        onPress={handleAddExercise}
                        accessibilityRole="button"
                        accessibilityLabel="Add exercise"
                    >
                        <Ionicons name="add" size={20} color="#FFF" />
                        <Text style={styles.addExerciseText}>Add Exercise</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
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
    saveButton: {
        fontSize: 16,
        fontWeight: '600',
    },
    saveButtonDisabled: {
        opacity: 0.5,
    },
    content: {
        padding: Theme.Spacing.m,
        paddingBottom: 40,
    },
    field: {
        marginBottom: Theme.Spacing.m,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 6,
    },
    input: {
        borderRadius: 8,
        padding: Theme.Spacing.m,
        fontSize: 16,
        borderWidth: 1,
    },
    exerciseCard: {
        borderRadius: 12,
        padding: Theme.Spacing.m,
        marginBottom: Theme.Spacing.m,
    },
    exerciseTitle: {
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 12,
    },
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    setNumber: {
        fontSize: 16,
        fontWeight: '600',
        width: 30,
    },
    setInputs: {
        flex: 1,
        flexDirection: 'row',
        gap: 8,
    },
    inputGroup: {
        flex: 1,
    },
    inputLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    setInput: {
        borderRadius: 6,
        padding: 8,
        fontSize: 14,
        borderWidth: 1,
        textAlign: 'center',
    },
    deleteButton: {
        padding: 8,
    },
    addSetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderWidth: 1,
        borderRadius: 8,
        borderStyle: 'dashed',
        marginTop: 4,
        gap: 6,
    },
    addSetText: {
        fontSize: 14,
        fontWeight: '500',
    },
    addExerciseButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Theme.Spacing.m,
        borderRadius: 12,
        marginTop: Theme.Spacing.m,
        gap: 8,
    },
    addExerciseText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
});

