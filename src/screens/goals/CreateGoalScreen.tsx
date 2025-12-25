import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Theme } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { GlowCard } from '../../components/GlowCard';
import { supabaseService } from '../../services/SupabaseDataService';
import { ExerciseGoal, MetricType } from '../../models';
import { sanitizeDecimal, parseDecimal, sanitizeInteger, parseInteger } from '../../utils/inputValidation';

const METRIC_CONFIG: Record<MetricType, { label: string; unit: string; field: keyof ExerciseGoal }> = {
    load: { label: 'Load', unit: 'kg', field: 'targetLoad' },
    reps: { label: 'Reps', unit: '', field: 'targetReps' },
    time: { label: 'Time', unit: 's', field: 'targetTime' },
    distance: { label: 'Distance', unit: 'm', field: 'targetDistance' },
    rom: { label: 'ROM', unit: 'cm', field: 'targetRom' }
};

export const CreateGoalScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { colors } = useTheme();
    const { exerciseId, exerciseName, enabledMetrics, goalToEdit, repsType } = route.params;

    const [name, setName] = useState(goalToEdit?.name || '');
    const [targetLoad, setTargetLoad] = useState(goalToEdit?.targetLoad?.toString() || '');
    const [targetReps, setTargetReps] = useState(goalToEdit?.targetReps?.toString() || '');
    const [targetTime, setTargetTime] = useState(goalToEdit?.targetTime?.toString() || '');
    const [targetDistance, setTargetDistance] = useState(goalToEdit?.targetDistance?.toString() || '');
    const [targetRom, setTargetRom] = useState(goalToEdit?.targetRom?.toString() || '');
    const [targetIsometricTime, setTargetIsometricTime] = useState(goalToEdit?.targetIsometricTime?.toString() || '');
    const [targetTempo, setTargetTempo] = useState(goalToEdit?.targetTempo || '');
    const [saving, setSaving] = useState(false);

    const isEditing = !!goalToEdit;
    const isIsometric = repsType === 'isometric';
    const isTempo = repsType === 'tempo';

    const handleSave = async () => {
        // Validate at least one target is set
        const hasTarget = targetLoad || targetReps || targetTime || targetDistance || targetRom || targetIsometricTime || targetTempo;
        if (!hasTarget) {
            Alert.alert('Error', 'Please set at least one target metric');
            return;
        }

        setSaving(true);

        const goalData = {
            userId: '', // Will be set by service
            exerciseId,
            name: name.trim() || undefined,
            targetLoad: targetLoad ? parseDecimal(targetLoad) : undefined,
            targetReps: targetReps ? parseInteger(targetReps) : undefined,
            targetTime: targetTime ? parseInteger(targetTime) : undefined,
            targetDistance: targetDistance ? parseInteger(targetDistance) : undefined,
            targetRom: targetRom ? parseDecimal(targetRom) : undefined,
            targetIsometricTime: targetIsometricTime ? parseInteger(targetIsometricTime) : undefined,
            targetTempo: targetTempo.trim() || undefined,
            completed: goalToEdit?.completed || false,
            completedAt: goalToEdit?.completedAt
        };

        if (isEditing) {
            await supabaseService.updateGoal({ ...goalData, id: goalToEdit.id, createdAt: goalToEdit.createdAt });
        } else {
            await supabaseService.addGoal(goalData);
        }

        setSaving(false);
        navigation.goBack();
    };

    const renderMetricInput = (metric: MetricType) => {
        if (!enabledMetrics.includes(metric)) return null;

        const config = METRIC_CONFIG[metric];
        let value = '';
        let setValue: (v: string) => void = () => { };
        let keyboardType: 'decimal-pad' | 'number-pad' = 'number-pad';

        switch (metric) {
            case 'load':
                value = targetLoad;
                setValue = (v) => setTargetLoad(sanitizeDecimal(v));
                keyboardType = 'decimal-pad';
                break;
            case 'reps':
                value = targetReps;
                setValue = (v) => setTargetReps(sanitizeInteger(v));
                break;
            case 'time':
                value = targetTime;
                setValue = (v) => setTargetTime(sanitizeInteger(v));
                break;
            case 'distance':
                value = targetDistance;
                setValue = (v) => setTargetDistance(sanitizeInteger(v));
                break;
            case 'rom':
                value = targetRom;
                setValue = (v) => setTargetRom(sanitizeDecimal(v));
                keyboardType = 'decimal-pad';
                break;
        }

        return (
            <GlowCard key={metric} style={styles.inputCard} level="m">
                <View style={styles.inputRow}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                        {config.label} {config.unit && `(${config.unit})`}
                    </Text>
                    <TextInput
                        style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                        placeholder="-"
                        placeholderTextColor={colors.textMuted}
                        keyboardType={keyboardType}
                        value={value}
                        onChangeText={setValue}
                    />
                </View>
            </GlowCard>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={[styles.cancelText, { color: colors.danger }]}>Cancel</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    {isEditing ? 'Edit Goal' : 'New Goal'}
                </Text>
                <TouchableOpacity onPress={handleSave} disabled={saving}>
                    <Text style={[styles.saveText, { color: colors.primary, opacity: saving ? 0.5 : 1 }]}>
                        {saving ? 'Saving...' : 'Save'}
                    </Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
                    <Text style={[styles.exerciseLabel, { color: colors.textMuted }]}>
                        Goal for {exerciseName}
                    </Text>

                    <GlowCard style={styles.inputCard} level="m">
                        <View style={styles.inputRow}>
                            <Text style={[styles.inputLabel, { color: colors.text }]}>Name (optional)</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                                placeholder="e.g. 100kg Bench"
                                placeholderTextColor={colors.textMuted}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>
                    </GlowCard>

                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Target Metrics</Text>
                    <Text style={[styles.hint, { color: colors.textMuted }]}>
                        Set at least one target to achieve
                    </Text>

                    {(['load', 'reps', 'time', 'distance', 'rom'] as MetricType[]).map(renderMetricInput)}

                    {/* Isometric Time - shown for isometric reps */}
                    {isIsometric && enabledMetrics.includes('reps') && (
                        <GlowCard style={styles.inputCard} level="m">
                            <View style={styles.inputRow}>
                                <Text style={[styles.inputLabel, { color: colors.text }]}>
                                    Isometric Time (s)
                                </Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                                    placeholder="-"
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="number-pad"
                                    value={targetIsometricTime}
                                    onChangeText={(v) => setTargetIsometricTime(sanitizeInteger(v))}
                                />
                            </View>
                        </GlowCard>
                    )}

                    {/* Tempo - shown for tempo reps */}
                    {isTempo && enabledMetrics.includes('reps') && (
                        <GlowCard style={styles.inputCard} level="m">
                            <View style={styles.inputRow}>
                                <Text style={[styles.inputLabel, { color: colors.text }]}>
                                    Tempo (e.g. 3010)
                                </Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                                    placeholder="3010"
                                    placeholderTextColor={colors.textMuted}
                                    value={targetTempo}
                                    onChangeText={setTargetTempo}
                                />
                            </View>
                        </GlowCard>
                    )}

                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: colors.primary }]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        <Text style={[styles.saveButtonText, { color: colors.surface }]}>
                            {saving ? 'Saving...' : 'Save Goal'}
                        </Text>
                    </TouchableOpacity>

                    {isEditing && (
                        <TouchableOpacity
                            style={[styles.deleteButton, { borderColor: colors.danger, borderWidth: 1, marginTop: 12 }]}
                            onPress={() => {
                                Alert.alert(
                                    "Delete Goal",
                                    "Are you sure you want to delete this goal?",
                                    [
                                        { text: "Cancel", style: "cancel" },
                                        {
                                            text: "Delete",
                                            style: "destructive",
                                            onPress: async () => {
                                                if (goalToEdit?.id) {
                                                    await supabaseService.deleteGoal(goalToEdit.id);
                                                    navigation.goBack();
                                                }
                                            }
                                        }
                                    ]
                                );
                            }}
                        >
                            <Text style={[styles.deleteButtonText, { color: colors.danger }]}>Delete Goal</Text>
                        </TouchableOpacity>
                    )}
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Theme.Spacing.m,
        borderBottomWidth: 1,
    },
    cancelText: {
        fontSize: 17,
    },
    headerTitle: {
        fontSize: Theme.Typography.scale.lg,
        fontWeight: '600',
    },
    saveText: {
        fontSize: 17,
        fontWeight: '600',
    },
    content: {
        padding: 16,
    },
    exerciseLabel: {
        fontSize: 14,
        marginBottom: Theme.Spacing.m,
    },
    sectionTitle: {
        fontSize: Theme.Typography.scale.lg,
        fontWeight: '600',
        marginTop: Theme.Spacing.l,
        marginBottom: 16,
    },
    hint: {
        fontSize: 13,
        marginBottom: Theme.Spacing.m,
    },
    inputCard: {
        borderRadius: 12,
        marginBottom: Theme.Spacing.s,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Theme.Spacing.m,
    },
    inputLabel: {
        fontSize: 16,
        flex: 1,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: Theme.Typography.scale.md,
        minWidth: 100,
        textAlign: 'center',
    },
    saveButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    saveButtonText: {
        fontSize: Theme.Typography.scale.lg,
        fontWeight: '600',
    },
    deleteButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    deleteButtonText: {
        fontSize: Theme.Typography.scale.lg,
        fontWeight: '600',
    }
});
