import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../theme';
import { supabaseService } from '../../services/SupabaseDataService';
import { Exercise } from '../../models';
import { useNavigation } from '@react-navigation/native';

export const ExerciseListScreen = ({ route }: any) => {
    const navigation = useNavigation<any>();
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
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={Theme.Typography.subtitle}>Exercises</Text>
                <TouchableOpacity onPress={() => navigation.navigate('CreateExercise')}>
                    <Text style={styles.actionText}>+</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search exercises..."
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            <FlatList
                data={filtered}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
                        <Text style={styles.itemTitle}>{item.name}</Text>
                        <Text style={styles.itemSubtitle}>
                            {(item.enabledMetrics || []).join(', ')}
                        </Text>
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.list}
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Theme.Spacing.m,
        backgroundColor: Theme.Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Theme.Colors.border,
    },
    backText: {
        color: Theme.Colors.primary,
        fontSize: 17,
    },
    actionText: {
        color: Theme.Colors.primary,
        fontSize: 24,
    },
    searchContainer: {
        padding: Theme.Spacing.m,
    },
    searchInput: {
        backgroundColor: Theme.Colors.inputBackground,
        padding: Theme.Spacing.s,
        borderRadius: 10,
        fontSize: 17,
    },
    list: {
        paddingHorizontal: Theme.Spacing.m,
    },
    item: {
        backgroundColor: Theme.Colors.surface,
        padding: Theme.Spacing.m,
        borderRadius: 12,
        marginBottom: Theme.Spacing.s,
    },
    itemTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    itemSubtitle: {
        color: Theme.Colors.textSecondary,
        marginTop: 4,
    }
});
