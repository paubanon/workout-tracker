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

export const AnalysisScreen = () => {
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
    // Compute metrics using the selected aggregation method for the Trend calculation?
    // User: "The user can select whether to plot... and that is what should be displayed"
    // "I would like to show this [regression]... for the data points."
    // So aggregation affects Trend.
    const metrics1 = useMemo(() => computeMetrics(var1, agg1), [var1, agg1, loading, timeFrame]);
    const metrics2 = useMemo(() => var2 === 'none' ? null : computeMetrics(var2, agg2), [var2, agg2, loading, timeFrame]);

    // Chart Data
    const rawChartData = useMemo(() => getChartData(var1, var2, agg1, agg2), [var1, var2, agg1, agg2, loading, timeFrame]);

    // Dataset for Chart
    const chartData1 = rawChartData.map(d => ({
        value: d.value,
        dataPointText: Math.round(d.value).toString()
    }));

    // Create selective X-axis labels for readability - use shorter format
    const xAxisLabelTexts = rawChartData.map((d, index) => {
        // Show every 3rd label, or first and last
        if (index === 0 || index === rawChartData.length - 1 || index % 3 === 0) {
            // Use short format: M/D (e.g., "12/15")
            const date = new Date(d.date);
            return `${date.getMonth() + 1}/${date.getDate()}`;
        }
        return '';
    });

    const chartData2 = rawChartData.map(d => ({
        value: d.secondaryValue,
        dataPointText: var2 === 'none' ? '' : Math.round(d.secondaryValue).toString()
    }));

    const regression1 = (metrics1.regressionData || []).map(d => ({ value: d.value }));
    // If var2 is none, no regression for it
    const regression2 = (metrics2?.regressionData || []).map(d => ({ value: d.value }));

    // Max values for scaling
    // Add logic to handle negatives if needed for ROM? "Left axis to show values... can be negative"
    // GiftedCharts should handle negative automatically if we don't force min=0?
    // We explicitly set maxValue currently.
    const max1 = Math.max(...chartData1.map(d => d.value), ...regression1.map(d => d.value), 0);
    const min1 = Math.min(...chartData1.map(d => d.value), ...regression1.map(d => d.value), 0);
    const max2 = Math.max(...chartData2.map(d => d.value), ...regression2.map(d => d.value), 0);
    const min2 = Math.min(...chartData2.map(d => d.value), ...regression2.map(d => d.value), 0);

    const chartData1Final = chartData1.map(d => ({ ...d }));

    // For secondary data, we need to merge the actual data and regression data
    // because data4 with isSecondary has library limitations
    const chartData2Final = chartData2.map((d, i) => ({
        ...d,
        isSecondary: true
    }));

    const regression1Final = regression1.map(d => ({ ...d }));

    // WORKAROUND: data4 doesn't respect isSecondary flag, so we manually scale
    // the secondary regression values to the primary axis range
    // This makes them appear at the correct visual position when plotted on primary axis
    const primaryRange = (max1 > 0 ? max1 * 1.2 : 100) - (min1 < 0 ? min1 * 1.2 : 0);
    const secondaryRange = (max2 > 0 ? max2 * 1.2 : 10) - (min2 < 0 ? min2 * 1.2 : 0);
    // Rough scaling if range 0
    const pRangeSafe = primaryRange === 0 ? 100 : primaryRange;
    const sRangeSafe = secondaryRange === 0 ? 10 : secondaryRange;

    const scaleFactor = pRangeSafe / sRangeSafe;

    const regression2Final = regression2.map(d => ({
        value: d.value * scaleFactor, // Scale to primary axis range (simplistic linear scaling, assuming 0 aligned if no offset logic)
        // Note: Real multi-axis regression scaling is complex if offsets differ. 
        // Given complexity, regression lines on 2nd axis might be approximate or better hidden if logic is tough.
        // For now, simple scaling.
    }));

    // Create combined secondary data with regression
    // We'll use different styling on the regression points
    const combinedSecondaryData = var2 !== 'none' ? [
        ...chartData2Final,
        ...regression2.map(d => ({
            value: d.value,
            isSecondary: true,
            hideDataPoint: true, // Hide the dots for regression
            // strokeDashArray can't be set per point, so we'll need another approach
        }))
    ] : [];
    // If var2 is none, max2 might be 0.

    // Layout
    const screenWidth = Dimensions.get('window').width;
    // Reserve more space for right axis labels
    const chartWidth = screenWidth - Theme.Spacing.m * 2 - 100; // Even more space for right axis labels to avoid clipping
    // Fit all points:
    const dataCount = chartData1.length;
    // Calculate spacing to fit width. Max 100? Min 10?
    // If dataCount is small, use default spacing? 
    // "all the plot to be compressed in the view of the user without the need to scroll"
    const fitSpacing = dataCount > 1 ? (chartWidth - 40) / (dataCount - 1) : 40;
    // Cap spacing to reasonable limits if needed, but user wants to fit ALL.
    // If too many points, spacing might be tiny.

    // Local constants
    const SECONDARY_COLOR = '#FF9500';

    // --- Components ---

    const renderMetricCard = (title: string, data: any, color: string) => {
        if (!data) return null;
        return (
            <View style={styles.metricCard}>
                <Text style={[styles.metricTitle, { color }]}>{title} ({data.trend})</Text>
                <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Max:</Text>
                    <Text style={styles.metricValue}>{data.max.toFixed(1)}</Text>
                </View>
                <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Avg:</Text>
                    <Text style={styles.metricValue}>{data.avg.toFixed(1)}</Text>
                </View>
                <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Min:</Text>
                    <Text style={styles.metricValue}>{data.min.toFixed(1)}</Text>
                </View>
                {/* Estimated RMs - Only show if > 0 */}
                {data.est1RM ? (
                    <View style={styles.rmContainer}>
                        <View style={styles.metricRow}>
                            <Text style={styles.metricLabel}>Est 1RM:</Text>
                            <Text style={styles.metricValue}>{data.est1RM.toFixed(1)}</Text>
                        </View>
                        <View style={styles.metricRow}>
                            <Text style={styles.metricLabel}>Est 3RM:</Text>
                            <Text style={styles.metricValue}>{data.est3RM.toFixed(1)}</Text>
                        </View>
                        <View style={styles.metricRow}>
                            <Text style={styles.metricLabel}>Est 5RM:</Text>
                            <Text style={styles.metricValue}>{data.est5RM.toFixed(1)}</Text>
                        </View>
                    </View>
                ) : null}
                {title === 'VOLUME' ? (
                    <View style={styles.metricRow}>
                        <Text style={styles.metricLabel}>Total Vol:</Text>
                        <Text style={styles.metricValue}>{data.volume.toFixed(0)}</Text>
                    </View>
                ) : null}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.headerTitle}>Analysis</Text>

                {/* Exercise Selector */}
                <TouchableOpacity style={styles.exerciseSelector} onPress={() => setPickerVisible(true)}>
                    <Text style={styles.exerciseSelectorText}>
                        {selectedExercise ? selectedExercise.name : "Select Exercise"}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={Theme.Colors.text} />
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
                                backgroundColor: Theme.Colors.surface
                            }}
                            textStyle={{
                                color: Theme.Colors.primary,
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
                                backgroundColor: Theme.Colors.surface,
                                ...(var1 === 'volume' ? { opacity: 0.5 } : {})
                            }}
                            textStyle={{
                                fontSize: 13,
                                fontWeight: '600',
                                textTransform: 'uppercase'
                            }}
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.helpButton}
                        onPress={() => {
                            setHelpVisible(!isHelpVisible);
                        }}
                    >
                        <Ionicons name="help-circle-outline" size={22} color={Theme.Colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Help Bubble */}
                {isHelpVisible && (
                    <View style={styles.helpBubble}>
                        <Text style={styles.helpText}>
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
                                backgroundColor: Theme.Colors.surface
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
                                backgroundColor: Theme.Colors.surface,
                                ...(var2 === 'none' || var2 === 'volume' ? { opacity: 0.5 } : {})
                            }}
                            textStyle={{
                                fontSize: 13,
                                fontWeight: '600',
                                textTransform: 'uppercase'
                            }}
                        />
                    </View>
                </View>


                {/* Time Frame */}
                <View style={styles.timeFrameContainer}>
                    {(['1M', '3M', '6M', '1Y', 'ALL'] as TimeFrame[]).map((tf) => (
                        <TouchableOpacity
                            key={tf}
                            style={[styles.pill, timeFrame === tf && styles.pillActive]}
                            onPress={() => setTimeFrame(tf)}
                        >
                            <Text style={[styles.pillText, timeFrame === tf && styles.pillTextActive]}>{tf}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* AI Report Placeholder */}
                <View style={styles.aiCard}>
                    <Text style={styles.aiText}>✨ AI Report Upcoming...</Text>
                </View>

                {/* Chart */}
                {selectedExercise && chartData1.length > 0 ? (
                    <View style={styles.chartContainer}>
                        <LineChart
                            data={chartData1Final}
                            secondaryData={var2 !== 'none' ? chartData2Final : undefined}
                            data3={regression1Final}
                            data4={var2 !== 'none' ? regression2Final : undefined}
                            height={250}
                            width={chartWidth}
                            spacing={fitSpacing}
                            initialSpacing={10}
                            color1={Theme.Colors.primary}
                            color2={SECONDARY_COLOR}
                            color3={Theme.Colors.primary} // Regression 1 same color
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
                            dataPointsColor1={Theme.Colors.primary}
                            dataPointsColor2={SECONDARY_COLOR}
                            dataPointsColor4={SECONDARY_COLOR}
                            textColor1={Theme.Colors.primary}
                            textColor2={SECONDARY_COLOR}
                            textColor4={SECONDARY_COLOR}

                            // Axes
                            yAxisColor={Theme.Colors.border}
                            xAxisColor={Theme.Colors.border}
                            yAxisTextStyle={{ color: Theme.Colors.textSecondary, fontSize: 10 }}
                            yAxisLabelWidth={40} // Default for primary axis
                            xAxisLabelTextStyle={{
                                color: Theme.Colors.textSecondary,
                                fontSize: 9,
                                transform: [{ rotate: '-45deg' }]
                            }}
                            hideRules
                            curved

                            // Left Scaling: Allow negatives if needed, pad nicely
                            maxValue={max1 > 0 ? max1 * 1.2 : 0}
                            // Start at 0 if no negative values, otherwise allow negatives
                            yAxisOffset={min1 < 0 ? min1 * 1.2 : 0}

                            // X Axis Labels - selective for readability
                            xAxisLabelTexts={xAxisLabelTexts}

                            // Right Scaling
                            secondaryYAxis={var2 !== 'none' ? {
                                maxValue: max2 > 0 ? max2 * 1.2 : 10,
                                yAxisTextStyle: { color: SECONDARY_COLOR, fontSize: 10 },
                                yAxisColor: SECONDARY_COLOR,
                                noOfSections: 5,
                                yAxisLabelWidth: 40, // Explicit width for right axis labels
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
                        <Text style={styles.emptyText}>Select an exercise to analyze</Text>
                    </View>
                )}

                {/* Metrics List */}
                {selectedExercise && (
                    <View style={styles.metricsContainer}>
                        {renderMetricCard(var1.toUpperCase(), metrics1, Theme.Colors.primary)}
                        {renderMetricCard(var2.toUpperCase(), metrics2, SECONDARY_COLOR)}
                    </View>
                )}


            </ScrollView>

            {/* Exercise Picker Modal */}
            <Modal visible={isPickerVisible} animationType="slide">
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setPickerVisible(false)}>
                            <Ionicons name="close" size={24} color={Theme.Colors.text} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Select Exercise</Text>
                    </View>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search exercises..."
                        placeholderTextColor={Theme.Colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <FlatList
                        data={filteredExercises}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.exerciseItem} onPress={() => {
                                setSelectedExercise(item);
                                setPickerVisible(false);
                            }}>
                                <Text style={styles.exerciseName}>{item.name}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.Colors.background,
    },
    scrollContent: {
        padding: Theme.Spacing.m,
        paddingBottom: 50,
    },
    headerTitle: {
        ...Theme.Typography.title,
        marginTop: Theme.Spacing.s,
        marginBottom: Theme.Spacing.l,
    },
    // New Styles
    exerciseSelector: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 14,
        backgroundColor: Theme.Colors.surface,
        borderRadius: 16,
        marginBottom: 20,
    },
    exerciseSelectorText: {
        fontSize: 16,
        fontWeight: '600',
        color: Theme.Colors.text,
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
        backgroundColor: Theme.Colors.surface,
        padding: 12,
        borderRadius: 8,
        marginTop: 4,
        marginBottom: 8,
        // Remove border to match new minimal style, maybe just use bg
    },
    helpText: {
        fontSize: 12,
        color: Theme.Colors.textSecondary,
        lineHeight: 16,
    },
    timeFrameContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: Theme.Spacing.m,
        backgroundColor: Theme.Colors.surface,
        borderRadius: 12,
        padding: 4,
    },
    pill: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        marginHorizontal: 2,
        borderRadius: 10,
        backgroundColor: 'transparent', // Transparent on container
    },
    pillActive: {
        backgroundColor: Theme.Colors.primary,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        elevation: 2,
    },
    pillText: {
        fontSize: 13,
        fontWeight: '600',
        color: Theme.Colors.textSecondary,
    },
    pillTextActive: {
        color: '#FFF',
    },
    aiCard: {
        height: 80,
        backgroundColor: Theme.Colors.surface,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Theme.Spacing.l,
        borderWidth: 1,
        borderColor: Theme.Colors.border,
        borderStyle: 'dashed',
    },
    aiText: {
        ...Theme.Typography.body,
        color: Theme.Colors.textSecondary,
        fontStyle: 'italic',
    },
    chartContainer: {
        backgroundColor: Theme.Colors.surface,
        padding: Theme.Spacing.s,
        paddingRight: 70, // Extra padding for right axis - increased again to prevent clipping
        borderRadius: 12,
        marginBottom: Theme.Spacing.l,
    },
    emptyChart: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: Theme.Colors.textSecondary,
    },
    metricsContainer: {
        flexDirection: 'column',
    },
    metricCard: {
        backgroundColor: Theme.Colors.surface,
        padding: Theme.Spacing.m,
        borderRadius: 12,
        marginBottom: Theme.Spacing.m,
        borderLeftWidth: 4,
        borderColor: Theme.Colors.border,
    },
    metricTitle: {
        ...Theme.Typography.subtitle,
        marginBottom: Theme.Spacing.s,
        textTransform: 'capitalize',
    },
    metricRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    metricLabel: {
        ...Theme.Typography.body,
        color: Theme.Colors.textSecondary,
    },
    metricValue: {
        ...Theme.Typography.body,
        fontWeight: '600',
    },
    rmContainer: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: Theme.Colors.border,
    },
    // Modal
    modalContainer: {
        flex: 1,
        backgroundColor: Theme.Colors.background,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Theme.Spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: Theme.Colors.border,
    },
    modalTitle: {
        ...Theme.Typography.subtitle,
        marginLeft: Theme.Spacing.m,
    },
    searchInput: {
        margin: Theme.Spacing.m,
        padding: Theme.Spacing.m,
        backgroundColor: Theme.Colors.surface,
        borderRadius: 8,
        color: Theme.Colors.text,
    },
    exerciseItem: {
        padding: Theme.Spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: Theme.Colors.border,
    },
    exerciseName: {
        ...Theme.Typography.body,
    },
});
