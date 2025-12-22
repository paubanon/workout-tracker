import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, FlatList, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useExerciseAnalytics, TimeFrame } from '../../hooks/useExerciseAnalytics';
import { supabaseService } from '../../services/SupabaseDataService';
import { Exercise } from '../../models';
import { LineChart } from "react-native-gifted-charts";
import { SimpleDropdown } from '../../components/SimpleDropdown';
import { useTheme } from '../../context/ThemeContext';
import { GlowCard } from '../../components/GlowCard';

export const AnalysisScreen = () => {
    const { colors, isDark } = useTheme();

    // --- State ---
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
    const [exercises, setExercises] = useState<Exercise[]>([]);

    // UI selectors
    const [var1, setVar1] = useState<string>('load');
    const [var2, setVar2] = useState<string>('reps');
    const [agg1, setAgg1] = useState<'max' | 'avg' | 'min'>('max');
    const [agg2, setAgg2] = useState<'max' | 'avg' | 'min'>('max');

    const [isHelpVisible, setHelpVisible] = useState(false);

    // Picker Modal
    const [isPickerVisible, setPickerVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Analytics Hook
    const {
        loading,
        timeFrame,
        setTimeFrame,
        customDays,
        setCustomDays,
        computeMetrics,
        getChartData
    } = useExerciseAnalytics(selectedExercise?.id || null);

    // Load available exercises once
    useEffect(() => {
        supabaseService.getExercises().then(setExercises);
    }, []);

    // Filtered exercises for picker
    const filteredExercises = useMemo(() =>
        exercises.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase())),
        [exercises, searchQuery]);

    // Available variables based on selected exercise
    const availableVariables = useMemo(() => {
        if (!selectedExercise) return ['load', 'reps', 'time', 'distance', 'rom', 'volume'];

        let vars = [...(selectedExercise.enabledMetrics || [])] as string[];
        if (!vars.includes('volume')) vars.push('volume');
        return vars;
    }, [selectedExercise]);

    // Available for Right Axis (includes 'none')
    const availableVariablesRight = useMemo(() => {
        return ['none', ...availableVariables];
    }, [availableVariables]);

    // Reset vars if not in available
    useEffect(() => {
        if (!availableVariables.includes(var1)) setVar1(availableVariables[0] || 'load');
        // If current var2 is not in new list and not 'none', reset.
        if (var2 !== 'none' && !availableVariables.includes(var2)) setVar2('none');
    }, [availableVariables]);


    // Metrics & Regression
    const metrics1 = useMemo(() => computeMetrics(var1, agg1), [var1, agg1, loading, timeFrame]);
    const metrics2 = useMemo(() => var2 === 'none' ? null : computeMetrics(var2, agg2), [var2, agg2, loading, timeFrame]);

    // Chart Data
    const rawChartData = useMemo(() => getChartData(var1, var2, agg1, agg2), [var1, var2, agg1, agg2, loading, timeFrame]);

    // Dataset for Chart - add textShiftY to move labels above dots
    const chartData1 = rawChartData.map(d => ({
        value: d.value,
        dataPointText: Math.round(d.value).toString(),
        textShiftY: -12, // Move text above the dot
    }));

    // Create selective X-axis labels for readability - use shorter format
    const xAxisLabelTexts = rawChartData.map((d, index) => {
        // Show every 2nd label for more dates, or first and last
        if (index === 0 || index === rawChartData.length - 1 || index % 2 === 0) {
            // Use short format: M/D (e.g., "12/15")
            const date = new Date(d.date);
            return `${date.getMonth() + 1}/${date.getDate()}`;
        }
        return '';
    });

    const chartData2 = rawChartData.map(d => ({
        value: d.secondaryValue,
        dataPointText: var2 === 'none' ? '' : Math.round(d.secondaryValue).toString(),
        textShiftY: -12, // Move text above the dot
    }));

    const regression1 = (metrics1.regressionData || []).map(d => ({ value: d.value }));
    // If var2 is none, no regression for it
    const regression2 = (metrics2?.regressionData || []).map(d => ({ value: d.value }));

    // Helper: compute nice axis parameters (10 ticks, multiples of 2 or 5)
    const getNiceAxisParams = (dataMin: number, dataMax: number, minReasonableMax: number = 10) => {
        // If all values >= 0, start at 0
        const startAtZero = dataMin >= 0;
        const minBound = startAtZero ? 0 : dataMin;
        // Ensure we have at least minReasonableMax to avoid duplicate zeros / tiny ranges
        const maxBound = Math.max(dataMax, minReasonableMax);

        // Compute range
        const rawRange = maxBound - minBound || 1; // avoid 0
        // We want 10 sections, so step = range / 10
        const rawStep = rawRange / 10;

        // Find a "nice" step that is a multiple of 1, 2, or 5 × 10^n
        const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
        const residual = rawStep / magnitude;
        let niceStep: number;
        if (residual <= 1) niceStep = magnitude;
        else if (residual <= 2) niceStep = 2 * magnitude;
        else if (residual <= 5) niceStep = 5 * magnitude;
        else niceStep = 10 * magnitude;

        // Round min down and max up to multiples of niceStep
        const niceMin = startAtZero ? 0 : Math.floor(minBound / niceStep) * niceStep;
        const niceMax = Math.ceil(maxBound / niceStep) * niceStep;

        return { minValue: niceMin, maxValue: niceMax, noOfSections: 10 };
    };

    // Raw min/max for chart data
    const rawMax1 = Math.max(...chartData1.map(d => d.value), ...regression1.map(d => d.value), 0);
    const rawMin1 = Math.min(...chartData1.map(d => d.value), ...regression1.map(d => d.value), 0);
    const rawMax2 = Math.max(...chartData2.map(d => d.value), ...regression2.map(d => d.value), 0);
    const rawMin2 = Math.min(...chartData2.map(d => d.value), ...regression2.map(d => d.value), 0);

    // Compute nice axis params
    const axis1 = getNiceAxisParams(rawMin1, rawMax1);
    const axis2 = getNiceAxisParams(rawMin2, rawMax2);

    const chartData1Final = chartData1.map(d => ({ ...d }));

    // For secondary data, we need to merge the actual data and regression data
    const chartData2Final = chartData2.map((d, i) => ({
        ...d,
        isSecondary: true
    }));

    const regression1Final = regression1.map(d => ({ ...d }));

    // WORKAROUND: data4 doesn't respect isSecondary flag, so we manually scale
    // the secondary regression values to the primary axis range
    const primaryRange = axis1.maxValue - axis1.minValue || 100;
    const secondaryRange = axis2.maxValue - axis2.minValue || 10;
    const scaleFactor = primaryRange / secondaryRange;

    const regression2Final = regression2.map(d => ({
        value: (d.value - axis2.minValue) * scaleFactor + axis1.minValue,
    }));

    // Layout
    const screenWidth = Dimensions.get('window').width;
    const chartWidth = screenWidth - Theme.Spacing.m * 2 - 100;
    const dataCount = chartData1.length;
    const fitSpacing = dataCount > 1 ? (chartWidth - 40) / (dataCount - 1) : 40;

    // Local constants
    const SECONDARY_COLOR = Theme.Colors.secondary;

    // Dynamic Styles for Components
    const textStyle = { color: colors.text };
    const textMutedStyle = { color: colors.textMuted };
    const cardStyle = { backgroundColor: colors.surface };
    const shadowStyle = isDark ? Theme.TopLight.m : Theme.Shadows.light.m;

    // --- Components ---

    const renderMetricCard = (title: string, data: any, color: string) => {
        if (!data) return null;
        return (
            <GlowCard style={[styles.metricCard, { borderColor: colors.border }]} level="m">
                <Text style={[styles.metricTitle, { color }]}>{title} ({data.trend})</Text>
                <View style={styles.metricRow}>
                    <Text style={[styles.metricLabel, textMutedStyle]}>Max:</Text>
                    <Text style={[styles.metricValue, textStyle]}>{data.max.toFixed(1)}</Text>
                </View>
                <View style={styles.metricRow}>
                    <Text style={[styles.metricLabel, textMutedStyle]}>Avg:</Text>
                    <Text style={[styles.metricValue, textStyle]}>{data.avg.toFixed(1)}</Text>
                </View>
                <View style={styles.metricRow}>
                    <Text style={[styles.metricLabel, textMutedStyle]}>Min:</Text>
                    <Text style={[styles.metricValue, textStyle]}>{data.min.toFixed(1)}</Text>
                </View>
                {/* Estimated RMs */}
                {data.est1RM ? (
                    <View style={[styles.rmContainer, { borderTopColor: colors.border }]}>
                        <View style={styles.metricRow}>
                            <Text style={[styles.metricLabel, textMutedStyle]}>Est 1RM:</Text>
                            <Text style={[styles.metricValue, textStyle]}>{data.est1RM.toFixed(1)}</Text>
                        </View>
                        <View style={styles.metricRow}>
                            <Text style={[styles.metricLabel, textMutedStyle]}>Est 3RM:</Text>
                            <Text style={[styles.metricValue, textStyle]}>{data.est3RM.toFixed(1)}</Text>
                        </View>
                        <View style={styles.metricRow}>
                            <Text style={[styles.metricLabel, textMutedStyle]}>Est 5RM:</Text>
                            <Text style={[styles.metricValue, textStyle]}>{data.est5RM.toFixed(1)}</Text>
                        </View>
                    </View>
                ) : null}
                {title === 'VOLUME' ? (
                    <View style={styles.metricRow}>
                        <Text style={[styles.metricLabel, textMutedStyle]}>Total Vol:</Text>
                        <Text style={[styles.metricValue, textStyle]}>{data.volume.toFixed(0)}</Text>
                    </View>
                ) : null}
            </GlowCard>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={[styles.headerTitle, textStyle]}>Analysis</Text>

                {/* Exercise Selector */}
                <TouchableOpacity
                    style={[styles.exerciseSelector, { backgroundColor: colors.surface }, shadowStyle]}
                    onPress={() => setPickerVisible(true)}
                    accessibilityRole="button"
                    accessibilityLabel={selectedExercise ? `Current exercise: ${selectedExercise.name}. Tap to change.` : 'Select an exercise'}
                >
                    <Text style={[styles.exerciseSelectorText, textStyle]}>
                        {selectedExercise ? selectedExercise.name : "Select Exercise"}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={colors.text} />
                </TouchableOpacity>

                {/* Left Axis Controls */}
                <View style={styles.controlsRow}>
                    <View style={[styles.controlsGroup, { flex: 1, marginRight: 8 }]}>
                        <SimpleDropdown
                            value={var1}
                            options={availableVariables}
                            onSelect={setVar1}
                            style={{
                                borderWidth: 0,
                                borderRadius: 12,
                                paddingVertical: 12, // Match bigger touch area
                                backgroundColor: colors.surface,
                                ...(isDark ? Theme.TopLight.m : Theme.Shadows.light.m) // Inline spread for dropdown style prop
                            }}
                            textStyle={{
                                color: colors.primary,
                                fontWeight: '700',
                                fontSize: 13,
                                textTransform: 'uppercase'
                            }}
                        />
                    </View>
                    <View style={[styles.controlsGroup, { flex: 0.8 }]}>
                        <SimpleDropdown
                            value={agg1}
                            options={['max', 'avg', 'min']}
                            onSelect={(val) => setAgg1(val as any)}
                            disabled={var1 === 'volume'}
                            style={{
                                borderWidth: 0,
                                borderRadius: 12,
                                paddingVertical: 12,
                                backgroundColor: colors.surface,
                                ...(var1 === 'volume' ? { opacity: 0.5 } : {}),
                                ...(isDark ? Theme.TopLight.m : Theme.Shadows.light.m)
                            }}
                            textStyle={{
                                fontSize: 13,
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                color: colors.text // Ensure aggregated text is visible
                            }}
                            dropdownTextStyle={{ color: colors.text }} // Ensure dropdown items are visible
                            dropdownStyle={{ backgroundColor: colors.surface }}
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.helpButton}
                        onPress={() => {
                            setHelpVisible(!isHelpVisible);
                        }}
                    >
                        <Ionicons name="help-circle-outline" size={22} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>

                {/* Help Bubble */}
                {isHelpVisible && (
                    <View style={[styles.helpBubble, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.helpText, { color: colors.textMuted }]}>
                            Select Max, Average, or Min to plot the corresponding value from each session's sets.
                            {"\n"}Volume is a total sum per session.
                        </Text>
                    </View>
                )}


                {/* Right Axis Controls */}
                <View style={[styles.controlsRow, { marginTop: 12 }]}>
                    <View style={[styles.controlsGroup, { flex: 1, marginRight: 8 }]}>
                        <SimpleDropdown
                            value={var2}
                            options={availableVariablesRight}
                            onSelect={setVar2}
                            style={{
                                borderWidth: 0,
                                borderRadius: 12,
                                paddingVertical: 12,
                                backgroundColor: colors.surface,
                                ...(isDark ? Theme.TopLight.m : Theme.Shadows.light.m)
                            }}
                            textStyle={{
                                color: SECONDARY_COLOR,
                                fontWeight: '700',
                                fontSize: 13,
                                textTransform: 'uppercase'
                            }}
                        />
                    </View>
                    <View style={[styles.controlsGroup, { flex: 0.8, marginRight: 42 }]}>
                        <SimpleDropdown
                            value={agg2}
                            options={['max', 'avg', 'min']}
                            onSelect={(val) => setAgg2(val as any)}
                            disabled={var2 === 'none' || var2 === 'volume'}
                            style={{
                                borderWidth: 0,
                                borderRadius: 12,
                                paddingVertical: 12,
                                backgroundColor: colors.surface,
                                ...(var2 === 'none' || var2 === 'volume' ? { opacity: 0.5 } : {}),
                                ...(isDark ? Theme.TopLight.m : Theme.Shadows.light.m)
                            }}
                            textStyle={{
                                fontSize: 13,
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                color: colors.text
                            }}
                            dropdownTextStyle={{ color: colors.text }}
                            dropdownStyle={{ backgroundColor: colors.surface }}
                        />
                    </View>
                </View>


                {/* Time Frame */}
                <View style={[styles.timeFrameContainer, { backgroundColor: colors.surface }, shadowStyle]}>
                    {(['1M', '3M', '6M', '1Y', 'ALL'] as TimeFrame[]).map((tf) => (
                        <TouchableOpacity
                            key={tf}
                            style={[styles.pill, timeFrame === tf && { backgroundColor: colors.primary }]}
                            onPress={() => setTimeFrame(tf)}
                        >
                            <Text style={[
                                styles.pillText,
                                { color: colors.textMuted },
                                timeFrame === tf && { color: '#FFF' }
                            ]}>{tf}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* AI Report Placeholder */}
                <View style={[styles.aiCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadowStyle]}>
                    <Text style={[styles.aiText, { color: colors.textMuted }]}>✨ AI Report Upcoming...</Text>
                </View>

                {/* Chart */}
                {selectedExercise && chartData1.length > 0 ? (
                    <View style={[styles.chartContainer, { backgroundColor: colors.surface }, shadowStyle]}>
                        <LineChart
                            data={chartData1Final}
                            secondaryData={var2 !== 'none' ? chartData2Final : undefined}
                            data3={regression1Final}
                            data4={var2 !== 'none' ? regression2Final : undefined}
                            height={250}
                            width={chartWidth}
                            spacing={fitSpacing}
                            initialSpacing={10}
                            color1={colors.primary}
                            color2={SECONDARY_COLOR}
                            color3={colors.primary} // Regression 1 same color
                            color4={SECONDARY_COLOR} // Regression 2 orange

                            // Line Config
                            thickness1={3}
                            thickness2={3}
                            thickness3={1} // Faint
                            strokeDashArray3={[4, 4]} // Dashed for regression
                            hideDataPoints3
                            thickness4={1}
                            strokeDashArray4={[4, 4]}
                            hideDataPoints4

                            // Dots
                            dataPointsColor1={colors.primary}
                            dataPointsColor2={SECONDARY_COLOR}
                            dataPointsColor4={SECONDARY_COLOR}
                            textColor1={colors.primary}
                            textColor2={SECONDARY_COLOR}
                            textColor4={SECONDARY_COLOR}

                            // Axes
                            yAxisColor={colors.border}
                            xAxisColor={colors.border}
                            yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                            yAxisLabelWidth={40}
                            xAxisLabelTextStyle={{
                                color: colors.textMuted,
                                fontSize: 9,
                            }}
                            labelsExtraHeight={16} // Extra room for X-axis labels (avoids clipping)
                            rotateLabel // Rotate labels to -45 degrees automatically

                            // Grid
                            rulesColor={Theme.Colors.gridLine}
                            rulesType="solid"

                            curved

                            // Left Y-Axis Scaling (10 nice ticks)
                            maxValue={axis1.maxValue}
                            yAxisOffset={axis1.minValue}
                            noOfSections={axis1.noOfSections}

                            // X Axis Labels - selective for readability
                            xAxisLabelTexts={xAxisLabelTexts}

                            // Right Y-Axis Scaling (10 nice ticks)
                            secondaryYAxis={var2 !== 'none' ? {
                                maxValue: axis2.maxValue,
                                yAxisOffset: axis2.minValue,
                                noOfSections: axis2.noOfSections,
                                yAxisTextStyle: { color: SECONDARY_COLOR, fontSize: 10 },
                                yAxisColor: SECONDARY_COLOR,
                                yAxisLabelWidth: 40,
                            } : undefined}

                            // Secondary line styling
                            secondaryLineConfig={{
                                color: SECONDARY_COLOR,
                                thickness: 3,
                                curved: true,
                                dataPointsColor: SECONDARY_COLOR, // Orange dots for secondary data
                                textColor: SECONDARY_COLOR, // Orange labels for secondary data
                            }}

                            disableScroll // User requested compressed view without scroll
                        />
                    </View>
                ) : (
                    <View style={styles.emptyChart}>
                        <Text style={[styles.emptyText, textMutedStyle]}>Select an exercise to analyze</Text>
                    </View>
                )}

                {/* Metrics List */}
                {selectedExercise && (
                    <View style={styles.metricsContainer}>
                        {renderMetricCard(var1.toUpperCase(), metrics1, colors.primary)}
                        {renderMetricCard(var2.toUpperCase(), metrics2, SECONDARY_COLOR)}
                    </View>
                )}


            </ScrollView>

            {/* Exercise Picker Modal */}
            <Modal visible={isPickerVisible} animationType="slide" transparent>
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                            <TouchableOpacity
                                onPress={() => setPickerVisible(false)}
                                accessibilityRole="button"
                                accessibilityLabel="Close"
                            >
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                            <Text style={[styles.modalTitle, textStyle]}>Select Exercise</Text>
                        </View>
                        <TextInput
                            style={[styles.searchInput, { backgroundColor: colors.surface, color: colors.text }]}
                            placeholder="Search exercises..."
                            placeholderTextColor={colors.textMuted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            accessibilityLabel="Search exercises"
                        />
                        <FlatList
                            data={filteredExercises}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.exerciseItem, { borderBottomColor: colors.border }]}
                                    onPress={() => {
                                        setSelectedExercise(item);
                                        setPickerVisible(false);
                                    }}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Select ${item.name}`}
                                >
                                    <Text style={[styles.exerciseName, textStyle]}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: Theme.Spacing.m,
        paddingBottom: 50,
    },
    headerTitle: {
        fontSize: Theme.Typography.scale.xl,
        fontWeight: 'bold',
        marginTop: Theme.Spacing.s,
        marginBottom: Theme.Spacing.l,
    },
    // New Styles
    exerciseSelector: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 14,
        borderRadius: 16,
        marginBottom: 20,
    },
    exerciseSelectorText: {
        fontSize: 16,
        fontWeight: '600',
        marginRight: 8,
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    controlsGroup: {
        // Flex handled inline
    },
    helpButton: {
        padding: 8,
        marginLeft: 4,
    },
    helpBubble: {
        padding: 12,
        borderRadius: 8,
        marginTop: 4,
        marginBottom: 8,
    },
    helpText: {
        fontSize: 12,
        lineHeight: 16,
    },
    timeFrameContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: Theme.Spacing.m,
        borderRadius: 12,
        padding: 4,
    },
    pill: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        marginHorizontal: 2,
        borderRadius: 10,
        backgroundColor: 'transparent',
    },
    pillText: {
        fontSize: 13,
        fontWeight: '600',
    },
    aiCard: {
        height: 80,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Theme.Spacing.l,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    aiText: {
        fontSize: Theme.Typography.scale.md,
        fontStyle: 'italic',
    },
    chartContainer: {
        padding: Theme.Spacing.s,
        paddingBottom: 8, // Extra room for rotated X-axis labels
        borderRadius: 12,
        marginBottom: Theme.Spacing.l,
        alignItems: 'center', // Center the chart horizontally
    },
    emptyChart: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        // dynamic color
    },
    metricsContainer: {
        flexDirection: 'column',
    },
    metricCard: {
        padding: Theme.Spacing.m,
        borderRadius: 12,
        marginBottom: Theme.Spacing.m,
        borderLeftWidth: 4,
    },
    metricTitle: {
        fontSize: Theme.Typography.scale.lg,
        fontWeight: '600',
        marginBottom: Theme.Spacing.s,
        textTransform: 'capitalize',
    },
    metricRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    metricLabel: {
        fontSize: Theme.Typography.scale.md,
    },
    metricValue: {
        fontSize: Theme.Typography.scale.md,
        fontWeight: '600',
    },
    rmContainer: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end', // Make it like a sheet or full screen
    },
    modalContent: {
        flex: 1,
        marginTop: 60, // Leave some space at top
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Theme.Spacing.m,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: Theme.Typography.scale.lg,
        fontWeight: '600',
        marginLeft: Theme.Spacing.m,
    },
    searchInput: {
        margin: Theme.Spacing.m,
        padding: Theme.Spacing.m,
        borderRadius: 8,
    },
    exerciseItem: {
        padding: Theme.Spacing.m,
        borderBottomWidth: 1,
    },
    exerciseName: {
        fontSize: Theme.Typography.scale.md,
    },
});
