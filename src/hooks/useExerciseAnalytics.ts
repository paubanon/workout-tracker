import { useState, useEffect, useMemo } from 'react';
import { supabaseService } from '../services/SupabaseDataService';
import { Exercise, WorkoutSession, SetLog } from '../models';

export type TimeFrame = '1M' | '3M' | '6M' | '1Y' | 'ALL' | 'CUSTOM';

export interface DataPoint {
    date: string;
    value1: number;
    value2: number;
    // For regression or other needs
    timestamp: number;
}

export interface AnalyticsMetrics {
    max: number;
    min: number;
    avg: number;
    volume: number;
    est1RM?: number;
    est3RM?: number;
    est5RM?: number;
    trend: 'ascending' | 'descending' | 'plateauing' | 'insufficient_data';
}

export interface VariableMetrics {
    [variable: string]: AnalyticsMetrics;
}

export const useExerciseAnalytics = (exerciseId: string | null) => {
    const [sessions, setSessions] = useState<WorkoutSession[]>([]);
    const [loading, setLoading] = useState(false);

    // Default timeframe
    const [timeFrame, setTimeFrame] = useState<TimeFrame>('1M');
    const [customDays, setCustomDays] = useState<number>(30); // Default for custom

    // Fetch history when exercise changes
    useEffect(() => {
        if (!exerciseId) {
            setSessions([]);
            return;
        }

        const fetchHistory = async () => {
            setLoading(true);
            const data = await supabaseService.getExerciseHistory(exerciseId);
            setSessions(data);
            setLoading(false);
        };

        fetchHistory();
    }, [exerciseId]);

    // Filter sessions by timeframe
    const filteredSessions = useMemo(() => {
        if (!sessions.length) return [];

        const now = new Date();
        let cutoffDate = new Date();

        switch (timeFrame) {
            case '1M': cutoffDate.setMonth(now.getMonth() - 1); break;
            case '3M': cutoffDate.setMonth(now.getMonth() - 3); break;
            case '6M': cutoffDate.setMonth(now.getMonth() - 6); break;
            case '1Y': cutoffDate.setFullYear(now.getFullYear() - 1); break;
            case 'ALL': cutoffDate = new Date(0); break; // Epoch
            case 'CUSTOM': cutoffDate.setDate(now.getDate() - customDays); break;
        }

        return sessions.filter(s => new Date(s.date) >= cutoffDate);
    }, [sessions, timeFrame, customDays]);

    // Helper to extract best set value for a variable in a session
    // Now supports 'min', 'avg', 'max', 'sum'
    const getSessionValue = (session: WorkoutSession, variable: string, aggType: 'max' | 'sum' | 'min' | 'avg' = 'max'): number | null => {
        const relevantSets = session.sets.filter(s => s.exerciseId === exerciseId);
        if (!relevantSets.length) return null;

        const values = relevantSets.map(s => {
            switch (variable) {
                case 'load': return s.loadKg || 0;
                case 'reps': return s.reps || 0;
                case 'time': return s.timeSeconds || 0;
                case 'distance': return s.distanceMeters || 0;
                case 'rom': return s.romCm || 0;
                // 'volume' is computed differently (load * reps)
                default: return 0;
            }
        });

        if (variable === 'volume') {
            // Volume is ALWAYS Sum of (Load * Reps) for all sets, regardless of aggregation (unless user explicitly wants max volume set?)
            // User request: "Except for the Volume, which is a global variable for the session."
            return relevantSets.reduce((acc, s) => acc + ((s.loadKg || 0) * (s.reps || 0)), 0);
        }

        if (aggType === 'sum') return values.reduce((a, b) => a + b, 0);
        if (aggType === 'avg') return values.reduce((a, b) => a + b, 0) / values.length;
        if (aggType === 'min') return Math.min(...values);

        return Math.max(...values);
    };

    // Calculate Trend (Slope of linear regression)
    // We use Index-based regression (X = 0, 1, 2...) to ensure the line is visually straight 
    // on the chart, which plots sessions equidistantly regardless of time gaps.
    const calculateTrendStats = (dataPoints: { y: number }[]): { slope: number, regressionPoints: { value: number }[] } => {
        if (dataPoints.length < 2) return { slope: 0, regressionPoints: [] };

        const n = dataPoints.length;
        // X is just the index 0 to n-1
        // sumX of 0..n-1 = n(n-1)/2
        let sumX = 0;
        let sumY = 0;
        let sumXY = 0;
        let sumXX = 0;

        for (let i = 0; i < n; i++) {
            const x = i;
            const y = dataPoints[i].y;
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumXX += x * x;
        }

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Generate points for the regression line
        const regressionPoints = dataPoints.map((_, i) => ({
            value: slope * i + intercept
        }));

        return { slope, regressionPoints };
    };

    // Calculate Est 1RM (Epley Formula)
    const calculateEst1RM = (weight: number, reps: number): number => {
        if (reps === 1) return weight;
        if (reps === 0) return 0;
        return weight * (1 + reps / 30);
    };

    // Compute Metrics for a specific variable
    // We update computeMetrics to accept an aggregation for the "Trend" calculation?
    // User said: "Meanwhile, the bottom of the screen should show the maximum, average, and minimum for the selected entire period."
    // This implies the cards show global stats (Best Ever, etc) independent of plot aggregation.
    // So computeMetrics stays "Best of All Time" or "Avg of All Time".
    // BUT the Trend? "I would like to show this [regression]... for the data points."
    // So regression MUST match the plot aggregation.

    // Shared helper to get all aggregated session data points
    const getSessionDataHistory = useMemo(() => {
        return filteredSessions.map(s => {
            const load = getSessionValue(s, 'load', 'max') || 0;
            const reps = getSessionValue(s, 'reps', 'max') || 0;
            const volume = getSessionValue(s, 'volume', 'sum') || 0;
            const rom = getSessionValue(s, 'rom', 'max') || 0;
            const time = getSessionValue(s, 'time', 'max') || 0;
            const distance = getSessionValue(s, 'distance', 'max') || 0;

            return {
                date: s.date,
                load,
                reps,
                volume,
                rom,
                time,
                distance,
                originalSession: s
            };
        }).filter(d => d.load > 0 || d.volume > 0 || d.reps > 0 || d.time > 0 || d.distance > 0 || d.rom > 0);
    }, [filteredSessions, exerciseId]);

    const computeMetrics = (variable: string, aggType: 'max' | 'min' | 'avg' = 'max'): AnalyticsMetrics & { regressionData?: { value: number }[] } => {
        const values = getSessionDataHistory.map(d => {
            if (variable === 'volume') return d.volume;
            // For other variables, getSessionValue already handled max/min/avg but we used max in getSessionDataHistory
            // RE-CALCULATE if aggType is different? Actually, let's just use what getSessionValue returns for that session
            const val = getSessionValue(d.originalSession, variable, aggType);
            return val || 0;
        }); // DO NOT FILTER - we need all sessions to match chart data

        if (values.length === 0) {
            return { max: 0, min: 0, avg: 0, volume: 0, trend: 'insufficient_data' };
        }

        // For statistics, we DO want to filter zeros
        const nonZeroValues = values.filter(v => v > 0);
        const max = nonZeroValues.length > 0 ? Math.max(...nonZeroValues) : 0;
        const min = nonZeroValues.length > 0 ? Math.min(...nonZeroValues) : 0;
        const avg = nonZeroValues.length > 0 ? nonZeroValues.reduce((a, b) => a + b, 0) / nonZeroValues.length : 0;
        const totalVolume = getSessionDataHistory.reduce((acc, d) => acc + d.volume, 0);

        // Regression uses ALL values (including zeros) to match chart positioning
        const { slope, regressionPoints } = calculateTrendStats(values.map(v => ({ y: v })));

        let trend: 'ascending' | 'descending' | 'plateauing' | 'insufficient_data' = 'insufficient_data';
        if (nonZeroValues.length < 2) {
            trend = 'insufficient_data';
        } else if (slope > 0.1) {
            trend = 'ascending';
        } else if (slope < -0.1) {
            trend = 'descending';
        } else {
            trend = 'plateauing';
        }

        // Est 1RM max across all sessions
        let maxEst1RM = 0;
        getSessionDataHistory.forEach(d => {
            const relevantSets = d.originalSession.sets.filter(set => set.exerciseId === exerciseId);
            relevantSets.forEach(set => {
                const e1rm = calculateEst1RM(set.loadKg || 0, set.reps || 0);
                if (e1rm > maxEst1RM) maxEst1RM = e1rm;
            });
        });

        let est1RM, est3RM, est5RM;
        if ((variable === 'load' || variable === 'rom') && maxEst1RM > 0) {
            est1RM = maxEst1RM;
            est3RM = maxEst1RM * 0.93;
            est5RM = maxEst1RM * 0.87;
        }

        return { max, min, avg, volume: totalVolume, trend, est1RM, est3RM, est5RM, regressionData: regressionPoints };
    };

    // Generate Chart Data
    const getChartData = (var1: string, var2: string, agg1: 'max' | 'min' | 'avg' = 'max', agg2: 'max' | 'min' | 'avg' = 'max') => {
        return getSessionDataHistory.map(d => {
            const val1 = var1 === 'volume' ? d.volume : (getSessionValue(d.originalSession, var1, agg1) || 0);
            const val2 = var2 === 'none' ? 0 : (var2 === 'volume' ? d.volume : (getSessionValue(d.originalSession, var2, agg2) || 0));

            return {
                date: new Date(d.date),
                label: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                value: val1,
                dataPointText: val1.toString(),
                secondaryValue: val2
            };
        });
    };

    return {
        sessions: filteredSessions,
        loading,
        timeFrame,
        setTimeFrame,
        customDays,
        setCustomDays,
        computeMetrics,
        getChartData
    };
};
