import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, Modal } from 'react-native';
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
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('WorkoutHistoryDetail', { session: item })}
                >
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>{item.name || 'Untitled Workout'}</Text>
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
                        <Text style={styles.cardDate}>{date}</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => setMenuVisible(menuVisible === item.id ? null : item.id)}
                >
                    <Ionicons name="ellipsis-vertical" size={20} color={Theme.Colors.textSecondary} />
                </TouchableOpacity>
                {menuVisible === item.id && (
                    <View style={styles.menu}>
                        <TouchableOpacity style={styles.menuItem} onPress={() => handleEdit(item)}>
                            <Ionicons name="create-outline" size={18} color={Theme.Colors.text} />
                            <Text style={styles.menuItemText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={() => handleDelete(item)}>
                            <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                            <Text style={[styles.menuItemText, { color: '#FF3B30' }]}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
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
    cardWrapper: {
        position: 'relative',
        marginBottom: Theme.Spacing.m,
    },
    card: {
        backgroundColor: Theme.Colors.surface,
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
        backgroundColor: Theme.Colors.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Theme.Colors.border,
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
        color: Theme.Colors.text,
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
        color: Theme.Colors.textSecondary,
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
        color: Theme.Colors.textSecondary,
        fontSize: 14,
    }
});
