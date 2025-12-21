import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Animated, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
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
    const [selectedExercises, setSelectedExercises] = useState<(TemplateExercise & { name: string, enabledMetrics: string[], repsType?: RepsType, _id: string })[]>([]);
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
                sets.push({});
            }

            return {
                ...te,
                name: ex?.name || 'Unknown Exercise',
                enabledMetrics: ex?.enabledMetrics || [],
                repsType: ex?.repsType,
                sets,
                _id: Math.random().toString(36).substr(2, 9)
            };
        });
        setSelectedExercises(enriched);
    };

    const handleAddExercise = () => {
        navigation.navigate('ExerciseList', {
            onSelect: (ex: Exercise) => {
                const newEx: TemplateExercise & { name: string, enabledMetrics: string[], repsType?: RepsType, _id: string } = {
                    exerciseId: ex.id,
                    name: ex.name,
                    enabledMetrics: ex.enabledMetrics || [],
                    repsType: ex.repsType,
                    sets: [{}],
                    _id: Math.random().toString(36).substr(2, 9)
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

    const updateSet = (exerciseIndex: number, setIndex: number, field: string, value: any) => {
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
            exercises: selectedExercises.map(({ name, enabledMetrics, repsType, _id, ...rest }) => rest),
        };

        await supabaseService.addTemplate(newTemplate);
        setShowToast(true);
    };

    const renderItem = ({ item, getIndex, drag, isActive }: RenderItemParams<any>) => {
        const index = getIndex();
        const metrics = item.enabledMetrics || [];
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
            <ScaleDecorator>
                <TouchableOpacity
                    onLongPress={drag}
                    delayLongPress={750}
                    activeOpacity={1}
                    disabled={isActive}
                    style={[
                        styles.itemContainer,
                        { backgroundColor: isActive ? Theme.Colors.surface : Theme.Colors.surface }
                    ]}
                >
                    <View style={[styles.itemHeader, { justifyContent: 'space-between' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <TouchableOpacity onPressIn={drag} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Ionicons name="menu" size={24} color={Theme.Colors.textSecondary} style={{ marginRight: 10 }} />
                            </TouchableOpacity>
                            <Text style={styles.itemTitle}>{item.name}</Text>
                        </View>
                        <TouchableOpacity onPress={() => index !== undefined && removeExercise(index)}>
                            <Ionicons name="trash-outline" size={20} color={Theme.Colors.danger} />
                        </TouchableOpacity>
                    </View>

                    {/* Table Header */}
                    <View style={styles.setRow}>
                        <Text style={[styles.colSet, styles.headerText]}>SET</Text>
                        {metrics.includes('load') && <Text style={[styles.colInput, styles.headerText]}>KG</Text>}
                        {metrics.includes('reps') && <Text style={[styles.colInput, styles.headerText]}>REPS</Text>}
                        {showTempoCol && <Text style={[styles.colInput, styles.headerText]}>{tempoLabel}</Text>}
                        {metrics.includes('time') && <Text style={[styles.colInput, styles.headerText]}>TIME</Text>}
                        {metrics.includes('distance') && <Text style={[styles.colInput, styles.headerText]}>DIST</Text>}
                        <View style={{ width: 30 }} />
                    </View>

                    {/* Sets Rows */}
                    {item.sets.map((set: any, setIndex: number) => (
                        <View key={setIndex} style={styles.setRow}>
                            <View style={styles.colSet}>
                                <View style={styles.setBadge}><Text style={styles.setText}>{setIndex + 1}</Text></View>
                            </View>

                            {metrics.includes('load') && (
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    placeholder={set.targetLoad?.toString() || "-"}
                                    placeholderTextColor={Theme.Colors.textSecondary}
                                    value={set.targetLoad?.toString()}
                                    onChangeText={v => index !== undefined && updateSet(index, setIndex, 'targetLoad', parseFloat(v))}
                                />
                            )}
                            {metrics.includes('reps') && (
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    placeholder={set.targetReps?.toString() || "-"}
                                    placeholderTextColor={Theme.Colors.textSecondary}
                                    value={set.targetReps?.toString()}
                                    onChangeText={v => index !== undefined && updateSet(index, setIndex, 'targetReps', v)}
                                />
                            )}
                            {showTempoCol && (
                                <TextInput
                                    style={styles.input}
                                    placeholder={isIsometric ? (set.targetTime?.toString() || "-") : (set.targetTempo || "-")}
                                    placeholderTextColor={Theme.Colors.textSecondary}
                                    value={isIsometric ? set.targetTime?.toString() : set.targetTempo}
                                    onChangeText={v => index !== undefined && updateSet(index, setIndex, isIsometric ? 'targetTime' : 'targetTempo', isIsometric ? parseFloat(v) : v)}
                                />
                            )}
                            {metrics.includes('time') && (
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    placeholder={set.targetTime?.toString() || "-"}
                                    placeholderTextColor={Theme.Colors.textSecondary}
                                    value={set.targetTime?.toString()}
                                    onChangeText={v => index !== undefined && updateSet(index, setIndex, 'targetTime', parseFloat(v))}
                                />
                            )}
                            {metrics.includes('distance') && (
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    placeholder={set.targetDistance?.toString() || "-"}
                                    placeholderTextColor={Theme.Colors.textSecondary}
                                    value={set.targetDistance?.toString()}
                                    onChangeText={v => index !== undefined && updateSet(index, setIndex, 'targetDistance', parseFloat(v))}
                                />
                            )}

                            <TouchableOpacity onPress={() => index !== undefined && removeSet(index, setIndex)} style={{ width: 30, alignItems: 'center' }}>
                                <Ionicons name="close-circle" size={20} color={Theme.Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    ))}

                    <TouchableOpacity style={styles.addSetButton} onPress={() => index !== undefined && addSet(index)}>
                        <Text style={styles.addSetText}>+ Add Set</Text>
                    </TouchableOpacity>
                </TouchableOpacity>
            </ScaleDecorator>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={Theme.Typography.subtitle}>{templateToEdit ? 'Edit Routine' : 'New Routine'}</Text>
                <TouchableOpacity onPress={handleSave}>
                    <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            >
                <View style={{ flex: 1 }}>
                    <TextInput
                        style={styles.nameInput}
                        placeholder="Routine Name"
                        value={name}
                        onChangeText={setName}
                    />

                    <Text style={styles.sectionTitle}>Exercises</Text>

                    <DraggableFlatList
                        data={selectedExercises}
                        onDragEnd={({ data }) => setSelectedExercises(data)}
                        keyExtractor={(item) => item._id}
                        renderItem={renderItem}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ paddingBottom: 160, flexGrow: 1 }}
                        containerStyle={{ flex: 1 }}
                        ListEmptyComponent={
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.5, paddingTop: 100 }}>
                                <Ionicons name="barbell-outline" size={48} color={Theme.Colors.textSecondary} />
                                <Text style={{ marginTop: 16, color: Theme.Colors.textSecondary }}>No exercises added yet</Text>
                                <Text style={{ marginTop: 4, color: Theme.Colors.textSecondary, fontSize: 12 }}>Tap + to add one</Text>
                            </View>
                        }
                    />
                </View>
            </KeyboardAvoidingView>

            <TouchableOpacity
                style={[styles.fab, { bottom: Math.max(30, keyboardOffset + 20) }]}
                onPress={handleAddExercise}
            >
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>

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
    },
    nameInput: {
        backgroundColor: Theme.Colors.surface,
        padding: Theme.Spacing.m,
        borderRadius: 12,
        fontSize: 18,
        marginTop: Theme.Spacing.m,
        marginBottom: Theme.Spacing.m,
        marginHorizontal: Theme.Spacing.m,
    },
    sectionTitle: {
        ...Theme.Typography.subtitle,
        marginBottom: Theme.Spacing.s,
        marginHorizontal: Theme.Spacing.m,
    },
    itemContainer: {
        backgroundColor: Theme.Colors.surface,
        padding: Theme.Spacing.m,
        borderRadius: 12,
        marginBottom: Theme.Spacing.m,
        marginHorizontal: Theme.Spacing.m,
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
        width: 24, height: 24, borderRadius: 12, backgroundColor: Theme.Colors.background, justifyContent: 'center', alignItems: 'center'
    },
    setText: { fontSize: 12, fontWeight: 'bold' },
    input: {
        flex: 1,
        backgroundColor: Theme.Colors.background,
        borderRadius: 8,
        height: 40,
        marginHorizontal: 4,
        textAlign: 'center',
        fontSize: 16,
        paddingVertical: 8,
    },
    addSetButton: {
        paddingVertical: 10,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: Theme.Colors.background,
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
