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

export const EditWorkoutScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { session } = route.params as { session: WorkoutSession };

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
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="close" size={24} color={Theme.Colors.primary} />
                    </TouchableOpacity>
                    <Text style={Theme.Typography.subtitle}>Edit Workout</Text>
                    <TouchableOpacity onPress={handleSave} disabled={saving}>
                        <Text style={[styles.saveButton, saving && styles.saveButtonDisabled]}>
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
                        <Text style={styles.label}>Workout Name</Text>
                        <TextInput
                            style={styles.input}
                            value={workoutName}
                            onChangeText={setWorkoutName}
                            placeholder="Enter workout name"
                            placeholderTextColor={Theme.Colors.textSecondary}
                        />
                    </View>

                    {/* Date */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
                        <TextInput
                            style={styles.input}
                            value={workoutDate}
                            onChangeText={setWorkoutDate}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={Theme.Colors.textSecondary}
                        />
                    </View>

                    {/* Exercises */}
                    {Object.keys(groupedSets).map(exerciseId => {
                        const { sets: exerciseSets, indices } = groupedSets[exerciseId];
                        const exerciseName = exerciseNames[exerciseId] || 'Loading...';

                        return (
                            <View key={exerciseId} style={styles.exerciseCard}>
                                <Text style={styles.exerciseTitle}>{exerciseName}</Text>

                                {exerciseSets.map((set, i) => {
                                    const globalIndex = indices[i];
                                    return (
                                        <View key={globalIndex} style={styles.setRow}>
                                            <Text style={styles.setNumber}>{i + 1}</Text>
                                            <View style={styles.setInputs}>
                                                <View style={styles.inputGroup}>
                                                    <Text style={styles.inputLabel}>KG</Text>
                                                    <TextInput
                                                        style={styles.setInput}
                                                        value={set.loadKg?.toString() || ''}
                                                        onChangeText={(text) => updateSet(globalIndex, 'loadKg', parseFloat(text) || 0)}
                                                        keyboardType="numeric"
                                                        placeholderTextColor={Theme.Colors.textSecondary}
                                                    />
                                                </View>
                                                <View style={styles.inputGroup}>
                                                    <Text style={styles.inputLabel}>Reps</Text>
                                                    <TextInput
                                                        style={styles.setInput}
                                                        value={set.reps?.toString() || ''}
                                                        onChangeText={(text) => updateSet(globalIndex, 'reps', parseInt(text) || 0)}
                                                        keyboardType="numeric"
                                                        placeholderTextColor={Theme.Colors.textSecondary}
                                                    />
                                                </View>
                                                <View style={styles.inputGroup}>
                                                    <Text style={styles.inputLabel}>RPE</Text>
                                                    <TextInput
                                                        style={styles.setInput}
                                                        value={set.rpe?.toString() || ''}
                                                        onChangeText={(text) => updateSet(globalIndex, 'rpe', parseFloat(text) || 0)}
                                                        keyboardType="numeric"
                                                        placeholderTextColor={Theme.Colors.textSecondary}
                                                    />
                                                </View>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.deleteButton}
                                                onPress={() => deleteSet(globalIndex)}
                                            >
                                                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                            </View>
                        );
                    })}
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
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Theme.Spacing.m,
        backgroundColor: Theme.Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Theme.Colors.border,
    },
    saveButton: {
        color: Theme.Colors.primary,
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
        color: Theme.Colors.text,
        marginBottom: 6,
    },
    input: {
        backgroundColor: Theme.Colors.surface,
        borderRadius: 8,
        padding: Theme.Spacing.m,
        fontSize: 16,
        color: Theme.Colors.text,
        borderWidth: 1,
        borderColor: Theme.Colors.border,
    },
    exerciseCard: {
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
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    setNumber: {
        fontSize: 16,
        fontWeight: '600',
        color: Theme.Colors.textSecondary,
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
        color: Theme.Colors.textSecondary,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    setInput: {
        backgroundColor: Theme.Colors.background,
        borderRadius: 6,
        padding: 8,
        fontSize: 14,
        color: Theme.Colors.text,
        borderWidth: 1,
        borderColor: Theme.Colors.border,
        textAlign: 'center',
    },
    deleteButton: {
        padding: 8,
    },
});
