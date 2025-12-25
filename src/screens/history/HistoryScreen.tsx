import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../theme';
import { supabaseService } from '../../services/SupabaseDataService';
import { WorkoutSession } from '../../models';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { GlowCard } from '../../components/GlowCard';

export const HistoryScreen = () => {
    const navigation = useNavigation<any>();
    const { colors, isDark, formatDate } = useTheme();
    const [sessions, setSessions] = useState<WorkoutSession[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 20;

    useFocusEffect(
        React.useCallback(() => {
            setPage(0);
            loadHistory(0);
        }, [])
    );

    const loadHistory = async (offset: number) => {
        if (loading) return; // Only prevent if already loading
        setLoading(true);
        const data = await supabaseService.getWorkoutSessions(LIMIT, offset);

        // If we got less data than requested, we've reached the end
        if (data.length < LIMIT) {
            setHasMore(false);
        }

        if (offset === 0) {
            setSessions(data);
            setHasMore(data.length >= LIMIT);
        } else {
            setSessions(prev => [...prev, ...data]);
        }
        setLoading(false);
    };

    const handleLoadMore = () => {
        if (!hasMore) return; // Don't try to load more if we know there's no more
        const nextPage = page + 1;
        setPage(nextPage);
        loadHistory(nextPage * LIMIT);
    };

    const renderItem = ({ item }: { item: WorkoutSession }) => {
        const date = formatDate(item.date);
        const totalVolume = item.sets.reduce((acc, s) => acc + (s.loadKg || 0) * (s.reps || 0), 0);

        return (
            <View style={styles.cardWrapper}>
                <GlowCard style={styles.card} level="m">
                    <TouchableOpacity
                        style={styles.cardContent}
                        onPress={() => navigation.navigate('WorkoutHistoryDetail', { session: item })}
                    >
                        <View style={styles.cardHeader}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name || 'Untitled Workout'}</Text>
                            <Text style={[styles.cardDate, { color: colors.textMuted }]}>{date}</Text>
                        </View>
                        <View style={styles.statsRow}>
                            <View style={styles.stat}>
                                <Ionicons name="barbell-outline" size={16} color={colors.textMuted} />
                                <Text style={[styles.statText, { color: colors.textMuted }]}>{totalVolume} kg</Text>
                            </View>
                            <View style={styles.stat}>
                                <Ionicons name="layers-outline" size={16} color={colors.textMuted} />
                                <Text style={[styles.statText, { color: colors.textMuted }]}>{item.sets.length} Sets</Text>
                            </View>
                            {item.durationSeconds ? (
                                <View style={styles.stat}>
                                    <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                                    <Text style={[styles.statText, { color: colors.textMuted }]}>{Math.floor(item.durationSeconds / 60)}m</Text>
                                </View>
                            ) : null}
                        </View>
                    </TouchableOpacity>
                </GlowCard>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <Ionicons name="arrow-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>History</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={sessions}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={loading ? <ActivityIndicator color={colors.primary} /> : null}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Theme.Spacing.m,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    list: {
        padding: Theme.Spacing.m,
    },
    cardWrapper: {
        marginBottom: Theme.Spacing.m,
    },
    card: {
        borderRadius: 12,
        padding: Theme.Spacing.m,
    },
    cardContent: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Theme.Spacing.s,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '600',
        flex: 1,
    },
    cardDate: {
        fontSize: 14,
        marginLeft: Theme.Spacing.s,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 14,
    }
});
