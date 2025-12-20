import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Switch, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../theme';
import { supabaseService } from '../../services/SupabaseDataService';
import { useNavigation } from '@react-navigation/native';
import { MetricType, RepsType } from '../../models';
import { useTheme } from '../../context/ThemeContext';

export const CreateExerciseScreen = () => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const [name, setName] = useState('');

    // Metrics State
    const [metrics, setMetrics] = useState<Record<MetricType, boolean>>({
        load: true,
        reps: true,
        time: false,
        distance: false,
        rom: false,
    });

    const [repsType, setRepsType] = useState<RepsType>('standard');
    const [trackBodyWeight, setTrackBodyWeight] = useState(false);

    const toggleMetric = (m: MetricType) => {
        setMetrics(prev => ({ ...prev, [m]: !prev[m] }));
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter an exercise name');
            return;
        }

        const enabledMetrics = (Object.keys(metrics) as MetricType[]).filter(k => metrics[k]);

        await supabaseService.addExercise({
            id: '', // DB generates ID
            name,
            enabledMetrics,
            repsType: metrics.reps ? repsType : undefined,
            trackBodyWeight: metrics.load ? trackBodyWeight : undefined,
        });

        Alert.alert('Success', 'Exercise created!', [
            { text: 'OK', onPress: () => navigation.goBack() }
        ]);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={[styles.cancelText, { color: colors.danger }]}>Cancel</Text>
                </TouchableOpacity>
                <Text style={[Theme.Typography.subtitle, { color: colors.text }]}>New Exercise</Text>
                <TouchableOpacity onPress={handleSave}>
                    <Text style={[styles.saveText, { color: colors.primary }]}>Save</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <Text style={[styles.label, { color: colors.textMuted }]}>Name</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                        placeholder="e.g. Back Squat"
                        placeholderTextColor={colors.textMuted}
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Metrics to Track</Text>
                    <Text style={[styles.hint, { color: colors.textMuted }]}>Select what you want to log for this exercise.</Text>

                    {['load', 'reps', 'time', 'distance', 'rom'].map((m) => (
                        <View key={m}>
                            <View style={[styles.row, { backgroundColor: colors.surface }]}>
                                <Text style={[styles.rowLabel, { color: colors.text }]}>
                                    {m === 'rom' ? 'Range of Motion (ROM)' : m.charAt(0).toUpperCase() + m.slice(1)}
                                </Text>
                                <Switch
                                    value={metrics[m as MetricType]}
                                    onValueChange={() => toggleMetric(m as MetricType)}
                                    trackColor={{ true: colors.primary }}
                                />
                            </View>

                            {/* "Unfolding" Repetition Type Section - directly under Reps toggle */}
                            {m === 'reps' && metrics.reps && (
                                <View style={[styles.unfoldingSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                    <Text style={[styles.subLabel, { color: colors.textMuted }]}>Repetition Type</Text>
                                    <View style={[styles.segmentContainer, { backgroundColor: colors.background }]}>
                                        {(['standard', 'tempo', 'isometric'] as RepsType[]).map((type) => (
                                            <TouchableOpacity
                                                key={type}
                                                style={[styles.segment, repsType === type && [styles.segmentActive, { backgroundColor: colors.surface }]]}
                                                onPress={() => setRepsType(type)}
                                            >
                                                <Text style={[styles.segmentText, { color: colors.text }, repsType === type && styles.segmentTextActive]}>
                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* "Unfolding" Body Weight Toggle - directly under Load toggle */}
                            {m === 'load' && metrics.load && (
                                <View style={[styles.unfoldingSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={[styles.subLabel, { color: colors.textMuted }]}>Add Body Weight?</Text>
                                        <Switch
                                            value={trackBodyWeight}
                                            onValueChange={setTrackBodyWeight}
                                            trackColor={{ true: colors.primary }}
                                        />
                                    </View>
                                    <Text style={{ fontSize: 12, color: colors.textMuted }}>
                                        If checked, your body weight will be added to the logged load automatically.
                                    </Text>
                                </View>
                            )}
                        </View>
                    ))}
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
        ...Theme.Typography.body,
    },
    saveText: {
        ...Theme.Typography.body,
        fontWeight: 'bold',
    },
    content: {
        padding: Theme.Spacing.m,
    },
    section: {
        marginBottom: Theme.Spacing.l,
    },
    label: {
        ...Theme.Typography.caption,
        marginBottom: Theme.Spacing.s,
    },
    input: {
        padding: Theme.Spacing.m,
        borderRadius: 12,
        fontSize: 17,
    },
    sectionTitle: {
        ...Theme.Typography.body,
        fontWeight: '600',
        marginBottom: Theme.Spacing.xs,
    },
    hint: {
        ...Theme.Typography.caption,
        marginBottom: Theme.Spacing.m,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Theme.Spacing.m,
        marginBottom: 1,
    },
    rowLabel: {
        fontSize: 17,
    },
    segmentContainer: {
        flexDirection: 'row',
        borderRadius: 8,
        padding: 2,
    },
    segment: {
        flex: 1,
        paddingVertical: 6,
        alignItems: 'center',
        borderRadius: 6,
    },
    segmentActive: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    segmentText: {
        fontSize: 13,
        fontWeight: '500',
    },
    segmentTextActive: {
        fontWeight: '600',
    },
    unfoldingSection: {
        paddingHorizontal: Theme.Spacing.m,
        paddingBottom: Theme.Spacing.m,
        borderBottomWidth: 1,
    },
    subLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
    },
});
