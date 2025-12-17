import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Switch, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../theme';
import { supabaseService } from '../../services/SupabaseDataService';
import { useNavigation } from '@react-navigation/native';
import { MetricType, RepsType } from '../../models';

export const CreateExerciseScreen = () => {
    const navigation = useNavigation();
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
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={Theme.Typography.subtitle}>New Exercise</Text>
                <TouchableOpacity onPress={handleSave}>
                    <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Back Squat"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Metrics to Track</Text>
                    <Text style={styles.hint}>Select what you want to log for this exercise.</Text>

                    {['load', 'reps', 'time', 'distance', 'rom'].map((m) => (
                        <View key={m}>
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>
                                    {m === 'rom' ? 'Range of Motion (ROM)' : m.charAt(0).toUpperCase() + m.slice(1)}
                                </Text>
                                <Switch
                                    value={metrics[m as MetricType]}
                                    onValueChange={() => toggleMetric(m as MetricType)}
                                    trackColor={{ true: Theme.Colors.primary }}
                                />
                            </View>

                            {/* "Unfolding" Repetition Type Section - directly under Reps toggle */}
                            {m === 'reps' && metrics.reps && (
                                <View style={styles.unfoldingSection}>
                                    <Text style={styles.subLabel}>Repetition Type</Text>
                                    <View style={styles.segmentContainer}>
                                        {(['standard', 'tempo', 'isometric'] as RepsType[]).map((type) => (
                                            <TouchableOpacity
                                                key={type}
                                                style={[styles.segment, repsType === type && styles.segmentActive]}
                                                onPress={() => setRepsType(type)}
                                            >
                                                <Text style={[styles.segmentText, repsType === type && styles.segmentTextActive]}>
                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* "Unfolding" Body Weight Toggle - directly under Load toggle */}
                            {m === 'load' && metrics.load && (
                                <View style={styles.unfoldingSection}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={styles.subLabel}>Add Body Weight?</Text>
                                        <Switch
                                            value={trackBodyWeight}
                                            onValueChange={setTrackBodyWeight}
                                            trackColor={{ true: Theme.Colors.primary }}
                                        />
                                    </View>
                                    <Text style={{ fontSize: 12, color: Theme.Colors.textSecondary }}>
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
        ...Theme.Typography.body,
        color: Theme.Colors.danger,
    },
    saveText: {
        ...Theme.Typography.body,
        color: Theme.Colors.primary,
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
        backgroundColor: Theme.Colors.surface,
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
        backgroundColor: Theme.Colors.surface,
        padding: Theme.Spacing.m,
        marginBottom: 1,
    },
    rowLabel: {
        fontSize: 17,
    },
    segmentContainer: {
        flexDirection: 'row',
        backgroundColor: '#E5E5EA',
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
        backgroundColor: '#FFF',
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
        backgroundColor: Theme.Colors.surface,
        paddingHorizontal: Theme.Spacing.m,
        paddingBottom: Theme.Spacing.m,
        borderBottomWidth: 1,
        borderColor: '#F2F2F7', // subtle separator
    },
    subLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        color: Theme.Colors.textSecondary,
    },
});
