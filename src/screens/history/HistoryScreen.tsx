import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../theme';
import { supabaseService } from '../../services/SupabaseDataService';
import { WorkoutSession } from '../../models';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { GlowCard } from '../../components/GlowCard';

export const HistoryScreen = () => {
    const navigation = useNavigation<any>();
    const { colors, isDark } = useTheme();
    const [sessions, setSessions] = useState<WorkoutSession[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [menuVisible, setMenuVisible] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 20;

    useEffect(() => {
        loadHistory(0);
    }, []);

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

    const handleDelete = (session: WorkoutSession) => {
        Alert.alert(
            "Delete Workout",
            `Are you sure you want to delete "${session.name || 'Untitled Workout'}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await supabaseService.deleteWorkoutSession(session.id);
                        setSessions(prev => prev.filter(s => s.id !== session.id));
                        setMenuVisible(null);
                    }
                }
            ]
        );
    };

    const handleEdit = (session: WorkoutSession) => {
        setMenuVisible(null);
        navigation.navigate('EditWorkout', { session });
    };

    const renderItem = ({ item }: { item: WorkoutSession }) => {
        const date = new Date(item.date).toLocaleDateString();
        const totalVolume = item.sets.reduce((acc, s) => acc + (s.loadKg || 0) * (s.reps || 0), 0);

        return (
            <View style={styles.cardWrapper}>
                <GlowCard style={styles.card} level="m">
                    <TouchableOpacity
                        style={styles.cardContent}
                        onPress={() => navigation.navigate('WorkoutHistoryDetail', { session: item })}
                    >
                        <View style={styles.cardContent}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name || 'Untitled Workout'}</Text>
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
                            <Text style={[styles.cardDate, { color: colors.textMuted }]}>{date}</Text>
                        </View>
                    </TouchableOpacity>
                </GlowCard>
                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => setMenuVisible(menuVisible === item.id ? null : item.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`More options for ${item.name || 'workout'}`}
                >
                    <Ionicons name="ellipsis-vertical" size={20} color={colors.textMuted} />
                </TouchableOpacity>
                {menuVisible === item.id && (
                    <View style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => handleEdit(item)}
                            accessibilityRole="button"
                            accessibilityLabel="Edit workout"
                        >
                            <Ionicons name="create-outline" size={18} color={colors.text} />
                            <Text style={[styles.menuItemText, { color: colors.text }]}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => handleDelete(item)}
                            accessibilityRole="button"
                            accessibilityLabel="Delete workout"
                        >
                            <Ionicons name="trash-outline" size={18} color={colors.danger} />
                            <Text style={[styles.menuItemText, { color: colors.danger }]}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                )}
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
        position: 'relative',
        marginBottom: Theme.Spacing.m,
    },
    card: {
        borderRadius: 12,
        padding: Theme.Spacing.m,
    },
    menuButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        padding: 8,
        zIndex: 10,
    },
    menu: {
        position: 'absolute',
        top: 40,
        right: 8,
        borderRadius: 8,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 12,
        minWidth: 120,
    },
    menuItemText: {
        fontSize: 15,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '600',
        marginBottom: Theme.Spacing.s,
        paddingRight: 32, // Space for menu button
    },
    cardDate: {
        fontSize: 14,
        alignSelf: 'flex-end',
        marginTop: 4,
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
