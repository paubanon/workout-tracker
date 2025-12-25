import React, { useState, useCallback, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { GlowCard } from '../../components/GlowCard';
import { supabaseService } from '../../services/SupabaseDataService';
import { Exercise, ExerciseGoal } from '../../models';
import { CircularProgress } from '../../components/CircularProgress';

export const GoalsListScreen = () => {
    const navigation = useNavigation<any>();
    const { colors, isDark } = useTheme();
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [resultList, setResultList] = useState<Exercise[]>([]);
    const [goalsMap, setGoalsMap] = useState<Map<string, ExerciseGoal[]>>(new Map());
    const [loading, setLoading] = useState(true);
    const [searchVisible, setSearchVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const loadData = async () => {
        setLoading(true);
        try {
            const [allGoals, allExercises, usedIds] = await Promise.all([
                supabaseService.getGoals(),
                supabaseService.getExercises(),
                supabaseService.getUsedExerciseIds()
            ]);

            // Map goals
            const map = new Map<string, ExerciseGoal[]>();
            allGoals.forEach(g => {
                const existing = map.get(g.exerciseId) || [];
                existing.push(g);
                map.set(g.exerciseId, existing);
            });
            setGoalsMap(map);

            // Filter exercises: Must be in usedIds OR have a goal
            const usedSet = new Set(usedIds);
            const filtered = allExercises.filter(e => usedSet.has(e.id) || map.has(e.id));

            // Sort: Active goals first, then alphabetical
            filtered.sort((a, b) => {
                const aHasGoal = map.has(a.id);
                const bHasGoal = map.has(b.id);
                if (aHasGoal && !bHasGoal) return -1;
                if (!aHasGoal && bHasGoal) return 1;
                return a.name.localeCompare(b.name);
            });

            setExercises(filtered);
            setResultList(filtered);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    // Search Logic - Manual Header Implementation
    React.useEffect(() => {
        if (!searchQuery) {
            setResultList(exercises);
        } else {
            const q = searchQuery.toLowerCase();
            setResultList(exercises.filter(e => e.name.toLowerCase().includes(q)));
        }
    }, [searchQuery, exercises]);

    const renderItem = ({ item }: { item: Exercise }) => {
        const goals = goalsMap.get(item.id) || [];
        const activeGoals = goals.filter(g => !g.completed);
        const completedGoals = goals.filter(g => g.completed);
        const hasActive = activeGoals.length > 0;

        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate('ExerciseGoals', {
                    exerciseId: item.id,
                    exerciseName: item.name,
                    enabledMetrics: item.enabledMetrics,
                    repsType: item.repsType,
                    trackBodyWeight: item.trackBodyWeight
                })}
            >
                <GlowCard style={[styles.card, { backgroundColor: colors.surface }]}>
                    <View style={styles.cardContent}>
                        <View style={styles.info}>
                            <Text style={[styles.exerciseName, { color: colors.text }]}>{item.name}</Text>
                            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                                {hasActive
                                    ? `${activeGoals.length} Active Goal${activeGoals.length > 1 ? 's' : ''}`
                                    : completedGoals.length > 0 ? 'All goals completed' : 'No active goals'}
                            </Text>
                        </View>

                        <View style={styles.status}>
                            <Ionicons
                                name="chevron-forward"
                                size={20}
                                color={colors.textMuted}
                            />
                        </View>
                    </View>
                </GlowCard>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>My Goals</Text>
                <TouchableOpacity onPress={() => setSearchVisible(prev => !prev)}>
                    <Ionicons name="search" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {searchVisible && (
                <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                    <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search exercises..."
                        placeholderTextColor={colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus
                    />
                    <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchVisible(false); }}>
                        <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>
            )}

            <FlatList
                data={resultList}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: Theme.Typography.scale.lg,
        fontWeight: '600',
    },
    list: {
        padding: 16,
    },
    card: {
        marginBottom: 12,
        borderRadius: 16,
        padding: 4,
    },
    cardContent: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    info: {
        flex: 1,
    },
    exerciseName: {
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
    },
    status: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 4,
    }
});
