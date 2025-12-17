import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../theme';
import { supabaseService } from '../../services/SupabaseDataService';
import { WorkoutSession } from '../../models';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export const HistoryScreen = () => {
    const navigation = useNavigation<any>();
    const [sessions, setSessions] = useState<WorkoutSession[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const LIMIT = 20;

    useEffect(() => {
        loadHistory(0);
    }, []);

    const loadHistory = async (offset: number) => {
        if (loading) return;
        setLoading(true);
        const data = await supabaseService.getWorkoutSessions(LIMIT, offset);
        if (offset === 0) {
            setSessions(data);
        } else {
            setSessions(prev => [...prev, ...data]);
        }
        setLoading(false);
    };

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        loadHistory(nextPage * LIMIT);
    };

    const renderItem = ({ item }: { item: WorkoutSession }) => {
        const date = new Date(item.date).toLocaleDateString();
        const totalVolume = item.sets.reduce((acc, s) => acc + (s.loadKg || 0) * (s.reps || 0), 0);

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('WorkoutHistoryDetail', { session: item })}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.name || 'Untitled Workout'}</Text>
                    <Text style={styles.cardDate}>{date}</Text>
                </View>
                <View style={styles.statsRow}>
                    <View style={styles.stat}>
                        <Ionicons name="barbell-outline" size={16} color={Theme.Colors.textSecondary} />
                        <Text style={styles.statText}>{totalVolume} kg</Text>
                    </View>
                    <View style={styles.stat}>
                        <Ionicons name="layers-outline" size={16} color={Theme.Colors.textSecondary} />
                        <Text style={styles.statText}>{item.sets.length} Sets</Text>
                    </View>
                    {item.durationSeconds ? (
                        <View style={styles.stat}>
                            <Ionicons name="time-outline" size={16} color={Theme.Colors.textSecondary} />
                            <Text style={styles.statText}>{Math.floor(item.durationSeconds / 60)}m</Text>
                        </View>
                    ) : null}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <Text style={Theme.Typography.subtitle}>History</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={sessions}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={loading ? <ActivityIndicator color={Theme.Colors.primary} /> : null}
            />
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
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Theme.Spacing.m,
        backgroundColor: Theme.Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Theme.Colors.border,
    },
    list: {
        padding: Theme.Spacing.m,
    },
    card: {
        backgroundColor: Theme.Colors.surface,
        borderRadius: 12,
        padding: Theme.Spacing.m,
        marginBottom: Theme.Spacing.m,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Theme.Spacing.s,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    cardDate: {
        fontSize: 14,
        color: Theme.Colors.textSecondary,
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
        color: Theme.Colors.textSecondary,
        fontSize: 14,
    }
});
