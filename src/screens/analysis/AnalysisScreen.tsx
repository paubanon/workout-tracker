import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, FlatList, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useExerciseAnalytics, TimeFrame } from '../../hooks/useExerciseAnalytics';
import { supabaseService } from '../../services/SupabaseDataService';
import { Exercise } from '../../models';
import { LineChart } from "react-native-gifted-charts";

export const AnalysisScreen = () => {
    // --- State ---
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
    const [exercises, setExercises] = useState<Exercise[]>([]);

    // UI selectors
    const [var1, setVar1] = useState<string>('load');
    const [var2, setVar2] = useState<string>('reps');
    const [agg1, setAgg1] = useState<'max' | 'avg' | 'min'>('max');
    const [agg2, setAgg2] = useState<'max' | 'avg' | 'min'>('max');

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
    const primaryMax = max1 > 0 ? max1 * 1.2 : 100;
    const secondaryMax = max2 > 0 ? max2 * 1.2 : 10;
    const scaleFactor = primaryMax / secondaryMax;

    const regression2Final = regression2.map(d => ({
        value: d.value * scaleFactor, // Scale to primary axis range
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

    const renderAggToggle = (metric: string, current: string, setFunc: any) => {
        if (metric === 'volume' || metric === 'none') return null;
        return (
            <View style={styles.aggContainer}>
                {(['max', 'avg', 'min'] as const).map(agg => (
                    <TouchableOpacity
                        key={agg}
                        style={[styles.aggPill, current === agg && styles.aggPillActive]}
                        onPress={() => setFunc(agg)}
                    >
                        <Text style={[styles.aggText, current === agg && styles.aggTextActive]}>{agg.toUpperCase()}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.headerTitle}>Analysis</Text>

                {/* Exercise Selector */}
                <TouchableOpacity style={styles.selectorButton} onPress={() => setPickerVisible(true)}>
                    <Text style={styles.selectorButtonText}>
                        {selectedExercise ? selectedExercise.name : "Select Exercise ▽"}
                    </Text>
                </TouchableOpacity>

                {/* Variable Selector: Left */}
                <View style={styles.varRowContainer}>
                    <Text style={styles.label}>Left Axis</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                        {availableVariables.map(v => (
                            <TouchableOpacity
                                key={v}
                                style={[styles.pillSmall, var1 === v && styles.pillSmallActive]}
                                onPress={() => setVar1(v)}
                            >
                                <Text style={[styles.pillTextSmall, var1 === v && styles.pillTextActive]}>{v}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    {renderAggToggle(var1, agg1, setAgg1)}
                </View>

                {/* Variable Selector: Right */}
                <View style={[styles.varRowContainer, { marginTop: 10 }]}>
                    <Text style={styles.label}>Right Axis</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                        {availableVariablesRight.map(v => (
                            <TouchableOpacity
                                key={v}
                                style={[styles.pillSmall, var2 === v && styles.pillSmallActive]}
                                onPress={() => setVar2(v)}
                            >
                                <Text style={[styles.pillTextSmall, var2 === v && styles.pillTextActive]}>{v}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    {renderAggToggle(var2, agg2, setAgg2)}
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
    selectorButton: {
        padding: Theme.Spacing.m,
        backgroundColor: Theme.Colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Theme.Colors.border,
        alignItems: 'center',
        marginBottom: Theme.Spacing.m,
    },
    selectorButtonText: {
        ...Theme.Typography.body,
        fontWeight: '600',
    },
    variableRow: {
        flexDirection: 'row',
        marginBottom: Theme.Spacing.s,
    },
    varContainer: {
        flex: 1,
    },
    label: {
        ...Theme.Typography.caption,
        color: Theme.Colors.textSecondary,
        marginBottom: 4,
    },
    pillSmall: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: Theme.Colors.surface,
        borderWidth: 1,
        borderColor: Theme.Colors.border,
        marginRight: 6,
    },
    pillSmallActive: {
        backgroundColor: Theme.Colors.primary,
        borderColor: Theme.Colors.primary,
    },
    pillTextSmall: {
        fontSize: 12,
        color: Theme.Colors.text,
    },
    pillTextActive: {
        color: '#FFF',
    },
    timeFrameContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: Theme.Spacing.m,
    },
    pill: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
        marginHorizontal: 2,
        borderRadius: 8,
        backgroundColor: Theme.Colors.surface,
    },
    pillActive: {
        backgroundColor: Theme.Colors.primary,
    },
    pillText: {
        ...Theme.Typography.caption,
        fontWeight: '600',
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
    varRowContainer: {
        marginBottom: Theme.Spacing.s,
    },
    aggContainer: {
        flexDirection: 'row',
        marginTop: 4,
    },
    aggPill: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 6,
        backgroundColor: Theme.Colors.background,
        borderWidth: 1,
        borderColor: Theme.Colors.border,
    },
    aggPillActive: {
        backgroundColor: Theme.Colors.text, // Subtle dark/light indicator
        borderColor: Theme.Colors.text,
    },
    aggText: {
        fontSize: 10,
        color: Theme.Colors.textSecondary,
    },
    aggTextActive: {
        color: Theme.Colors.background,
        fontWeight: 'bold',
    },
});
