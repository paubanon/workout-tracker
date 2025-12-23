import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Switch, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Animated, { FadeIn, FadeOut, Layout, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../theme';
import { supabaseService } from '../../services/SupabaseDataService';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MetricType, RepsType, Exercise } from '../../models';
import { useTheme } from '../../context/ThemeContext';
import { GlowCard } from '../../components/GlowCard';

export const EditExerciseScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { colors, isDark } = useTheme();

    // Get exercise from route params
    const exercise: Exercise = route.params?.exercise;

    const [name, setName] = useState(exercise?.name || '');
    const [saving, setSaving] = useState(false);

    // Initialize metrics from exercise
    const [metrics, setMetrics] = useState<Record<MetricType, boolean>>(() => {
        const initial: Record<MetricType, boolean> = {
            load: false,
            reps: false,
            time: false,
            distance: false,
            rom: false,
        };
        (exercise?.enabledMetrics || []).forEach(m => {
            initial[m] = true;
        });
        return initial;
    });

    const [repsType, setRepsType] = useState<RepsType>(exercise?.repsType || 'standard');
    const [trackBodyWeight, setTrackBodyWeight] = useState(exercise?.trackBodyWeight || false);

    // Sliding indicator for reps type
    const SEGMENT_OPTIONS: RepsType[] = ['standard', 'tempo', 'isometric'];
    const indicatorPosition = useSharedValue(0);
    const [segmentContainerWidth, setSegmentContainerWidth] = useState(0);

    useEffect(() => {
        const index = SEGMENT_OPTIONS.indexOf(repsType);
        indicatorPosition.value = withTiming(index, { duration: 250 });
    }, [repsType]);

    const segmentWidth = (segmentContainerWidth - 4) / 3;
    const indicatorStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: indicatorPosition.value * segmentWidth }],
            width: segmentWidth,
        };
    });

    const toggleMetric = (m: MetricType) => {
        setMetrics(prev => ({ ...prev, [m]: !prev[m] }));
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter an exercise name');
            return;
        }

        setSaving(true);
        const enabledMetrics = (Object.keys(metrics) as MetricType[]).filter(k => metrics[k]);

        await supabaseService.updateExercise({
            id: exercise.id,
            name,
            enabledMetrics,
            repsType: metrics.reps ? repsType : undefined,
            trackBodyWeight: metrics.load ? trackBodyWeight : undefined,
        });

        setSaving(false);
        Alert.alert('Success', 'Exercise updated!', [
            { text: 'OK', onPress: () => navigation.goBack() }
        ]);
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Exercise',
            `Are you sure you want to delete "${exercise.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await supabaseService.deleteExercise(exercise.id);
                        navigation.goBack();
                    }
                }
            ]
        );
    };

    if (!exercise) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.text, padding: 20 }}>No exercise data</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel"
                >
                    <Text style={[styles.cancelText, { color: colors.danger }]}>Cancel</Text>
                </TouchableOpacity>
                <Text style={[{ fontSize: Theme.Typography.scale.lg, fontWeight: Theme.Typography.weight.bold }, { color: colors.text }]}>Edit Exercise</Text>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    accessibilityRole="button"
                    accessibilityLabel="Save exercise"
                >
                    <Text style={[styles.saveText, { color: colors.primary }, saving && { opacity: 0.5 }]}>
                        {saving ? 'Saving...' : 'Save'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <Text style={[styles.label, { color: colors.textMuted }]}>Name</Text>
                    <GlowCard style={styles.inputCard} level="m">
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            placeholder="e.g. Back Squat"
                            placeholderTextColor={colors.textMuted}
                            value={name}
                            onChangeText={setName}
                        />
                    </GlowCard>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Metrics to Track</Text>
                    <Text style={[styles.hint, { color: colors.textMuted }]}>Select what you want to log for this exercise.</Text>

                    {['load', 'reps', 'time', 'distance', 'rom'].map((m) => (
                        <Animated.View key={m} layout={Layout.duration(300)}>
                            <GlowCard style={[styles.rowCard, { marginBottom: 4 }]} level="m">
                                <Animated.View layout={Layout.duration(300)} style={[styles.row, { zIndex: 1 }]}>
                                    <Text style={[styles.rowLabel, { color: colors.text }]}>
                                        {m === 'rom' ? 'Range of Motion (ROM)' : m.charAt(0).toUpperCase() + m.slice(1)}
                                    </Text>
                                    <Switch
                                        value={metrics[m as MetricType]}
                                        onValueChange={() => toggleMetric(m as MetricType)}
                                        trackColor={{ false: "#767577", true: colors.primary }}
                                        thumbColor={"#f4f3f4"}
                                        ios_backgroundColor="#3e3e3e"
                                    />
                                </Animated.View>
                            </GlowCard>

                            {/* Repetition Type Section */}
                            {m === 'reps' && metrics.reps && (
                                <Animated.View
                                    entering={FadeIn.duration(300)}
                                    exiting={FadeOut.duration(200)}
                                    style={{ marginBottom: 4 }}
                                >
                                    <GlowCard style={styles.unfoldingCard} level="m">
                                        <View style={styles.unfoldingContent}>
                                            <Text style={[styles.subLabel, { color: colors.textMuted }]}>Repetition Type</Text>
                                            <View
                                                style={[styles.segmentContainer, { backgroundColor: colors.border }]}
                                                onLayout={(e) => setSegmentContainerWidth(e.nativeEvent.layout.width)}
                                            >
                                                <Animated.View
                                                    style={[
                                                        styles.segmentIndicator,
                                                        { backgroundColor: colors.surface },
                                                        indicatorStyle
                                                    ]}
                                                />
                                                {SEGMENT_OPTIONS.map((type) => (
                                                    <TouchableOpacity
                                                        key={type}
                                                        style={styles.segment}
                                                        onPress={() => setRepsType(type)}
                                                    >
                                                        <Text style={[styles.segmentText, { color: colors.text }, repsType === type && styles.segmentTextActive]}>
                                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    </GlowCard>
                                </Animated.View>
                            )}

                            {/* Body Weight Section */}
                            {m === 'load' && metrics.load && (
                                <Animated.View
                                    entering={FadeIn.duration(300)}
                                    exiting={FadeOut.duration(200)}
                                    style={{ marginBottom: 4 }}
                                >
                                    <GlowCard style={styles.unfoldingCard} level="m">
                                        <View style={styles.unfoldingContent}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Text style={[styles.subLabel, { color: colors.textMuted, marginBottom: 0 }]}>Add Body Weight?</Text>
                                                <Switch
                                                    value={trackBodyWeight}
                                                    onValueChange={setTrackBodyWeight}
                                                    trackColor={{ false: "#767577", true: colors.primary }}
                                                    thumbColor={"#f4f3f4"}
                                                    ios_backgroundColor="#3e3e3e"
                                                />
                                            </View>
                                            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 8 }}>
                                                If checked, your body weight will be added to the logged load automatically.
                                            </Text>
                                        </View>
                                    </GlowCard>
                                </Animated.View>
                            )}
                        </Animated.View>
                    ))}
                </View>

                {/* Delete Button */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={[styles.deleteButton, { borderColor: colors.danger }]}
                        onPress={handleDelete}
                        accessibilityRole="button"
                        accessibilityLabel="Delete exercise"
                    >
                        <Text style={[styles.deleteButtonText, { color: colors.danger }]}>Delete Exercise</Text>
                    </TouchableOpacity>
                </View>

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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Theme.Spacing.m,
        borderBottomWidth: 1,
    },
    cancelText: {
        fontSize: Theme.Typography.scale.md,
        fontWeight: Theme.Typography.weight.regular,
    },
    saveText: {
        fontSize: Theme.Typography.scale.md,
        fontWeight: Theme.Typography.weight.bold,
    },
    content: {
        padding: Theme.Spacing.m,
        paddingBottom: 40,
    },
    section: {
        marginBottom: Theme.Spacing.l,
    },
    label: {
        fontSize: Theme.Typography.scale.sm,
        fontWeight: Theme.Typography.weight.medium,
        marginBottom: Theme.Spacing.s,
    },
    inputCard: {
        borderRadius: 12,
    },
    input: {
        padding: Theme.Spacing.m,
        fontSize: 17,
    },
    sectionTitle: {
        fontSize: Theme.Typography.scale.md,
        fontWeight: Theme.Typography.weight.semibold,
        marginBottom: Theme.Spacing.xs,
    },
    hint: {
        fontSize: Theme.Typography.scale.sm,
        marginBottom: Theme.Spacing.m,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Theme.Spacing.m,
    },
    rowCard: {
        borderRadius: 12,
    },
    rowLabel: {
        fontSize: 17,
    },
    segmentContainer: {
        flexDirection: 'row',
        borderRadius: 8,
        padding: 2,
        position: 'relative',
    },
    segmentIndicator: {
        position: 'absolute',
        top: 2,
        bottom: 2,
        left: 2,
        borderRadius: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
    },
    segment: {
        flex: 1,
        paddingVertical: 6,
        alignItems: 'center',
        borderRadius: 6,
    },
    segmentText: {
        fontSize: 13,
        fontWeight: '500',
    },
    segmentTextActive: {
        fontWeight: '600',
    },
    unfoldingCard: {
        borderRadius: 12,
    },
    unfoldingContent: {
        padding: Theme.Spacing.m,
    },
    subLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
    },
    deleteButton: {
        borderWidth: 1,
        borderRadius: 12,
        padding: Theme.Spacing.m,
        alignItems: 'center',
        marginTop: Theme.Spacing.l,
    },
    deleteButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
