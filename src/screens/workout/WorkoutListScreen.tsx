import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../theme';
import { supabaseService } from '../../services/SupabaseDataService';
import { WorkoutTemplate } from '../../models';
import { useNavigation } from '@react-navigation/native';

export const WorkoutListScreen = () => {
    const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
    const navigation = useNavigation<any>();

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadTemplates();
        });
        loadTemplates(); // Initial load
        return unsubscribe;
    }, [navigation]);

    const loadTemplates = async () => {
        const data = await supabaseService.getTemplates();
        setTemplates(data);
    };


    const renderHeader = () => (
        <View style={styles.header}>
            <Text style={styles.title}>Workout</Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Start</Text>
                <TouchableOpacity
                    style={styles.quickStartButton}
                    onPress={() => navigation.navigate('ActiveSession', { templateId: null })}
                >
                    <Text style={styles.quickStartText}>+ Start Empty Workout</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Routines</Text>
            </View>
        </View>
    );

    const renderItem = ({ item }: { item: WorkoutTemplate }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <TouchableOpacity>
                    <Text style={{ color: Theme.Colors.textSecondary }}>•••</Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.cardSubtitle}>{item.exerciseIds.length} Exercises</Text>

            <TouchableOpacity
                style={styles.startButton}
                onPress={() => navigation.navigate('ActiveSession', { templateId: item.id })}
            >
                <Text style={styles.startButtonText}>Start Routine</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <FlatList
                data={templates}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.Colors.background,
    },
    content: {
        padding: Theme.Spacing.m,
    },
    header: {
        marginBottom: Theme.Spacing.l,
    },
    title: {
        ...Theme.Typography.title,
        marginBottom: Theme.Spacing.l,
    },
    section: {
        marginBottom: Theme.Spacing.l,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Theme.Spacing.s,
    },
    sectionTitle: {
        ...Theme.Typography.subtitle,
        marginBottom: Theme.Spacing.s,
    },
    quickStartButton: {
        backgroundColor: Theme.Colors.surface,
        padding: Theme.Spacing.m,
        borderRadius: 12,
        alignItems: 'center',
    },
    quickStartText: {
        ...Theme.Typography.body,
        fontWeight: '600',
        color: Theme.Colors.text,
    },
    card: {
        backgroundColor: Theme.Colors.surface,
        padding: Theme.Spacing.m,
        borderRadius: 12,
        marginBottom: Theme.Spacing.m,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Theme.Spacing.s,
    },
    cardTitle: {
        ...Theme.Typography.body,
        fontWeight: '600',
    },
    cardSubtitle: {
        ...Theme.Typography.caption,
        marginBottom: Theme.Spacing.m,
    },
    startButton: {
        backgroundColor: Theme.Colors.primary,
        paddingVertical: Theme.Spacing.s,
        borderRadius: 8,
        alignItems: 'center',
    },
    startButtonText: {
        ...Theme.Typography.body,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    iconButton: {
        fontSize: 24,
        color: Theme.Colors.text,
    }
});
