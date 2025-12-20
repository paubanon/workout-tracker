import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../theme';
import { supabaseService } from '../../services/SupabaseDataService';
import { Exercise } from '../../models';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { GlowCard } from '../../components/GlowCard';

export const ExerciseListScreen = ({ route }: any) => {
    const navigation = useNavigation<any>();
    const { colors } = useTheme();
    const onSelect = route.params?.onSelect;

    const [search, setSearch] = useState('');
    const [exercises, setExercises] = useState<Exercise[]>([]);

    useEffect(() => {
        loadExercises();
        const unsubscribe = navigation.addListener('focus', loadExercises);
        return unsubscribe;
    }, [navigation]);

    const loadExercises = async () => {
        const data = await supabaseService.getExercises();
        setExercises(data);
    };

    const filtered = exercises.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

    const handleSelect = (exercise: Exercise) => {
        if (onSelect) {
            onSelect(exercise);
            navigation.goBack();
        } else {
            // View details?
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel"
                >
                    <Text style={[styles.backText, { color: colors.primary }]}>Cancel</Text>
                </TouchableOpacity>
                <Text style={[Theme.Typography.subtitle, { color: colors.text }]}>Exercises</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('CreateExercise')}
                    accessibilityRole="button"
                    accessibilityLabel="Create new exercise"
                >
                    <Text style={[styles.actionText, { color: colors.primary }]}>+</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={[styles.searchInput, { backgroundColor: colors.surface, color: colors.text }]}
                    placeholder="Search exercises..."
                    placeholderTextColor={colors.textMuted}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            <FlatList
                data={filtered}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <GlowCard style={styles.item} level="m">
                        <TouchableOpacity style={styles.itemContent} onPress={() => handleSelect(item)}>
                            <Text style={[styles.itemTitle, { color: colors.text }]}>{item.name}</Text>
                            <Text style={[styles.itemSubtitle, { color: colors.textMuted }]}>
                                {(item.enabledMetrics || []).join(', ')}
                            </Text>
                        </TouchableOpacity>
                    </GlowCard>
                )}
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
        padding: Theme.Spacing.m,
        borderBottomWidth: 1,
    },
    backText: {
        fontSize: 17,
    },
    actionText: {
        fontSize: 24,
    },
    searchContainer: {
        padding: Theme.Spacing.m,
    },
    searchInput: {
        padding: Theme.Spacing.s,
        borderRadius: 10,
        fontSize: 17,
    },
    list: {
        paddingHorizontal: Theme.Spacing.m,
    },
    item: {
        borderRadius: 12,
        marginBottom: Theme.Spacing.s,
    },
    itemContent: {
        padding: Theme.Spacing.m,
    },
    itemTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    itemSubtitle: {
        marginTop: 4,
    }
});
