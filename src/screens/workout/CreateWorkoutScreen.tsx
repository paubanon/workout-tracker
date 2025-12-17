import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Alert, Modal, ScrollView, Animated, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../theme';
import { supabaseService } from '../../services/SupabaseDataService';
import { Exercise, WorkoutTemplate, TemplateExercise, RepsType } from '../../models';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export const CreateWorkoutScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { templateToEdit } = route.params || {};

    const [name, setName] = useState(templateToEdit?.name || '');
    const [selectedExercises, setSelectedExercises] = useState<(TemplateExercise & { name: string, enabledMetrics: string[], repsType?: RepsType })[]>([]);
    const [keyboardOffset, setKeyboardOffset] = useState(0);

    // Toast State
    const [showToast, setShowToast] = useState(false);
    const fadeAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
            setKeyboardOffset(e.endCoordinates.height);
        });
        const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardOffset(0);
        });
        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    useEffect(() => {
        if (showToast) {
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
                }).start(() => navigation.goBack());
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [showToast]);

    useEffect(() => {
        if (templateToEdit) {
            loadDetails();
        }
    }, [templateToEdit]);

    const loadDetails = async () => {
        const all = await supabaseService.getExercises();
        const enriched = templateToEdit.exercises.map((te: any) => {
            const ex = all.find(e => e.id === te.exerciseId);
            // Initialize sets if legacy
            let sets = te.sets || [];
            if (sets.length === 0 && te.targetSets) {
                for (let i = 0; i < te.targetSets; i++) {
                    sets.push({
                        targetLoad: te.targetLoad,
                        targetReps: te.targetReps,
                        targetTempo: te.targetTempo,
                        targetTime: te.targetTime,
                        targetDistance: te.targetDistance,
                        targetRom: te.targetRom
                    });
                }
            }
            if (sets.length === 0) {
                // Default 1 set
                sets.push({});
            }

            return {
                ...te,
                name: ex?.name || 'Unknown Exercise',
                enabledMetrics: ex?.enabledMetrics || [],
                repsType: ex?.repsType,
                sets
            };
        });
        setSelectedExercises(enriched);
    };

    const handleAddExercise = () => {
        navigation.navigate('ExerciseList', {
            onSelect: (ex: Exercise) => {
                const newEx: TemplateExercise & { name: string, enabledMetrics: string[], repsType?: RepsType } = {
                    exerciseId: ex.id,
                    name: ex.name,
                    enabledMetrics: ex.enabledMetrics,
                    repsType: ex.repsType,
                    sets: [{}], // Start with 1 empty set
                    targetSets: 0, // Legacy ignored
                };
                setSelectedExercises(prev => [...prev, newEx]);
            }
        });
    };

    const removeExercise = (index: number) => {
        const updated = [...selectedExercises];
        updated.splice(index, 1);
        setSelectedExercises(updated);
    };

    const addSet = (exerciseIndex: number) => {
        const updated = [...selectedExercises];
        // Duplicate last set if exists
        const sets = updated[exerciseIndex].sets;
        const lastSet = sets.length > 0 ? sets[sets.length - 1] : {};
        sets.push({ ...lastSet });
        setSelectedExercises(updated);
    };

    const removeSet = (exerciseIndex: number, setIndex: number) => {
        const updated = [...selectedExercises];
        updated[exerciseIndex].sets.splice(setIndex, 1);
        setSelectedExercises(updated);
    };

    const updateSet = (exerciseIndex: number, setIndex: number, field: keyof any, value: any) => {
        const updated = [...selectedExercises];
        updated[exerciseIndex].sets[setIndex] = {
            ...updated[exerciseIndex].sets[setIndex],
            [field]: value
        };
        setSelectedExercises(updated);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a routine name');
            return;
        }
        if (selectedExercises.length === 0) {
            Alert.alert('Error', 'Please add at least one exercise');
            return;
        }

        const newTemplate: WorkoutTemplate = {
            id: templateToEdit?.id || '',

            name,
            exercises: selectedExercises.map(({ name, enabledMetrics, repsType, ...rest }) => rest),
        };

        await supabaseService.addTemplate(newTemplate);
        setShowToast(true);
    };

    const renderItem = ({ item, index }: { item: TemplateExercise & { name: string, enabledMetrics: string[], repsType?: RepsType }, index: number }) => {
        const metrics = item.enabledMetrics || [];
        // Determine label for the 4th column (Tempo/Time)
        // If reps is enabled, and it's isometric -> Time (s)
        // If reps is enabled, and it's tempo -> Tempo
        // If reps is NOT enabled, but time IS enabled -> Time (s) (handled by 5th col usually, but let's check structure)

        let showTempoCol = false;
        let tempoLabel = "TEMPO";
        let isIsometric = item.repsType === 'isometric';

        if (metrics.includes('reps')) {
            if (item.repsType === 'tempo' || item.repsType === 'isometric') {
                showTempoCol = true;
                if (isIsometric) {
                    tempoLabel = "TIME (s)";
                }
            }
        }

        return (
            <View style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{item.name}</Text>
                    <TouchableOpacity onPress={() => removeExercise(index)}>
                        <Ionicons name="trash-outline" size={20} color={Theme.Colors.danger} />
                    </TouchableOpacity>
                </View>

                {/* Table Header */}
                <View style={styles.setRow}>
                    <Text style={[styles.colSet, styles.headerText]}>SET</Text>
                    {metrics.includes('load') && <Text style={[styles.colInput, styles.headerText]}>KG</Text>}
                    {metrics.includes('reps') && <Text style={[styles.colInput, styles.headerText]}>REPS</Text>}

                    {/* Tempo / Static Time Col */}
                    {showTempoCol && <Text style={[styles.colInput, styles.headerText]}>{tempoLabel}</Text>}

                    {/* Pure Time Col (if not covering isometric logic above) */}
                    {metrics.includes('time') && <Text style={[styles.colInput, styles.headerText]}>TIME</Text>}

                    {metrics.includes('distance') && <Text style={[styles.colInput, styles.headerText]}>DIST</Text>}
                    <View style={{ width: 30 }} />{/* Delete Set Col */}
                </View>

                {/* Sets Rows */}
                {item.sets.map((set, setIndex) => (
                    <View key={setIndex} style={styles.setRow}>
                        <View style={styles.colSet}>
                            <View style={styles.setBadge}><Text style={styles.setText}>{setIndex + 1}</Text></View>
                        </View>

                        {metrics.includes('load') && (
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                placeholder={set.targetLoad ? set.targetLoad.toString() : "-"}
                                placeholderTextColor={Theme.Colors.textSecondary}
                                value={set.targetLoad?.toString()}
                                onChangeText={v => updateSet(index, setIndex, 'targetLoad', parseFloat(v))}
                            />
                        )}
                        {metrics.includes('reps') && (
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                placeholder={set.targetReps ? set.targetReps.toString() : "-"}
                                placeholderTextColor={Theme.Colors.textSecondary}
                                value={set.targetReps?.toString()}
                                onChangeText={v => updateSet(index, setIndex, 'targetReps', v)}
                            />
                        )}

                        {/* Tempo Input */}
                        {showTempoCol && (
                            <TextInput
                                style={styles.input}
                                placeholder={isIsometric ? (set.targetTime?.toString() || "-") : (set.targetTempo || "-")}
                                placeholderTextColor={Theme.Colors.textSecondary}
                                value={isIsometric ? set.targetTime?.toString() : set.targetTempo}
                                onChangeText={v => updateSet(index, setIndex, isIsometric ? 'targetTime' : 'targetTempo', isIsometric ? parseFloat(v) : v)}
                            />
                        )}

                        {metrics.includes('time') && (
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                placeholder={set.targetTime ? set.targetTime.toString() : "-"}
                                placeholderTextColor={Theme.Colors.textSecondary}
                                value={set.targetTime?.toString()}
                                onChangeText={v => updateSet(index, setIndex, 'targetTime', parseFloat(v))}
                            />
                        )}
                        {metrics.includes('distance') && (
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                placeholder={set.targetDistance ? set.targetDistance.toString() : "-"}
                                placeholderTextColor={Theme.Colors.textSecondary}
                                value={set.targetDistance?.toString()}
                                onChangeText={v => updateSet(index, setIndex, 'targetDistance', parseFloat(v))}
                            />
                        )}

                        <TouchableOpacity onPress={() => removeSet(index, setIndex)} style={{ width: 30, alignItems: 'center' }}>
                            <Ionicons name="close-circle" size={20} color={Theme.Colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                ))}

                <TouchableOpacity style={styles.addSetButton} onPress={() => addSet(index)}>
                    <Text style={styles.addSetText}>+ Add Set</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={Theme.Typography.subtitle}>New Routine</Text>
                <TouchableOpacity onPress={handleSave}>
                    <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            >
                <View style={styles.content}>
                    <TextInput
                        style={styles.nameInput}
                        placeholder="Routine Name"
                        value={name}
                        onChangeText={setName}
                    />

                    <Text style={styles.sectionTitle}>Exercises</Text>
                    <FlatList
                        data={selectedExercises}
                        keyExtractor={(item, index) => `${item.exerciseId}-${index}`}
                        renderItem={renderItem}
                        contentContainerStyle={{ paddingBottom: 160 }} // Increased space even more
                        style={{ flex: 1 }}
                    />
                </View>
            </KeyboardAvoidingView>

            <TouchableOpacity
                style={[styles.fab, { bottom: Math.max(30, keyboardOffset + 20) }]} // Slightly higher shift
                onPress={handleAddExercise}
            >
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>

            {/* Toast Notification */}
            {showToast && (
                <Animated.View style={[styles.toast, { opacity: fadeAnim }]}>
                    <Text style={styles.toastText}>Routine Saved</Text>
                </Animated.View>
            )}
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
        padding: Theme.Spacing.m,
        backgroundColor: Theme.Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Theme.Colors.border,
    },
    cancelText: {
        color: Theme.Colors.textSecondary,
        fontSize: 17,
    },
    saveText: {
        color: Theme.Colors.primary,
        fontWeight: 'bold',
        fontSize: 17,
    },
    content: {
        flex: 1,
        padding: Theme.Spacing.m,
    },
    nameInput: {
        backgroundColor: Theme.Colors.surface,
        padding: Theme.Spacing.m,
        borderRadius: 12,
        fontSize: 18,
        marginBottom: Theme.Spacing.l,
    },
    sectionTitle: {
        ...Theme.Typography.subtitle,
        marginBottom: Theme.Spacing.s,
    },
    itemContainer: {
        backgroundColor: Theme.Colors.surface,
        padding: Theme.Spacing.m,
        borderRadius: 12,
        marginBottom: Theme.Spacing.m,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    itemTitle: {
        fontSize: 17,
        fontWeight: '600',
    },

    // Table Styles
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    headerText: {
        fontSize: 10,
        fontWeight: '700',
        color: Theme.Colors.textSecondary,
        textAlign: 'center',
    },
    colSet: { width: 40, alignItems: 'center' },
    colInput: { flex: 1, textAlign: 'center' },

    setBadge: {
        width: 24, height: 24, borderRadius: 12, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center'
    },
    setText: { fontSize: 12, fontWeight: 'bold' },

    input: {
        flex: 1,
        backgroundColor: Theme.Colors.background,
        borderRadius: 8,
        height: 40, // Increased height
        marginHorizontal: 4,
        textAlign: 'center',
        fontSize: 16,
        paddingVertical: 8, // Added padding
    },

    addSetButton: {
        paddingVertical: 10,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F2F2F7',
        marginTop: 8
    },
    addSetText: {
        color: Theme.Colors.primary,
        fontWeight: '600'
    },

    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        backgroundColor: Theme.Colors.primary,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
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
    }
});
